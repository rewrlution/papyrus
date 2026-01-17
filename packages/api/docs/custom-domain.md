# Custom Domain Setup (Porkbun + Render)

This guide walks through connecting a custom domain purchased from Porkbun to your Render-hosted API.

## Prerequisites

- A domain registered on [Porkbun](https://porkbun.com)
- A deployed service on [Render](https://render.com)

## Step 1: Add Custom Domain in Render

1. Go to your Render dashboard
2. Select your web service (e.g., `papyrus-api-prod`)
3. Navigate to **Settings** > **Custom Domains**
4. Click **Add Custom Domain**
5. Enter your domain (e.g., `api.yourdomain.com`)
6. Render will display the DNS records you need to configure

## Step 2: Get DNS Records from Render

Render will provide the CNAME target for your subdomain.

### For subdomains (recommended for APIs)

Example: `api.yourdomain.com`

| Type  | Name | Value                       |
| ----- | ---- | --------------------------- |
| CNAME | api  | `your-service.onrender.com` |

> Note: Copy the exact CNAME target from your Render dashboard.

> **Using a subdomain?** You don't need to configure anything for your root domain. Just set up the CNAME for your subdomain (e.g., `api`) and you're done.

## Step 3: Configure DNS in Porkbun

1. Log in to [Porkbun](https://porkbun.com)
2. Go to **Domain Management**
3. Find your domain and click **DNS**
4. Delete any conflicting records (existing A or CNAME for the same subdomain)
5. Click **Add Record**

### For CNAME (subdomain):

- **Type**: CNAME
- **Host**: `api` (or your subdomain)
- **Answer**: `your-service.onrender.com` (from Render)
- **TTL**: 600 (or default)

### For A record (root domain):

- **Type**: A
- **Host**: (leave blank or use `@`)
- **Answer**: Render's IP address
- **TTL**: 600 (or default)

6. Click **Add**

## Step 4: Verify and Wait for SSL Certificate

1. Return to Render's Custom Domains settings
2. Wait for DNS propagation (usually 5-30 minutes, can take up to 48 hours)
3. You'll see two stages:
   - **"Domain verified"** - DNS is correctly configured
   - **"Certificate pending"** - Render is provisioning SSL via Let's Encrypt (2-10 minutes, up to 30 minutes)
4. Once complete, you'll see a green checkmark with "Certificate issued"

> **"Certificate Pending" is normal.** Just wait - Render automatically provisions the SSL certificate. No action needed on your part.

## Step 5: Update API Client

Once verified, update the API base URL in the CLI:

```typescript
// packages/cli/src/lib/api/index.ts
const API_BASE_URL = 'https://api.yourdomain.com';
```

## Troubleshooting

### DNS not propagating

- Use [dnschecker.org](https://dnschecker.org) to verify DNS records globally
- Clear local DNS cache:
  - macOS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
  - Windows: `ipconfig /flushdns`

### SSL certificate stuck on "pending"

- This is normal for the first 2-30 minutes - just wait
- If stuck longer than 30 minutes:
  - Verify DNS is correctly pointing to Render using [dnschecker.org](https://dnschecker.org)
  - Try removing and re-adding the custom domain in Render
  - Check [Render's status page](https://status.render.com) for outages
- Render retries certificate issuance automatically

### "Domain already in use" error in Render

- The domain may be attached to another Render service
- Remove it from the other service first

### CNAME conflicts with root domain

- CNAME records cannot coexist with other records on the same host
- For root domains, use A records instead
- Consider using `api.` subdomain for APIs

## DNS Record Reference

| Use Case                    | Record Type | Host | Value                     |
| --------------------------- | ----------- | ---- | ------------------------- |
| Subdomain (api.example.com) | CNAME       | api  | your-service.onrender.com |
| Root domain (example.com)   | A           | @    | Render IP                 |
| www subdomain               | CNAME       | www  | your-service.onrender.com |

## Security Notes

- Render automatically handles SSL/TLS certificates
- HTTPS is enforced by default
- HTTP requests are redirected to HTTPS

## Resources

- [Render Custom Domains Docs](https://render.com/docs/custom-domains)
- [Porkbun DNS Management](https://kb.porkbun.com/article/54-how-to-edit-dns)
- [DNS Propagation Checker](https://dnschecker.org)
