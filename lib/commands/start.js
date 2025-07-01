const { fork } = require('child_process');
const path = require('path');
const { getConfig, updateConfig } = require('../utils/config-manager');
const { savePid, getPid, isRunning } = require('../services/process-manager');
const { checkAutoStartService, setupAutoStart } = require('../services/auto-start-service');
const inquirer = require('inquirer');
const logger = require('../utils/logger');
const chalk = require('chalk');

async function startDaemon(options) {
  // Validate options
  const interval = parseInt(options.interval);
  if (isNaN(interval) || interval < 1 || interval > 24) {
    throw new Error('Interval must be between 1 and 24 hours');
  }
  
  const retryCount = options.retry ? parseInt(options.retryCount) : 0;
  if (isNaN(retryCount) || retryCount < 0 || retryCount > 10) {
    throw new Error('Retry count must be between 0 and 10');
  }
  
  const retryInterval = parseInt(options.retryInterval);
  if (isNaN(retryInterval) || retryInterval < 1 || retryInterval > 10) {
    throw new Error('Retry interval must be between 1 and 10 minutes');
  }
  
  // Update config with command options
  updateConfig({
    intervalHours: interval,
    retryCount: options.retry ? retryCount : 0,
    retryInterval: retryInterval
  });
  
  // Check if already running
  const pid = getPid();
  if (pid && isRunning(pid)) {
    console.log(chalk.yellow(`Claude Ping is already running (PID: ${pid})`));
    return;
  }
  
  // Check auto-start service
  const isAutoStartSetup = await checkAutoStartService();
  if (!isAutoStartSetup) {
    const { setupService } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupService',
        message: 'Setup auto-start on boot?',
        default: true
      }
    ]);
    
    if (setupService) {
      await setupAutoStart();
      console.log(chalk.green('✅ Auto-start service registered'));
    }
  }
  
  // Calculate next ping time
  const nextPing = new Date(Date.now() + interval * 60 * 60 * 1000);
  
  // Start in foreground or background
  if (options.foreground) {
    console.log(chalk.blue(`🚀 Starting Claude Ping (${interval}h interval, ${options.retry ? retryCount : 0} retries)...`));
    require('../services/scheduler').start();
  } else {
    // Fork a new process and detach
    const child = fork(path.join(__dirname, '../services/scheduler.js'), [], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Save PID and detach
    savePid(child.pid);
    child.unref();
    
    console.log(chalk.blue(`🚀 Starting Claude Ping (${interval}h interval, ${options.retry ? retryCount : 0} retries)...`));
    console.log(chalk.blue(`📄 PID saved: ${child.pid}`));
    console.log(chalk.blue(`⏰ Next ping scheduled: ${nextPing.toLocaleString()}`));
    console.log('\nProcess running in background. Use \'claude-ping status\' to check.');
  }
}

module.exports = async function(options) {
  try {
    await startDaemon(options);
  } catch (error) {
    console.error(chalk.red(`Failed to start: ${error.message}`));
    process.exit(1);
  }
};