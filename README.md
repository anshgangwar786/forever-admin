# 🛠 Forever — Admin & Seller Panel

Dashboard for **Forever**, a multi-vendor e-commerce platform. Built with **Next.js 15 (App Router)**, React 19 and Tailwind CSS v4. Sellers manage their catalog and orders here; super-admins also manage users, roles and categories.

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

> Part of the Forever platform: **forever-backend** (API) · **forever-frontend** (storefront) · **forever-admin** (this repo)
>
> Needs a running **forever-backend** API.

---

## 🚀 Features

- Seller registration and login; env-configured super-admin login
- Analytics dashboard: KPI cards, sales charts, recent orders, low-stock alerts and restock actions
- Product management: add, edit, discount and remove, with multi-image Cloudinary uploads and variant pricing
- Per-product insights dashboard
- Category management
- Order management with status updates
- Transactions view with refunds
- Review moderation (approve / reject, including email action links)
- User management and role assignment (admin only)
- Security settings with 2FA setup and backup codes
- Light / dark theme and command palette

---

## 🧑‍💻 Tech Stack

Next.js 15 (App Router), React 19, Tailwind CSS v4, Axios, React Toastify, Lucide icons.

Design tokens (colours, type, spacing) live in [src/tokens/](src/tokens/) and are shared in style with the storefront.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill it in — `.env` is git-ignored.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_BACKEND_URL` | yes (build) | Base URL of the Forever API |
| `NEXT_PUBLIC_STORE_URL` | yes (build) | Storefront URL for cross-links |

`NEXT_PUBLIC_*` values are inlined at build time; `npm run build` fails fast if they are missing.

The super-admin account is configured on the backend (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), not here.

---

## ▶️ Run Locally

Requires **Node.js 20+**.

```bash
git clone https://github.com/anshgangwar786/forever-admin.git
cd forever-admin
cp .env.example .env   # then edit values
npm install
npm run dev            # http://localhost:5174
```

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server on port 5174 |
| `npm run build` | Production build |
| `npm start` | Production server on port 5174 |
| `npm run lint` | Lint with Next.js ESLint config |

---

## 🚢 Deployment

Deployed on **Vercel**. Set the `NEXT_PUBLIC_*` variables in the Vercel project's build environment. Make sure the deployed admin origin is in the backend's `ADMIN_URL` so CORS allows it.

---

## 👨‍💻 Author

**Ansh Gangwar** — Full-Stack Developer

🔗 GitHub: https://github.com/anshgangwar786<br>
🔗 LinkedIn: https://www.linkedin.com/in/ansh-gangwar/
