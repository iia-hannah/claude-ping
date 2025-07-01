const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.claude-ping');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  intervalHours: 5,
  timeout: 30000,
  retryCount: 3,
  retryInterval: 2,
  question: 'What time is it now?',
  logLevel: 'info',
  autoRestart: true
};

function ensureConfigExists() {
  fs.ensureDirSync(CONFIG_DIR);
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeJsonSync(CONFIG_FILE, DEFAULT_CONFIG, { spaces: 2 });
  }
}

function getConfig() {
  ensureConfigExists();
  const config = fs.readJsonSync(CONFIG_FILE);
  return { ...DEFAULT_CONFIG, ...config };
}

function updateConfig(updates) {
  const config = getConfig();
  const newConfig = { ...config, ...updates };
  fs.writeJsonSync(CONFIG_FILE, newConfig, { spaces: 2 });
  return newConfig;
}

module.exports = {
  CONFIG_DIR,
  CONFIG_FILE,
  DEFAULT_CONFIG,
  getConfig,
  updateConfig,
  ensureConfigExists
};