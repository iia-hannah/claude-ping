const fs = require('fs-extra');
const path = require('path');
const { CONFIG_DIR } = require('../utils/config-manager');
const logger = require('../utils/logger');

const PID_FILE = path.join(CONFIG_DIR, 'claude-ping.pid');

function savePid(pid) {
  fs.writeFileSync(PID_FILE, pid.toString());
  logger.info(`PID saved: ${pid}`);
}

function getPid() {
  try {
    if (fs.existsSync(PID_FILE)) {
      return parseInt(fs.readFileSync(PID_FILE, 'utf8'));
    }
  } catch (error) {
    logger.error('Error reading PID file:', error);
  }
  return null;
}

function removePid() {
  try {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
      logger.info('PID file removed');
    }
  } catch (error) {
    logger.error('Error removing PID file:', error);
  }
}

function isRunning(pid) {
  try {
    if (pid && process.kill(pid, 0)) {
      return true;
    }
  } catch (error) {
    if (error.code !== 'ESRCH') {
      logger.error('Error checking process status:', error);
    }
  }
  return false;
}

function setupSignalHandlers() {
  ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
    process.on(signal, () => {
      logger.info(`Received ${signal}, shutting down...`);
      removePid();
      process.exit(0);
    });
  });
}

module.exports = {
  savePid,
  getPid,
  removePid,
  isRunning,
  setupSignalHandlers,
  PID_FILE
};