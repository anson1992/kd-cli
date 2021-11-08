const { promisify } = require('util')
const path = require('path')
var program = require('commander')
const chalk = require('chalk')
const clear = require('clear')
const figlet = promisify(require('figlet'))

// 版本号
const version = require('../package.json').version
// 彩色日志输出
const log = (content) => console.log(chalk.green(content))
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
    .action(async () => {
      if (action === '*') {
        console.log(chalk.red(description))
      } else if (action === 'create') {
        const projectName = process.argv.slice(3)
        // 首先清屏
        clear()
        // 打印欢迎界面
        const data = await figlet('KD-CLI Welcome')
        log(data)
        if (projectName.length > 0) {
          require(path.resolve(__dirname, action))(...projectName)
        } else {
          console.log(chalk.red('❌ project name is undefined'))
        }
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
