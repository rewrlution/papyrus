# Custom Domain Setup: Vercel + Porkbun

Guide to connect `papyrus.rewrlution.com` subdomain from Porkbun to your Vercel deployment.

## Prerequisites

- Vercel project deployed at `https://papyrus-web.vercel.app`
- Domain `rewrlution.com` owned on [Porkbun](https://porkbun.com)
- Access to both Vercel and Porkbun dashboards

## Part 1: Add Domain in Vercel

### Step 1: Open Project Settings

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project (`papyrus-web`)
3. Click **Settings** tab
4. Click **Domains** in the left sidebar

### Step 2: Add Your Subdomain

1. Enter: `papyrus.rewrlution.com`
2. Click **Add**

### Step 3: Note the DNS Record

Vercel will show you the required CNAME record:

```
Type: CNAME
Name: papyrus
Value: cname.vercel-dns.com
```

Keep this page open - you'll need this value for Porkbun.

## Part 2: Configure DNS in Porkbun

### Step 1: Open DNS Management

1. Go to [porkbun.com](https://porkbun.com)
2. Log in to your account
3. Click **Domain Management**
4. Find `rewrlution.com` and click **DNS**

### Step 2: Add CNAME Record

| Field  | Value                |
| ------ | -------------------- |
| Type   | CNAME                |
| Host   | papyrus              |
| Answer | cname.vercel-dns.com |
| TTL    | 600 (or default)     |

Click **Add**

That's it! Subdomains only need a single CNAME record.

## Part 3: Verify Configuration

### Step 1: Wait for DNS Propagation

DNS changes typically propagate within 5-15 minutes, but can take up to 48 hours.

### Step 2: Check in Vercel

1. Go back to Vercel → Settings → Domains
2. `papyrus.rewrlution.com` should show a green checkmark
3. If not, Vercel shows what's wrong

### Step 3: Test Your Domain

```bash
# Check DNS propagation
dig papyrus.rewrlution.com +short
# Should return: cname.vercel-dns.com (or resolved IP)

# Or use online tools
# https://dnschecker.org
```

### Step 4: Visit Your Site

Open https://papyrus.rewrlution.com in a browser. Should show your Vercel deployment with HTTPS.

## Part 4: SSL Certificate

Vercel automatically:

- Provisions free SSL certificate via Let's Encrypt
- Renews certificates before expiration
- Forces HTTPS redirect

No action needed - just wait a few minutes after domain verification.

## Troubleshooting

### Domain shows "Invalid Configuration"

**Check DNS record:**

1. Verify CNAME `papyrus` points to `cname.vercel-dns.com`
2. Wait for DNS propagation (use dnschecker.org)
3. Ensure no conflicting A record exists for `papyrus`

### "Pending Verification" for too long

**Possible causes:**

- DNS not propagated yet (wait longer)
- Conflicting DNS records (delete old records for `papyrus`)
- CAA record blocking certificate issuance

**Fix CAA issues:**
Add this CAA record in Porkbun if needed:

```
Type: CAA
Host: (blank)
Answer: 0 issue "letsencrypt.org"
```

### HTTPS not working

- Wait 5-10 minutes for SSL provisioning
- Check Vercel dashboard for certificate status
- Ensure no CAA records are blocking

## DNS Record Summary

| Type  | Host    | Value                | Purpose              |
| ----- | ------- | -------------------- | -------------------- |
| CNAME | papyrus | cname.vercel-dns.com | Subdomain for Vercel |

## Quick Checklist

- [ ] `papyrus.rewrlution.com` added in Vercel dashboard
- [ ] CNAME record added in Porkbun: `papyrus → cname.vercel-dns.com`
- [ ] DNS propagated (check with dnschecker.org)
- [ ] Green checkmark in Vercel Domains
- [ ] https://papyrus.rewrlution.com loads correctly

## Useful Links

- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Porkbun DNS Management](https://kb.porkbun.com/article/54-how-to-edit-dns-records)
- [DNS Propagation Checker](https://dnschecker.org)
