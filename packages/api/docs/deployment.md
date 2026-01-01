# Deployment Guide for Papyrus API on Render.com

## Overview

This guide covers deploying the Papyrus API to Render.com in a monorepo setup. Since the project has been converted to a monorepo using pnpm workspaces and Turbo, the deployment configuration needs to account for the monorepo structure.

## Prerequisites

- A Render.com account
- GitHub repository connected to Render
- PostgreSQL database (can be provisioned on Render)
- Environment variables configured

## Monorepo Deployment Considerations

In a monorepo, the API package is located at `packages/api/` rather than at the repository root. This requires specific configuration in Render to:

1. Build from the correct directory
2. Install dependencies using pnpm workspaces
3. Build shared packages that the API depends on
4. Run migrations and start the server

## Step-by-Step Deployment Setup

### Step 1: Create a New Web Service on Render

1. Log in to [Render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (if not already connected)
4. Select the `papyrus` repository

### Step 2: Configure Basic Settings

Configure the following settings:

- **Name**: `papyrus-api` (or your preferred name)
- **Region**: Choose the region closest to your users
- **Branch**: `main`
- **Root Directory**: Leave **empty** (we'll handle this in build commands)
- **Runtime**: `Node`
- **Build Command**:

  ```bash
  corepack enable && rm -rf node_modules && pnpm install --frozen-lockfile && pnpm --filter @rewrlution/papyrus-shared build && pnpm --filter @rewrlution/papyrus-api build
  ```

  **Understanding the Build Command:**

  This command consists of five parts chained together with `&&`:
  1. **`corepack enable`**
     - Enables Corepack, Node.js's built-in package manager manager
     - Allows Render to use pnpm (specified in `package.json` as `"packageManager": "pnpm@10.0.0"`)
     - Without this, Render would default to npm, which doesn't understand pnpm workspaces
  2. **`rm -rf node_modules`**
     - Removes any cached node_modules from previous builds
     - Prevents cache corruption issues that can cause "command not found" errors for binaries like `prisma`
     - Ensures a clean install on every deployment
  3. **`pnpm install --frozen-lockfile`**
     - Installs all dependencies for the entire monorepo based on `pnpm-lock.yaml`
     - `--frozen-lockfile` ensures dependencies match exactly what's in the lockfile (no updates)
     - This is critical for reproducible builds and prevents unexpected version changes in production
     - Installs dependencies for all workspace packages (`@rewrlution/papyrus-shared` and `@rewrlution/papyrus-api`)
  4. **`pnpm --filter @rewrlution/papyrus-shared build`**
     - Builds the shared package first
     - Runs `tsc` to compile TypeScript and generate type declarations in `packages/shared/dist/`
     - **This must run before building the API** because the API imports types from this package
     - Creates `index.d.ts` and other type definition files that the API needs
  5. **`pnpm --filter @rewrlution/papyrus-api build`**
     - Runs the `build` script specifically for the API package
     - `--filter` tells pnpm to run the command only for the specified package
     - The API's build script does:
       - `prisma migrate deploy`: Runs database migrations
       - `rimraf dist`: Cleans the previous build output
       - `tsc`: Compiles TypeScript to JavaScript (now can find `@rewrlution/papyrus-shared` types)
       - `copyfiles -u 1 src/email/templates/**/* dist/`: Copies email templates to the build folder

  **Why this structure?** In a monorepo, you can't just run `npm install && npm run build` from the root because:
  - The API package is in `packages/api/`, not the repository root
  - The API depends on shared code in `packages/shared/`
  - The shared package must be built first so its TypeScript declarations are available
  - pnpm workspaces need to be used to resolve workspace dependencies correctly

- **Start Command**:

  ```bash
  cd packages/api && pnpm start
  ```

  **Understanding the Start Command:**
  - **`cd packages/api`**: Changes to the API package directory
  - **`pnpm start`**: Runs the start script which executes `node dist/index.js`
  - The built JavaScript files are in `packages/api/dist/` after the build step
  - This needs to run from the API directory so relative paths (like Prisma schema, email templates) resolve correctly

### Step 3: Configure Environment Variables

Add the following environment variables in the Render dashboard:

#### Required Variables

- **`DATABASE_URL`**: PostgreSQL connection string (from Render PostgreSQL or external)
  - Format: `postgresql://user:password@host:port/database?schema=public`
- **`JWT_SECRET`**: Secret key for JWT token signing (generate a secure random string)
- **`PORT`**: `10000` (Render's default internal port)
- **`NODE_ENV`**: `production`

#### Email Configuration (if using email features)

Choose one of the following providers:

**Option A: Resend**

- **`EMAIL_PROVIDER`**: `resend`
- **`RESEND_API_KEY`**: Your Resend API key
- **`EMAIL_FROM`**: Your verified sender email

**Option B: Nodemailer (SMTP)**

- **`EMAIL_PROVIDER`**: `nodemailer`
- **`SMTP_HOST`**: Your SMTP host
- **`SMTP_PORT`**: Your SMTP port
- **`SMTP_USER`**: Your SMTP username
- **`SMTP_PASSWORD`**: Your SMTP password
- **`EMAIL_FROM`**: Your sender email

#### Optional Variables

- **`FRONTEND_URL`**: URL of your frontend application (for email links)
- **`LOG_LEVEL`**: `info` (or `debug`, `warn`, `error`)

### Step 4: Create a PostgreSQL Database

If you don't have an existing database:

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `papyrus-db`
   - **Database**: `papyrus`
   - **User**: `papyrus_user`
   - **Region**: Same as your web service
   - **Plan**: Choose based on your needs
3. Click **"Create Database"**
4. Once created, copy the **Internal Database URL**
5. Add it to your web service as the `DATABASE_URL` environment variable

### Step 5: Configure Auto-Deploy

By default, Render auto-deploys on push to the main branch. To verify:

1. Go to your web service settings
2. Under **"Build & Deploy"** → **"Auto-Deploy"**
3. Ensure **"Yes"** is selected

### Step 6: Deploy

1. Click **"Create Web Service"** (if creating new) or **"Manual Deploy"** → **"Deploy latest commit"**
2. Monitor the deployment logs for any errors
3. The build process will:
   - Install pnpm using corepack
   - Install all monorepo dependencies
   - Build the shared package (`@rewrlution/papyrus-shared`)
   - Build the API package (including TypeScript compilation and Prisma client generation)
   - Run Prisma migrations (`prisma migrate deploy`)
   - Copy email templates to the dist folder
4. Once deployed, your API will be available at: `https://your-service-name.onrender.com`

### Step 7: Verify Deployment

1. Check the deployment logs for successful startup
2. Test the health endpoint (if you have one)
3. Test the Swagger documentation: `https://your-service-name.onrender.com/api/docs`
4. Verify database migrations ran successfully:
   - Check logs for "Prisma Migrate applied" messages

## Troubleshooting

### Common Issues

#### Build Fails with "pnpm: command not found"

**Solution**: Ensure `corepack enable` is included at the start of your build command:

```bash
corepack enable && pnpm install --frozen-lockfile && pnpm --filter @rewrlution/papyrus-api build
```

#### Build Fails with "Cannot find module @rewrlution/papyrus-shared"

**Cause**: The shared package wasn't built before the API package, so TypeScript type declarations are missing.

**Solution**: Ensure the build command explicitly builds the shared package first (this should already be in your build command):

```bash
corepack enable && pnpm install --frozen-lockfile && pnpm --filter @rewrlution/papyrus-shared build && pnpm --filter @rewrlution/papyrus-api build
```

If you see this error, verify:

- The build command includes both `--filter @rewrlution/papyrus-shared build` AND `--filter @rewrlution/papyrus-api build`
- The shared package builds successfully (check logs for TypeScript errors in the shared package)

#### "prisma: command not found" or Binary Not Found Errors (with cache)

**Cause**: Render's build cache can sometimes corrupt pnpm symlinks or binary links in monorepo setups, causing commands like `prisma` to not be found even though they're installed.

**Solution**: Already implemented in the build command

- The build command includes `rm -rf node_modules` before install, which ensures a clean installation on every deployment
- This prevents cache corruption while still using `--frozen-lockfile` for reproducible builds
- If you're still seeing this error, verify your build command matches:
  ```bash
  corepack enable && rm -rf node_modules && pnpm install --frozen-lockfile && pnpm --filter @rewrlution/papyrus-shared build && pnpm --filter @rewrlution/papyrus-api build
  ```

**Alternative (if issue persists)**: Manually clear build cache

- In Render dashboard, go to your web service
- Click **"Manual Deploy"** → **"Clear build cache & deploy"**

#### Prisma Migration Errors

**Cause**: Database connection issues or missing `DATABASE_URL`.

**Solution**:

- Verify `DATABASE_URL` is correctly set
- Ensure the database is accessible from Render
- Check that the connection string includes `?schema=public`

#### Application Crashes on Startup

**Cause**: Missing environment variables or incorrect configuration.

**Solution**:

- Review logs for specific error messages
- Verify all required environment variables are set
- Ensure `PORT` is set to `10000`

#### Email Templates Not Found (404 errors)

**Cause**: Email templates weren't copied to the dist folder during build.

**Solution**: The build script includes `copyfiles -u 1 src/email/templates/**/* dist/` which should handle this. Verify:

- `copyfiles` is installed as a dev dependency (it should be)
- The build command ran successfully
- Check deployment logs for any copyfiles errors

## Deployment Workflow

### Regular Deployments

1. Make changes to your code locally
2. Test locally using `pnpm dev`
3. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
4. Render automatically detects the push and triggers a new deployment
5. Monitor the deployment in the Render dashboard

### Manual Deployment

If you need to manually trigger a deployment:

1. Go to your web service in Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Or use specific commit: **"Manual Deploy"** → **"Clear build cache & deploy"** (for clean build)

## Maintenance

### Database Migrations

When you add new migrations locally:

1. Create migration: `pnpm --filter @rewrlution/papyrus-api prisma:migrate`
2. Commit the migration files in `packages/api/prisma/migrations/`
3. Push to main
4. Render will automatically run `prisma migrate deploy` during build

### Viewing Logs

1. Go to your web service in Render dashboard
2. Click **"Logs"** tab
3. View real-time logs or filter by time range

### Scaling

To scale your application:

1. Go to your web service settings
2. Under **"Instance"**, adjust the instance type
3. Consider upgrading to a paid plan for:
   - Zero-downtime deploys
   - Faster builds
   - More memory/CPU
   - Custom domains

## Performance Optimization

### Build Cache

Render caches dependencies between builds. To clear cache:

- Use **"Clear build cache & deploy"** option

### Keep Service Warm

Free tier services spin down after inactivity. To keep your service warm:

- Upgrade to a paid plan
- Use an external service to ping your API periodically

### Database Connection Pooling

Consider using connection pooling for better database performance:

- Use Prisma connection pooling
- Or configure PgBouncer on Render

## Security Checklist

- [ ] `JWT_SECRET` is a strong, random string (at least 32 characters)
- [ ] `DATABASE_URL` uses SSL connection (`?sslmode=require`)
- [ ] All sensitive environment variables are set in Render (not in code)
- [ ] `NODE_ENV` is set to `production`
- [ ] CORS is properly configured in your API code
- [ ] API rate limiting is implemented (if needed)

## Monitoring and Alerts

Consider setting up:

1. **Health Checks**: Configure in Render settings under **"Health & Alerts"**
2. **Uptime Monitoring**: Use services like UptimeRobot or Better Uptime
3. **Error Tracking**: Integrate Sentry or similar service
4. **Performance Monitoring**: Use Application Performance Monitoring (APM) tools

## CI/CD Integration (Optional)

For more control over deployments, consider:

1. **GitHub Actions**: Run tests before deployment
2. **Deploy Hooks**: Use Render's deploy hooks to trigger deployments from external CI/CD

Example GitHub Actions workflow:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 10.0.0
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Support

If you encounter issues:

1. Check the deployment logs in Render dashboard
2. Review this documentation
3. Check Render's status page: https://status.render.com
4. Contact Render support: https://render.com/support
