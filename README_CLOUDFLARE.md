# Cloudflare Deployment Guide

This project has been adapted to run on Cloudflare Pages (Frontend) + Cloudflare Pages Functions (Backend).

## Changes Made

1.  **Backend Migration**: The Express backend (`routes/`) has been ported to Cloudflare Pages Functions (`functions/`).
    *   `puppeteer` was replaced with a lightweight fetch+regex implementation for Weibo Hot Search, as Puppeteer is not supported on standard Cloudflare Workers.
    *   All API endpoints now reside in `functions/api/`.
2.  **Frontend**: No code changes were needed for the frontend, but it will now be served by Cloudflare Pages.

## Local Development

To test the application locally with Cloudflare's environment:

1.  Install Wrangler (Cloudflare CLI):
    ```bash
    npm install -D wrangler
    ```

2.  Build the frontend:
    ```bash
    npm run build
    ```

3.  Run the local development server:
    ```bash
    npx wrangler pages dev public --compatibility-date=2024-01-01
    ```
    *   This serves the static files from `public/`
    *   It also runs the API functions in `functions/`
    *   Access at `http://localhost:8788`

## Deployment

1.  **Login to Cloudflare**:
    ```bash
    npx wrangler login
    ```

2.  **Deploy**:
    ```bash
    npm run build
    npx wrangler pages deploy public
    ```
    *   Select "Create a new project" if prompted.
    *   Project name: `wxcloud-express` (or your choice).

3.  **Environment Variables**:
    After deployment, go to the Cloudflare Dashboard -> Pages -> Your Project -> Settings -> Environment Variables.
    Add the following:
    *   `DEEPSEEK_API_KEY`: Your DeepSeek API Key.

## Notes
*   The `index.ts` and `routes/` folders are no longer used in the Cloudflare deployment but are kept for reference or legacy hosting.
*   The `/api/wx_openid` endpoint relies on WeChat Cloud Run headers. On Cloudflare, this might return an error unless you implement custom login logic (e.g., `jscode2session`).

