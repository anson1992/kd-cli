/**
 * 创建项目
 * @param {*} projectName 项目名称
 */
const { promisify } = require('util')
const axios = require('axios')
const inquirer = require('inquirer')
const ora = require('ora')
const chalk = require('chalk')
const downloadGitRepo = promisify(require('download-git-repo'))
const { downloadDirectory } = require('../utils/constants')
// 彩色日志输出
const log = (content) => console.log(chalk.green(content))
/**
 * 从github拉取所有的模板列表
 * @returns
 */
const fetchReportList = async () => {
  const { data } = await axios.get(
    'https://api.github.com/orgs/front-template-cli/repos'
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
    `https://api.github.com/repos/front-template-cli/${repo}/tags`
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
  console.log('download:', downloadResult)
}
