# HK Event Management — Public Client Website (Cloudflare Native)

Directed by **Keshara Sahan**, this repository contains the public website for HK Event Management.
It is engineered to run **100% serverless on Cloudflare Pages** with **ZERO server management, ZERO hosting costs, and ultra-fast global CDN delivery**.

---

## ☁️ How to Host on Cloudflare Pages (Serverless / No Server)

### Step 1: Push to your GitHub Repository
Open terminal in this directory (`hk-event-public`) and push:
```bash
git init
git add .
git commit -m "Deploy HK Event Public Website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hk-event-public.git
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, go to **Compute (Workers & Pages)** > **Pages** > Click **Connect to Git**.
3. Select your repository `hk-event-public`.
4. Configure Build settings:
   * **Framework preset:** `None`
   * **Build command:** *(leave empty)*
   * **Build output directory:** `public`
5. Click **Save and Deploy**.

That's it! Cloudflare will automatically build, deploy, and assign a free global domain (e.g. `https://hk-event-public.pages.dev`).

### Step 3: Add Custom Domain (Optional)
In Cloudflare Pages > Your Project > **Custom Domains**, add your domain (e.g., `hkevent.lk` or `www.hkevent.lk`).

---

## 💻 Local Testing (Optional)
If you want to test locally on your computer with Node.js:
```bash
npm install
npm start
```
Visit [http://localhost:3000](http://localhost:3000).

---

## 📁 Repository Structure
```
hk-event-public/
├── public/                # Static assets served by Cloudflare Pages Edge
│   ├── index.html         # Homepage
│   ├── about.html         # About Us & Founder Story
│   ├── projects.html      # Portfolio Albums Filter
│   ├── project.html       # Single Album Lightbox & Details
│   ├── contact.html       # Contact & Event Consultation Form
│   ├── 404.html           # Custom 404 Page
│   ├── _redirects         # Cloudflare Pages Clean URL Rewrites
│   ├── _headers           # Security & CORS Headers
│   ├── logo.png
│   ├── sahan.png
│   └── assets/            # CSS & JavaScript
├── functions/             # Cloudflare Pages Edge Functions (Serverless API)
│   └── api/
│       └── [[route]].js   # Cloudflare Edge APIs for Projects & Inquiries
├── server.js              # Local development server
├── package.json
└── .env
```

---

## 👨‍💻 Developer Credit
Developed by [Theekshana Viduranga](https://theekshanavidu.github.io/portfolio/).
