# Digital Heroes 🏌️‍♀️

A subscription-driven web platform combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine — built for the Digital Heroes trainee selection process (PRD Level 1).

**Live App:** [digital-heroes-5kvz.vercel.app](https://digital-heroes-5kvz.vercel.app/)

---

## ✨ What it does

- Users subscribe (monthly/yearly) via Stripe
- Enter their last 5 golf scores (Stableford format, 1–45)
- Choose a charity to support with a portion of their subscription
- Participate in monthly draw-based prize pools (3/4/5-number match tiers)
- Track winnings, participation, and payout status from a personal dashboard
- Admins manage users, draws, charities, and winner verification from a dedicated admin panel

## 📸 Screenshots

### User Dashboard
![Dashboard](./Screenshot%202026-09-22%20162156.png)

### Admin Panel
![Admin Panel](./Screenshot%202026-09-22%20162246.png)

### Login
![Login](./Screenshot%202026-09-22%20162411.png)

### Signup
![Signup](./Screenshot%202026-09-22%20162431.png)

## 🧱 Tech Stack

- **Framework:** Next.js (App Router, Turbopack)
- **Database & Auth:** Supabase
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **Hosting:** Vercel

## 🗂️ Key Routes

| Route | Description |
|---|---|
| `/login`, `/signup` | Auth flows |
| `/dashboard` | Subscriber dashboard — scores, charity, participation, winnings |
| `/subscribe` | Plan selection & Stripe checkout |
| `/charities` | Charity directory |
| `/admin` | Admin panel — draws & winners management |
| `/admin/draws` | Configure, simulate, and publish monthly draws |
| `/admin/winners` | Verify proof & mark payouts |

## 🚀 Getting Started (local development)

```bash
git clone https://github.com/Sakshikumari1001/digital-heroes.git
cd digital-heroes
npm install
```

Create a `.env.local` file with your own Supabase & Stripe credentials, then:

```bash
npm run dev
```

## 🧪 Testing

Use Stripe test mode with card `4242 4242 4242 4242`, any future expiry, any CVC.

## 📄 About

Built as a sample assignment for Digital Heroes' full-stack trainee selection process (PRD v1.0, March 2026).

## 👥 Authors

- Prem Kumar Gupta
- Sakshi Kumari
