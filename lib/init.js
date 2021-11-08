const { promisify } = require('util')
const path = require('path')
var program = require('commander')
const inquirer = require('inquirer')
const figlet = promisify(require('figlet'))
const chalk = require('chalk')
const clear = require('clear')
const create = require('./create')

// 版本号
const version = require('../package.json').version
// 操作集合
const actionMap = {
  create: {
    alias: 'c',
    description: 'create a new project',
    example: ['kd-cli create <project-name>'],
  },
  config: {
    alias: 'conf',
    description: 'project of config',
    example: ['kd-cli config set <k> <v>', 'kd-cli config get <k>'],
  },
  '*': {
    alias: '',
    description: 'commond not found',
    example: [],
  },
}
Reflect.ownKeys(actionMap).forEach((action) => {
  const { alias, description } = actionMap[action]
  program
    .command(action)
    .alias(alias) // 设置别名
    .description(description) // 添加描述
    .action(() => {
      if (action === '*') {
        console.log(chalk.red(description))
      } else if (action === 'create') {
        require(path.resolve(__dirname, action))(...process.argv.slice(3))
      }
    })
})
// 监听用户的help事件
program.on('--help', () => {
  console.log('\nExamples:')
  Reflect.ownKeys(actionMap).forEach((action) => {
    actionMap[action].example.forEach((example) => {
      console.log(`${example}`)
    })
  })
})
// 解析用户传递的参数
program.version(version).parse(process.argv)
// 首先清屏
// clear()
// 打印欢迎界面
// const data = figlet('KD-CLI Welcome')
// log(data)
// log(`🚀 创建项目：${name}`)
module.exports = async (name) => {}
