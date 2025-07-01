const { spawn } = require('child_process');
const { getConfig } = require('../utils/config-manager');
const logger = require('../utils/logger');

async function checkClaudeInstallation() {
  return new Promise((resolve) => {
    const process = spawn('claude', ['--version']);
    process.on('error', () => resolve(false));
    process.on('close', (code) => resolve(code === 0));
  });
}

async function pingClaude() {
  const config = getConfig();
  const question = config.question;
  
  return new Promise((resolve, reject) => {
    logger.info('Starting Claude session...');
    
    const claudeProcess = spawn('claude', [], { stdio: ['pipe', 'pipe', 'pipe'] });
    let responseReceived = false;
    let output = '';
    let timeout;
    
    // Set timeout
    timeout = setTimeout(() => {
      if (!responseReceived) {
        claudeProcess.kill();
        reject(new Error('Claude response timeout'));
      }
    }, config.timeout);
    
    // Send question immediately
    claudeProcess.stdin.write(`${question}\n`);
    claudeProcess.stdin.end();
    
    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    claudeProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      if (errorOutput.includes('auth') || errorOutput.includes('login')) {
        clearTimeout(timeout);
        reject(new Error('Authentication required'));
      }
    });
    
    claudeProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    claudeProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0 && output.trim()) {
        logger.info(`Claude response: ${output.trim()}`);
        responseReceived = true;
        resolve(true);
      } else {
        reject(new Error(`Claude process exited with code ${code}`));
      }
    });
  });
}

module.exports = {
  checkClaudeInstallation,
  pingClaude
};