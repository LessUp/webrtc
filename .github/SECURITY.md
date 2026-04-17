# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| latest release | :white_check_mark: |

## Reporting a Vulnerability

We take the security of this project seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via GitHub's private vulnerability reporting feature:

1. Go to the [Security tab](https://github.com/LessUp/webrtc/security)
2. Click "Report a vulnerability"
3. Fill out the form with details about the vulnerability

### What to Include

Please include the following information:

- Type of vulnerability (e.g., XSS, injection, DoS)
- Steps to reproduce the issue
- Affected versions
- Potential impact
- Any potential fixes you've identified

### Response Timeline

- **Initial response**: Within 48 hours
- **Triage and confirmation**: Within 7 days
- **Fix development**: Depends on severity and complexity
- **Disclosure**: After a fix is released

## Security Best Practices

When deploying this WebRTC signaling server:

### Network Security

- Always use HTTPS/WSS in production
- Configure `WS_ALLOWED_ORIGINS` to restrict which origins can connect
- Use a reverse proxy (e.g., Caddy, Nginx) with proper security headers

### Server Hardening

- Run the server with minimal privileges
- Keep dependencies updated
- Monitor logs for suspicious activity
- Consider rate limiting at the network level

### WebRTC Security

- For production, configure TURN servers with proper authentication
- Be aware that WebRTC reveals IP addresses to peers
- Consider using a TURN server to hide client IPs

## Known Security Considerations

### Authentication

This server does not implement authentication. Anyone who knows a room name can join. For production use:

- Implement your own authentication middleware
- Use short-lived, randomly generated room names
- Consider integrating with an identity provider

### Rate Limiting

The server implements basic rate limiting per connection:
- Maximum 50 messages in burst
- Maximum 30 messages per second sustained

For additional protection, consider:
- IP-based rate limiting at the reverse proxy
- Connection limits per IP
- Request size limits

## Security Updates

Security updates will be announced via:
- GitHub Security Advisories
- Release notes

## Credits

We thank all security researchers who responsibly report vulnerabilities.
