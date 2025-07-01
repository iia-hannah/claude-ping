const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const logger = require('../utils/logger');

const MACOS_PLIST_PATH = path.join(os.homedir(), 'Library/LaunchAgents/com.claude-ping.plist');
const LINUX_SERVICE_PATH = path.join(os.homedir(), '.config/systemd/user/claude-ping.service');

async function checkAutoStartService() {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin') { // macOS
      return fs.existsSync(MACOS_PLIST_PATH);
    } else if (platform === 'linux') { // Linux
      return fs.existsSync(LINUX_SERVICE_PATH);
    } else if (platform === 'win32') { // Windows
      const { stdout } = await execAsync('schtasks /query /tn "ClaudePing" /fo list 2>nul');
      return stdout.includes('TaskName:');
    }
  } catch (error) {
    return false;
  }
  
  return false;
}

async function setupAutoStart() {
  const platform = process.platform;
  const execPath = process.execPath; // Node.js executable
  const scriptPath = path.resolve(path.join(__dirname, '../..', 'bin/claude-ping.js'));
  
  try {
    if (platform === 'darwin') { // macOS
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude-ping</string>
    <key>ProgramArguments</key>
    <array>
        <string>${execPath}</string>
        <string>${scriptPath}</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>${path.join(os.homedir(), '.claude-ping/output.log')}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(os.homedir(), '.claude-ping/error.log')}</string>
</dict>
</plist>`;
      
      fs.ensureDirSync(path.dirname(MACOS_PLIST_PATH));
      fs.writeFileSync(MACOS_PLIST_PATH, plistContent);
      await execAsync(`launchctl load -w ${MACOS_PLIST_PATH}`);
      
    } else if (platform === 'linux') { // Linux
      const serviceContent = `[Unit]
Description=Claude Ping Service

[Service]
ExecStart=${execPath} ${scriptPath} start
Restart=on-failure
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin:${process.env.PATH}

[Install]
WantedBy=default.target`;
      
      fs.ensureDirSync(path.dirname(LINUX_SERVICE_PATH));
      fs.writeFileSync(LINUX_SERVICE_PATH, serviceContent);
      await execAsync('systemctl --user daemon-reload');
      await execAsync('systemctl --user enable claude-ping.service');
      
    } else if (platform === 'win32') { // Windows
      const command = `schtasks /create /tn "ClaudePing" /sc onlogon /tr "\\"${execPath}\\" \\"${scriptPath}\\" start" /ru "${os.userInfo().username}" /f`;
      await execAsync(command);
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to setup auto-start: ${error.message}`);
    return false;
  }
}

async function removeAutoStart() {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin') { // macOS
      if (fs.existsSync(MACOS_PLIST_PATH)) {
        await execAsync(`launchctl unload -w ${MACOS_PLIST_PATH}`);
        fs.unlinkSync(MACOS_PLIST_PATH);
      }
    } else if (platform === 'linux') { // Linux
      if (fs.existsSync(LINUX_SERVICE_PATH)) {
        await execAsync('systemctl --user disable claude-ping.service');
        fs.unlinkSync(LINUX_SERVICE_PATH);
        await execAsync('systemctl --user daemon-reload');
      }
    } else if (platform === 'win32') { // Windows
      await execAsync('schtasks /delete /tn "ClaudePing" /f');
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to remove auto-start: ${error.message}`);
    return false;
  }
}

module.exports = {
  checkAutoStartService,
  setupAutoStart,
  removeAutoStart
};