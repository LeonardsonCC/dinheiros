# Vercel Deployment Guide

This project is configured to deploy the frontend to Vercel. The configuration automatically builds the React/Vite frontend from the `frontend/` directory.

## Quick Deploy

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com) and connect your GitHub repository
   - Import this repository

2. **Configure Environment Variables** (in Vercel dashboard):
   - `VITE_API_URL`: Your backend API URL (e.g., `https://your-api-domain.com`)
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (optional)

3. **Deploy:**
   - Vercel will automatically detect the configuration and deploy

## Configuration Files

- `vercel.json`: Main Vercel configuration
- `frontend/.env.example`: Example environment variables for the frontend
- `.vercelignore`: Files to exclude from deployment

## Build Process

The deployment will:
1. Install dependencies in the `frontend/` directory
2. Run `npm run build` to build the React app
3. Serve the built files from `frontend/dist`
4. Configure SPA routing to serve `index.html` for all routes

## Local Testing

Test the build locally:
```bash
cd frontend
npm run build
npm run preview
```

## Notes

- The configuration includes CORS headers for API routes
- SPA routing is configured to serve `index.html` for all non-API routes
- The build process runs TypeScript compilation and Vite bundling
- API calls in development use Vite's proxy, in production use the `VITE_API_URL` environment variable