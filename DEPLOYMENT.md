# Grind Theory Quote App

A full-stack quote and booking form application for event catering services. Built with React, TypeScript, Express, and PostgreSQL.

## Features

- **Quote Form**: Multi-step form for customers to request quotes
- **Dynamic Pricing**: Configurable pricing with various modifiers and add-ons
- **Admin Dashboard**: Protected dashboard to view submissions and manage pricing
- **Email Notifications**: Send quote summaries to customers and admins
- **Real-time Cost Calculation**: Instant price updates based on selections

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (for local development)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs on `http://localhost:5000` with hot-reloading enabled.

## Deployment to Render (Free Tier)

### Quick Start with IaC

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the branch with your code
   - Render will automatically detect `render.yaml` and deploy

### Manual Setup (If IaC not available)

1. **Create PostgreSQL Database**
   - Dashboard → "New" → "PostgreSQL"
   - Plan: Free
   - Database name: `grind-quote-db`
   - Note the connection string

2. **Create Web Service**
   - Dashboard → "New" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name**: `grind-quote-app`
     - **Runtime**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Set Environment Variables**
   - In the service settings, add:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: (Your PostgreSQL connection string)
     - `SESSION_SECRET`: (Generate a random string)
     - `ADMIN_PASSWORD`: (Change from default: `Gr!nd.quote.2025`)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | Yes | Set to `production` |
| `SESSION_SECRET` | Yes | Secret for session encryption (auto-generated on Render) |
| `ADMIN_PASSWORD` | No | Admin dashboard password (default: `Gr!nd.quote.2025`) |

## Building for Production

```bash
# Build the app
npm run build

# Start production server
npm start
```

This bundles the React frontend and compiles the TypeScript backend.

## Admin Access

- **URL**: `/admin` (after deployment)
- **Default Password**: `Gr!nd.quote.2025`
- **Change it**: Set `ADMIN_PASSWORD` environment variable on Render

## Database Migrations

After deployment, run migrations:

```bash
npm run db:push
```

This is typically handled automatically by Render if you configure it properly, but you may need to run it once manually for initial setup.

## Free Tier Limitations (Render)

- Web service: Spins down after 15 minutes of inactivity (cold start ~30s)
- PostgreSQL: 256 MB storage, limited shared resources
- Good for: Testing, demos, low-traffic applications

**Recommendation**: Upgrade to paid tier for production use with higher traffic.

## Troubleshooting

### Cold Starts
Free tier services spin down after inactivity. First request after inactivity may take 20-30 seconds.

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Ensure your IP is allowed (Render handles this automatically)
- Check database exists and migrations have run

### Build Failures
- Ensure `npm run build` works locally
- Check that all environment variables are set
- Review build logs in Render dashboard

## Support

For issues with Render deployment, check:
- [Render Documentation](https://render.com/docs)
- [Render Dashboard](https://dashboard.render.com) - view logs and diagnostics
