# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in BeeBoo MCP Server, please report it responsibly:

1. **Do NOT** create a public GitHub issue
2. Email security@tgmventures.com with details
3. Include steps to reproduce if possible

We will respond within 48 hours and work with you to resolve the issue.

## Security Best Practices

- Store API keys in environment variables, not in config files
- Use the MCP configuration's `env` block for secrets
- Never log or expose API keys
- Keep your dependencies updated

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
