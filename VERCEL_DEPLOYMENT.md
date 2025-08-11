# Vercel Deployment Guide

This project is configured to deploy both the frontend and backend API to Vercel. The configuration automatically builds the React/Vite frontend from the `frontend/` directory and deploys the Go backend as serverless functions.

## Quick Deploy

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com) and connect your GitHub repository
   - Import this repository

2. **Configure Environment Variables** (in Vercel dashboard):
   - `VITE_API_URL`: Set to your Vercel app URL (e.g., `https://your-app.vercel.app`)
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (optional)
   - `DATABASE_URL`: Your PostgreSQL database connection string
   - `JWT_SECRET`: Secret key for JWT token signing
   - `GOOGLE_CLIENT_ID`: Google OAuth Client ID for backend
   - `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret for backend

3. **Deploy:**
   - Vercel will automatically detect the configuration and deploy

## Configuration Files

- `vercel.json`: Main Vercel configuration
- `frontend/.env.example`: Example environment variables for the frontend
- `.vercelignore`: Files to exclude from deployment

## Build Process

The deployment will:
1. **Frontend**: Install dependencies in the `frontend/` directory and build the React app
2. **Backend**: Build the Go serverless function from `api/index.go`
3. **Static Files**: Serve the built frontend files from `frontend/dist`
4. **API Routing**: Route all `/api/*` requests to the Go serverless function
5. **SPA Routing**: Serve `index.html` for all non-API routes

## Local Testing

Test the build locally:
```bash
cd frontend
npm run build
npm run preview
```

## Notes

- **Full-Stack Deployment**: Both frontend and backend deploy together on Vercel
- **Serverless Backend**: Go backend runs as serverless functions, automatically scaling
- **Database**: Requires external PostgreSQL database (e.g., Supabase, Railway, Neon)
- **CORS**: Configured for cross-origin requests between frontend and API
- **Environment**: Frontend uses `VITE_API_URL` to connect to the same domain's API
- **Development**: Local dev server for frontend, separate Go server for API testing