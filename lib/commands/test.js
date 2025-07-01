const { pingClaude, checkClaudeInstallation } = require('../services/claude-service');
const logger = require('../utils/logger');
const chalk = require('chalk');

module.exports = async function() {
  console.log(chalk.blue('🔍 Testing Claude connection...'));
  
  try {
    // Check if Claude is installed
    const isInstalled = await checkClaudeInstallation();
    if (!isInstalled) {
      console.log(chalk.red('❌ Claude CLI is not installed or not in PATH'));
      console.log(chalk.yellow('Please install Claude CLI:'));
      console.log('  npm install -g @anthropic-ai/claude-code');
      console.log('  claude auth');
      return;
    }
    
    console.log(chalk.green('✅ Claude CLI is installed'));
    
    // Test Claude connection
    console.log(chalk.blue('🔄 Sending test message to Claude...'));
    await pingClaude();
    console.log(chalk.green('✅ Claude connection successful!'));
  } catch (error) {
    console.log(chalk.red(`❌ Test failed: ${error.message}`));
    
    if (error.message.includes('auth')) {
      console.log(chalk.yellow('\nAuthentication issue detected. Try running:'));
      console.log('  claude auth');
    } else {
      console.log(chalk.yellow('\nTroubleshooting steps:'));
      console.log('1. Check your internet connection');
      console.log('2. Verify Claude CLI is properly installed');
      console.log('3. Run "claude auth" to refresh authentication');
      console.log('4. Try running Claude manually to check for issues');
    }
  }
};