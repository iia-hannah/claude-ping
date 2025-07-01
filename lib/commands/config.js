const { getConfig, CONFIG_FILE } = require('../utils/config-manager');
const chalk = require('chalk');

module.exports = function() {
  const config = getConfig();
  
  console.log(chalk.blue(`Configuration file: ${CONFIG_FILE}`));
  console.log(JSON.stringify(config, null, 2));
  console.log('\nTo modify settings, edit this file or use command options.');
};