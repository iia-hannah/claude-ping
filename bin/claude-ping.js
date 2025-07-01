#!/usr/bin/env node

const { program } = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description('Claude Code CLI token optimization automation tool');

program
  .command('start')
  .description('Start the background process')
  .option('-i, --interval <hours>', 'Set ping interval in hours (1-24)', '5')
  .option('-f, --foreground', 'Run in foreground mode')
  .option('--retry-count <count>', 'Number of consecutive retries (1-10)', '3')
  .option('--retry-interval <minutes>', 'Minutes between retries (1-10)', '2')
  .option('--no-retry', 'Disable retry mechanism')
  .action(require('../lib/commands/start'));

program
  .command('status')
  .description('Check current running status')
  .action(require('../lib/commands/status'));

program
  .command('test')
  .description('Test Claude connection')
  .action(require('../lib/commands/test'));

program
  .command('config')
  .description('Show configuration file')
  .action(require('../lib/commands/config'));

program
  .command('stop')
  .description('Stop running process')
  .action(require('../lib/commands/stop'));

program.parse(process.argv);