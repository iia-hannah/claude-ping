const { getPid, isRunning, removePid } = require('../services/process-manager');
const logger = require('../utils/logger');
const chalk = require('chalk');

module.exports = function() {
  const pid = getPid();
  
  if (!pid) {
    console.log(chalk.yellow('⚠️ No running process found'));
    return;
  }
  
  if (isRunning(pid)) {
    console.log(chalk.blue(`🛑 Stopping Claude Ping (PID: ${pid})...`));
    
    try {
      process.kill(pid, 'SIGTERM');
      console.log(chalk.green('✅ Process stopped successfully'));
    } catch (error) {
      console.log(chalk.red(`❌ Failed to stop process: ${error.message}`));
      console.log(chalk.yellow('Removing stale PID file...'));
      removePid();
    }
  } else {
    console.log(chalk.yellow(`⚠️ Process with PID ${pid} is not running`));
    console.log(chalk.blue('Removing stale PID file...'));
    removePid();
  }
};