# Claude Ping

A Node.js CLI tool that automatically pings Claude Code CLI every 5 hours to reset tokens.

## Features

- **Token Optimization**: Automatically resets tokens every 5 hours
- **Unattended Operation**: Runs in the background, starts on boot
- **Easy to Use**: Simple installation and setup
- **No Admin Rights**: Runs without sudo/administrator privileges

## Prerequisites

1. **Node.js 18.0.0 or higher**
2. **Claude Code CLI installed and authenticated**
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude auth
   ```

## Installation

```bash
npm install -g claude-ping
```

## Usage

### Starting the Service

```bash
# Start with default settings (5-hour interval)
claude-ping start

# Start with custom interval (3 hours)
claude-ping start -i 3

# Start in foreground mode to see logs
claude-ping start --foreground
```

### Checking Status

```bash
claude-ping status
```

### Testing Connection

```bash
claude-ping test
```

### Viewing Configuration

```bash
claude-ping config
```

### Stopping the Service

```bash
claude-ping stop
```

## Command Options

### Start Command

- `-i, --interval <hours>`: Set ping interval in hours (1-24, default: 5)
- `-f, --foreground`: Run in foreground mode with visible logs
- `--retry-count <count>`: Number of consecutive retries (1-10, default: 3)
- `--retry-interval <minutes>`: Minutes between retries (1-10, default: 2)
- `--no-retry`: Disable retry mechanism (run once per interval)

## Configuration

Configuration is stored in `~/.claude-ping/config.json` and can be modified directly:

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

## Troubleshooting

### Logs

Logs are stored in:
- `~/.claude-ping/output.log`
- `~/.claude-ping/error.log`

### Common Issues

**Claude CLI not found**

Ensure Claude CLI is installed and in your PATH:
```bash
npm install -g @anthropic-ai/claude-code
```

**Authentication Issues**

Re-authenticate with Claude:
```bash
claude auth
```

**Process Not Starting**

Check for errors:
```bash
cat ~/.claude-ping/error.log
```

## License

MIT