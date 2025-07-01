const { getPid, isRunning } = require('../services/process-manager');
const { getConfig } = require('../utils/config-manager');
const logger = require('../utils/logger');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports = function() {
  const pid = getPid();
  const isProcessRunning = pid && isRunning(pid);
  const config = getConfig();
  
  if (isProcessRunning) {
    console.log(chalk.green(`✅ Claude Ping is running (PID: ${pid})`));
    
    // Calculate next ping time
    try {
      const logFile = logger.LOG_FILE;
      if (fs.existsSync(logFile)) {
        const logs = fs.readFileSync(logFile, 'utf8').split('\n');
        
        // Find last ping time
        const lastPingLog = logs.reverse().find(line => 
          line.includes('timer triggered') || 
          line.includes('Starting Claude session')
        );
        
        if (lastPingLog) {
          const match = lastPingLog.match(/\[(.*?)\]/);
          if (match && match[1]) {
            const lastPingTime = new Date(match[1]);
            const nextPingTime = new Date(lastPingTime.getTime() + config.intervalHours * 60 * 60 * 1000);
            const now = new Date();
            
            const timeUntilNextPing = nextPingTime - now;
            if (timeUntilNextPing > 0) {
              const hours = Math.floor(timeUntilNextPing / (60 * 60 * 1000));
              const minutes = Math.floor((timeUntilNextPing % (60 * 60 * 1000)) / (60 * 1000));
              console.log(chalk.blue(`📅 Next ping: in ${hours}h ${minutes}m`));
            } else {
              console.log(chalk.blue(`📅 Next ping: imminent`));
            }
            
            console.log(chalk.blue(`⏰ Last ping: ${lastPingTime.toLocaleString()}`));
          }
        }
        
        // Find last retry sequence completion
        const lastRetryLog = logs.find(line => line.includes('Retry sequence complete'));
        if (lastRetryLog) {
          const match = lastRetryLog.match(/\[(.*?)\]/);
          if (match && match[1]) {
            const successMatch = lastRetryLog.match(/(\d+)\/(\d+) attempts succeeded/);
            if (successMatch) {
              console.log(chalk.blue(`🔄 Last sequence: ${successMatch[1]}/${successMatch[2]} attempts completed`));
            }
          }
        }
        
        // Show recent activity
        const recentLogs = logger.getRecentLogs(5);
        if (recentLogs.length > 0) {
          console.log('\nRecent activity:');
          recentLogs.forEach(log => {
            console.log(`  ${log}`);
          });
        }
      }
    } catch (error) {
      logger.error('Error reading log file', error);
    }
  } else {
    console.log(chalk.red('❌ Claude Ping is not running'));
    if (pid) {
      console.log(chalk.yellow(`⚠️ Stale PID file found: ${pid}`));
    }
  }
  
  // Show configuration summary
  console.log('\nConfiguration:');
  console.log(`  Interval: ${config.intervalHours} hours`);
  console.log(`  Retry count: ${config.retryCount}`);
  console.log(`  Retry interval: ${config.retryInterval} minutes`);
};