const { getConfig } = require('../utils/config-manager');
const { pingClaude } = require('./claude-service');
const { savePid, setupSignalHandlers } = require('./process-manager');
const logger = require('../utils/logger');

let mainTimer = null;
let retryTimer = null;

async function executeRetrySequence() {
  const config = getConfig();
  const retryCount = config.retryCount;
  const retryInterval = config.retryInterval * 60 * 1000; // convert to ms
  
  logger.info(`⏰ ${config.intervalHours}-hour timer triggered, starting retry sequence...`);
  
  // Execute first attempt immediately
  let successCount = 0;
  try {
    logger.info(`🔄 Attempt 1/${retryCount}: Starting Claude session...`);
    await pingClaude();
    logger.info(`✅ Attempt 1 completed`);
    successCount++;
  } catch (error) {
    logger.error(`❌ Attempt 1 failed: ${error.message}`);
  }
  
  // Schedule remaining attempts
  for (let i = 1; i < retryCount; i++) {
    await new Promise(resolve => {
      retryTimer = setTimeout(async () => {
        try {
          logger.info(`🔄 Attempt ${i+1}/${retryCount}: Starting Claude session...`);
          await pingClaude();
          logger.info(`✅ Attempt ${i+1} completed`);
          successCount++;
        } catch (error) {
          logger.error(`❌ Attempt ${i+1} failed: ${error.message}`);
        } finally {
          resolve();
        }
      }, retryInterval);
    });
  }
  
  logger.info(`🎯 Retry sequence complete. ${successCount}/${retryCount} attempts succeeded.`);
  logger.info(`Next cycle in ${config.intervalHours} hours...`);
}

function start() {
  // Save PID if not already saved
  savePid(process.pid);
  
  // Setup signal handlers
  setupSignalHandlers();
  
  // Get configuration
  const config = getConfig();
  const intervalMs = config.intervalHours * 60 * 60 * 1000; // convert to ms
  
  // Execute immediately on start
  if (config.retryCount > 0) {
    executeRetrySequence();
  } else {
    pingClaude().catch(error => {
      logger.error(`Failed to ping Claude: ${error.message}`);
    });
  }
  
  // Setup main interval timer
  mainTimer = setInterval(() => {
    if (config.retryCount > 0) {
      executeRetrySequence();
    } else {
      pingClaude().catch(error => {
        logger.error(`Failed to ping Claude: ${error.message}`);
      });
    }
  }, intervalMs);
}

function stop() {
  if (mainTimer) {
    clearInterval(mainTimer);
    mainTimer = null;
  }
  
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

// Start if this file is executed directly
if (require.main === module) {
  start();
}

module.exports = { start, stop };