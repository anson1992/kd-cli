const { promisify } = require('util')
var program = require('commander')
const inquirer = require('inquirer')
const figlet = promisify(require('figlet'))
const chalk = require('chalk')
const clear = require('clear')
// 彩色日志输出
const log = (content) => console.log(chalk.green(content))
module.exports = async (name) => {
  console.log(name)
  // 首先清屏
  clear()
  // 打印欢迎界面
  const data = await figlet('KD-CLI Welcome')
  log(data)
  log(`🚀 创建项目：${name}`)
  //   if (program.opts() && program.opts().init) {
  //   }
}
