# CORS (Cross-Origin Resource Sharing)

## What is CORS?

CORS is a security mechanism built into web browsers that restricts web pages from making requests to a different domain than the one serving the web page. It's a browser-enforced policy, not a server-side security feature.

**Key point:** CORS only applies to browser-based requests (fetch, XMLHttpRequest). It doesn't affect:

- Server-to-server requests
- Mobile app API calls
- CLI tools
- Postman/curl requests

## When is CORS Needed?

### Not Just for Development!

CORS is needed **in production** whenever your frontend and backend are on different origins:

| Frontend                | Backend                    | CORS Needed?                 |
| ----------------------- | -------------------------- | ---------------------------- |
| `https://example.com`   | `https://api.example.com`  | ✅ Yes (different subdomain) |
| `https://example.com`   | `https://example.com:3000` | ✅ Yes (different port)      |
| `https://example.com`   | `http://example.com`       | ✅ Yes (different protocol)  |
| `https://example.com`   | `https://example.com`      | ❌ No (same origin)          |
| `http://localhost:3000` | `http://localhost:4000`    | ✅ Yes (different port)      |

### Common Scenarios:

1. **Separate frontend/backend deployments** (most modern apps)
   - Frontend: Vercel/Netlify
   - Backend: Railway/Render/AWS
2. **Microservices architecture**
   - Multiple APIs serving one frontend

3. **Third-party integrations**
   - Your app consuming external APIs from the browser

4. **Local development**
   - Frontend on `localhost:3000`
   - Backend on `localhost:4000`

## The `*` Wildcard: When It's Risky

### What `CORS_ORIGIN='*'` Means:

```typescript
CORS_ORIGIN: '*'; // Allow requests from ANY origin
```

### ⚠️ Security Risks:

#### 1. **Credential Exposure**

```typescript
// If your API uses cookies or Authorization headers:
res.header('Access-Control-Allow-Origin', '*'); // ❌ DANGEROUS
res.header('Access-Control-Allow-Credentials', 'true'); // ❌ Browsers block this combo
```

**Why risky:** Any malicious website can make requests to your API with the user's credentials.

**Real attack scenario:**

1. User logs into `yourapp.com` (gets auth cookie)
2. User visits `malicious.com`
3. `malicious.com` makes fetch requests to your API
4. If CORS allows `*` + credentials, the attack succeeds

#### 2. **Data Theft**

Any website can read responses from your API:

```javascript
// On evil-site.com
fetch('https://your-api.com/user/profile')
  .then((r) => r.json())
  .then((data) => sendToAttacker(data));
```

If CORS is `*`, this works and steals user data.

#### 3. **CSRF Attacks**

Cross-Site Request Forgery becomes easier when any origin can make requests.

### When `*` is Acceptable:

1. **Public, read-only APIs** (no authentication)

   ```typescript
   // Weather API, public blog posts, etc.
   CORS_ORIGIN: '*'; // ✅ OK - public data
   ```

2. **Internal tools** where you control all clients

3. **Quick local development** (never deploy to production with this)

## Best Practices

### 1. **Whitelist Specific Origins**

```typescript
// .env
CORS_ORIGIN = 'https://myapp.com,https://staging.myapp.com';
```

```typescript
// In Express
import cors from 'cors';

const allowedOrigins = env.CORS_ORIGIN.split(',');

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies
  })
);
```

### 2. **Use Environment-Based Config**

```typescript
// Development: Allow localhost
CORS_ORIGIN = 'http://localhost:3000,http://localhost:5173';

// Staging
CORS_ORIGIN = 'https://staging.myapp.com';

// Production
CORS_ORIGIN = 'https://myapp.com';
```

### 3. **Different Rules for Different Routes**

```typescript
// Public routes - allow all
app.use('/api/public', cors({ origin: '*' }));

// Protected routes - strict
app.use(
  '/api/user',
  cors({
    origin: 'https://myapp.com',
    credentials: true,
  })
);
```

### 4. **Use Regex for Dynamic Subdomains**

```typescript
app.use(
  cors({
    origin: /^https:\/\/.*\.myapp\.com$/, // Allows *.myapp.com
    credentials: true,
  })
);
```

## Common Mistakes

### ❌ Setting CORS in Production to `*` "Because It's Easy"

```typescript
// NEVER IN PRODUCTION WITH AUTH
CORS_ORIGIN = '*';
```

### ❌ Forgetting Credentials

```typescript
// Frontend
fetch(url, { credentials: 'include' }); // Sends cookies

// Backend - must explicitly allow
cors({ credentials: true });
```

### ❌ Mixing `*` with Credentials

```typescript
// THIS WON'T WORK - browsers reject it
cors({
  origin: '*',
  credentials: true, // ❌ Invalid combination
});
```

## How to Debug CORS Issues

### 1. Check Browser Console

```
Access to fetch at 'https://api.com' from origin 'https://app.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin'
header is present on the requested resource.
```

### 2. Check Network Tab

Look for:

- **Preflight requests** (OPTIONS method)
- **Response headers:** `Access-Control-Allow-Origin`

### 3. Verify Origin Header

```bash
curl -H "Origin: https://myapp.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-api.com/endpoint
```

## Summary

| Environment    | Recommended CORS Setting               | Why                    |
| -------------- | -------------------------------------- | ---------------------- |
| **Local Dev**  | `http://localhost:*` or specific ports | Convenience + safety   |
| **Staging**    | Specific staging URL                   | Test production config |
| **Production** | Exact production URL(s)                | Maximum security       |
| **Public API** | `*` (if no auth)                       | Accessibility          |

### Golden Rules:

1. ✅ **Never use `*` with credentials in production**
2. ✅ **Whitelist specific origins whenever possible**
3. ✅ **Use environment variables for configuration**
4. ✅ **Test CORS config in staging before production**
5. ✅ **Different APIs can have different CORS rules**

CORS is a necessary security feature, not an annoyance. Configure it thoughtfully based on your application's needs.
