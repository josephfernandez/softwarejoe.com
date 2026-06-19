# Deploying softwarejoe.com to Vercel

Static site + one serverless function (`/api/contact`) that emails form submissions via Resend.

## 1. Push to GitHub
The repo already lives at `github.com/josephfernandez/softwarejoe.com`. Commit and push your changes to `master`.

## 2. Import into Vercel
1. Go to https://vercel.com/new (you're logged in via GitHub).
2. Import the `softwarejoe.com` repo.
3. Framework preset: **Other** (it's a static site). No build command, no output dir — Vercel serves the files as-is and auto-detects `/api`.
4. Deploy.

## 3. Set up email sending (Resend)
The contact form needs an email provider to deliver messages.
1. Create a free account at https://resend.com.
2. **Add & verify the domain** `softwarejoe.com` (Resend gives you DNS records — SPF/DKIM — to add at your domain registrar). This lets mail be sent from `noreply@softwarejoe.com`.
3. Create an **API key**.
4. In Vercel → Project → **Settings → Environment Variables**, add:
   - `RESEND_API_KEY` = your key
5. Redeploy so the function picks up the variable.

> Free tier: 3,000 emails/month, 100/day — plenty for a contact form.

## 4. Point the domain at Vercel
1. Vercel → Project → **Settings → Domains** → add `softwarejoe.com` (and `www`).
2. Update DNS at your registrar to the records Vercel shows (A record / CNAME).
3. The `CNAME` file in this repo is from GitHub Pages and is ignored by Vercel — domain config happens in the dashboard.

## 5. Final content TODO
- Replace `REPLACE_WITH_SCHEDULING_LINK` in `index.html` (4 buttons) with your Calendly URL.

## Local testing
Run `npx vercel dev` to test the site + the `/api/contact` function locally (you'll be prompted to link the project; set `RESEND_API_KEY` locally too).
