# Cloudflare Integration & Deployment Readiness

This guide outlines how to configure Cloudflare to proxy, protect, and optimize AppStack deployment.

## 1. DNS & Proxy Status
Point your domain's nameservers to Cloudflare. When configuring DNS records for the frontend and backend, toggle the **Proxy Status** to **Proxied (orange cloud)**. This routes traffic through Cloudflare's network, enabling security and caching features.

## 2. SSL/TLS Settings
Set the SSL/TLS encryption mode to **Full** or **Full (Strict)**.
- **Full**: Encrypts traffic end-to-end (from browser to Cloudflare, and Cloudflare to backend origin) using a self-signed certificate on the origin.
- **Full (Strict)**: Requires a valid, trusted SSL certificate on your origin server. (Recommended for production).

## 3. Proxy Readiness & Client IP
Because Cloudflare acts as a reverse proxy, the client's real IP address is passed in the `X-Forwarded-For` and `CF-Connecting-IP` headers.
To ensure backend rate limiters, reCAPTCHA, and audit logs capture the real IP (and not Cloudflare's IP):
- Express is configured with `server.set("trust proxy", 1)` in `backend/src/index.ts` to automatically trust the first hop proxy.
- Ensure the origin web server (e.g. Nginx, Apache, or Docker Traefik) does not strip or overwrite these headers.

## 4. Web Application Firewall (WAF)
Add WAF rules to block malicious requests, SQL injections, and cross-site scripting:
- Enable Cloudflare's **OWASP Core Ruleset**.
- Add a custom firewall rule to challenge/block requests targeting `/api/auth/send-otp` or `/api/auth/login` if request rates exceed thresholds.

## 5. Bot Protection & reCAPTCHA Integration
- Enable **Cloudflare Bot Fight Mode** to challenge automated scrapers.
- For user actions (like signup, password resets, review submissions, and recipient email OTP verification), AppStack integrates **Google reCAPTCHA v3**. Verify that the site keys and secret keys are correctly configured in frontend and backend environment variables.
