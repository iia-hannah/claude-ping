# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Ping is a Node.js CLI application that automatically pings Claude Code CLI every 5 hours to reset tokens and maintain an active session. It's designed to run as a background service with auto-start capabilities.

## Essential Commands

### Development Commands
```bash
# Install dependencies
npm install

# Test the application (currently no tests defined)
npm test

# Run the CLI locally during development
node bin/claude-ping.js <command>
```

### CLI Commands for Testing
```bash
# Start the service
claude-ping start [-i hours] [-f] [--retry-count N] [--retry-interval N] [--no-retry]

# Check status
claude-ping status

# Test Claude connection
claude-ping test

# View configuration
claude-ping config

# Stop the service
claude-ping stop
```

## Architecture

### Core Structure
- **bin/claude-ping.js**: CLI entry point using Commander.js
- **lib/commands/**: Command implementations (start, stop, status, test, config)
- **lib/services/**: Core business logic services
- **lib/utils/**: Shared utilities (config, logging)

### Key Services

#### Claude Service (`lib/services/claude-service.js`)
- Handles Claude CLI interaction via child processes
- Manages timeouts and authentication checks
- Spawns `claude` subprocess with stdin/stdout pipes

#### Process Manager (`lib/services/process-manager.js`)
- PID file management in `~/.claude-ping/claude-ping.pid`
- Process lifecycle and signal handling
- Background process validation

#### Scheduler (`lib/services/scheduler.js`)
- Main background service execution
- Retry mechanism with configurable attempts and intervals
- Timer-based execution every N hours

#### Config Manager (`lib/utils/config-manager.js`)
- Configuration stored in `~/.claude-ping/config.json`
- Default config with 5-hour intervals, 30s timeout, 3 retries
- Dynamic config updates

### Background Service Pattern
The application uses Node.js `fork()` to create detached background processes:
1. Main CLI command forks scheduler service
2. Scheduler saves PID and detaches from parent
3. Signal handlers ensure clean shutdown and PID cleanup
4. Auto-start service integration for boot persistence

### Error Handling Strategy
- Authentication detection via stderr monitoring
- Timeout management for Claude CLI responses
- Retry sequences with exponential backoff
- Graceful degradation when Claude CLI unavailable

## Configuration

Default configuration structure:
```json
{
  "intervalHours": 5,
  "timeout": 30000,
  "retryCount": 3,
  "retryInterval": 2,
  "question": "What time is it now?",
  "logLevel": "info",
  "autoRestart": true
}
```

Logs stored in:
- `~/.claude-ping/output.log`
- `~/.claude-ping/error.log`

## Dependencies

Key external dependencies:
- **commander**: CLI argument parsing and command structure
- **chalk**: Terminal output coloring
- **inquirer**: Interactive prompts for auto-start setup
- **fs-extra**: Enhanced file system operations

## Development Notes

- Node.js 18.0.0+ required
- Requires Claude CLI to be installed and authenticated
- Process management relies on POSIX signals (SIGINT, SIGTERM, SIGHUP)
- Cross-platform compatibility through `os.homedir()` and `path.join()`