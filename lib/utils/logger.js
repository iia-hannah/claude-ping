const fs = require('fs-extra');
const path = require('path');
const { CONFIG_DIR } = require('./config-manager');
const chalk = require('chalk');

// Ensure log directory exists
fs.ensureDirSync(CONFIG_DIR);

const LOG_FILE = path.join(CONFIG_DIR, 'output.log');
const ERROR_LOG_FILE = path.join(CONFIG_DIR, 'error.log');

// Log levels
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

let currentLogLevel = 'info';

function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLogLevel = level;
  }
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

function formatMessage(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  return `[${timestamp}] ${message}`;
}

function appendToLog(message, isError = false) {
  const formattedMessage = formatMessage(message);
  const file = isError ? ERROR_LOG_FILE : LOG_FILE;
  
  try {
    fs.appendFileSync(file, formattedMessage + '\n');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

function debug(message) {
  if (!shouldLog('debug')) return;
  
  console.log(chalk.gray(formatMessage(message)));
  appendToLog(`[DEBUG] ${message}`);
}

function info(message) {
  if (!shouldLog('info')) return;
  
  console.log(formatMessage(message));
  appendToLog(`[INFO] ${message}`);
}

function warn(message) {
  if (!shouldLog('warn')) return;
  
  console.log(chalk.yellow(formatMessage(message)));
  appendToLog(`[WARN] ${message}`);
}

function error(message, err) {
  if (!shouldLog('error')) return;
  
  const errorMessage = err ? `${message}: ${err.message}` : message;
  console.error(chalk.red(formatMessage(errorMessage)));
  appendToLog(`[ERROR] ${errorMessage}`, true);
  
  if (err && err.stack) {
    appendToLog(`[ERROR] ${err.stack}`, true);
  }
}

function getRecentLogs(count = 5) {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const logs = fs.readFileSync(LOG_FILE, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .slice(-count);
      return logs;
    }
  } catch (error) {
    console.error(`Failed to read log file: ${error.message}`);
  }
  return [];
}

module.exports = {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  getRecentLogs,
  LOG_FILE,
  ERROR_LOG_FILE
};