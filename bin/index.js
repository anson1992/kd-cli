#!/usr/bin/env node
// console.log('KD-CLI....')

const program = require('commander')
const version = require('../package.json').version
program
  .command('create <name>')
  .alias('c') // 设置别名
  .description('create a new project') // 添加描述
  .action(require('../lib/init.js'))
// 解析用户传递的参数
program.version(version).parse(process.argv)
