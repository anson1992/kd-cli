/**
 * 创建项目
 * @param {*} projectName 项目名称
 */
const { promisify } = require('util')
const fs = require('fs')
const axios = require('axios')
const inquirer = require('inquirer')
const ora = require('ora')
const chalk = require('chalk')
const downloadGitRepo = promisify(require('download-git-repo'))
const ncp = require('ncp')
// 遍历文件夹，是否需要渲染
const metalSmith = require('metalsmith')
// 统一了所有的模板引擎
const { render } = require('consolidate').ejs
const { downloadDirectory } = require('../utils/constants')
const path = require('path')

// 彩色日志输出
const log = (content) => console.log(chalk.green(content))
/**
 * 从github拉取所有的模板列表
 * @returns
 */
const fetchReportList = async () => {
  const { data } = await axios.get(
    'https://api.github.com/orgs/front-template-cli/repos',
    {
      proxy: false,
    }
  )
  return data
}
/**
 * 获取指定仓库的版本号
 * @param {*} repo 指定仓库
 * @returns
 */
const fetchTagList = async (repo) => {
  const { data } = await axios.get(
    `https://api.github.com/repos/front-template-cli/${repo}/tags`,
    {
      proxy: false,
    }
  )
  return data
}
/**
 * git仓库模板下载
 * @param {*} repo 仓库地址
 * @param {*} tag 版本号
 * @returns
 */
const download = async (repo, tag) => {
  let api = `front-template-cli/${repo}`
  if (tag) {
    api += `#${tag}`
  }
  const dist = `${downloadDirectory}/${repo}`
  await downloadGitRepo(api, dist)
  return dist
}
/**
 * loading
 * @param {*} fn
 * @param {*} message
 * @returns
 */
const waitFnLoading =
  (fn, message) =>
  async (...args) => {
    // 显示loading
    const process = ora(message)
    process.start()
    const result = await fn(...args)
    process.succeed()
    return result
  }
// 安装依赖包-输出流可现
const spawn = async (...args) => {
  const { spawn } = require('child_process')
  return new Promise((resolve) => {
    const proc = spawn(...args)
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
    proc.on('close', () => {
      resolve()
    })
  })
}
module.exports = async (projectName) => {
  // 1) 获取所有的模板
  // 仓库地址： https://api.github.com/orgs/front-template-cli/repos
  log(`🚀 创建项目：${projectName}`)
  let repost = await waitFnLoading(fetchReportList, `初始化模板仓库...`)()
  repost = repost.map((item) => item.name)
  // 选择模板
  const { repo } = await inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: 'please choise a template:',
    choices: repost,
  })
  // 2) 选择当前项目，拉取对应的版本
  // 获取对应的版本号： https://api.github.com/repos/front-template-cli/${repo}/tags
  let tags = await waitFnLoading(fetchTagList, '获取模板版本号...')(repo)
  tags = tags.map((item) => item.name)
  // 选择版本号
  const { tag } = await inquirer.prompt({
    name: 'tag',
    type: 'list',
    message: 'please choise a tags:',
    choices: tags,
  })
  // 3) download git repo
  const downloadResult = await waitFnLoading(download, '下载中...')(repo, tag)
  log(`✅ download success: ${projectName}`)
  // 4) 把download template的文件，拷贝到指定目录下
  // 判断当前项目是否存在

  // 如果有ask.js文件
  if (!fs.existsSync(path.join(downloadResult, 'ask.js'))) {
    await ncp(downloadResult, path.resolve(projectName))
  } else {
    // 复杂模板，用户定制化项目信息
    await new Promise((resolve, reject) => {
      metalSmith(__dirname)
        .source(downloadResult)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          const args = require(path.join(downloadResult, 'ask.js'))
          if (args[0].name === 'name') {
            args[0].default = projectName
          }
          const argResult = await inquirer.prompt(args)
          const meta = metal.metadata()
          delete files['ask.js']
          Object.assign(meta, argResult)
          done()
        })
        .use((files, metal, done) => {
          // 根据用户输入的信息，下载模板
          let meta = metal.metadata()
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString() // 文件的内容
              if (content.includes('<%')) {
                content = await render(content, meta)
                files[file].contents = Buffer.from(content) // 渲染
              }
            }
          })
          done()
          log(`${projectName} done success!`)
        })
        .build((err) => {
          if (err) {
            reject()
          } else {
            resolve()
          }
        })
    })
  }
  // 自动安装依赖
  log('🔨 安装依赖')
  await spawn('yarn', [], { cwd: `./${projectName}` })
  log(
    chalk.green(`
👌🏻 安装完成：
To get Start:
======================
cd ${projectName}
npm run dev
======================
    `)
  )
  log('👌🏻 安装依赖')
  // 启动
  await spawn('npm', ['run', 'dev'], { cwd: `./${projectName}` })
}
