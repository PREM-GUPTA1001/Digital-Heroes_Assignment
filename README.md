# Digital Heroes 🏌️‍♀️

A subscription-driven web platform combining **golf performance tracking, charity fundraising, and a monthly draw-based reward engine** — built for the **Digital Heroes trainee selection process (PRD Level 1)**.

<p align="center">
  <a href="https://digital-heroes-5kvz.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-Digital%20Heroes-success?style=for-the-badge&logo=vercel" alt="Live Demo"/>
  </a>
</p>

---

## ✨ What It Does

Digital Heroes is a web platform that connects golf performance tracking with charity contributions and monthly draw-based rewards.

### 👤 User Features

* 🔐 User registration and login
* 💳 Monthly/yearly subscription plans via Stripe
* ⛳ Enter the last 5 golf scores using Stableford format (1–45)
* ❤️ Select a charity to support
* 💰 Choose the portion of subscription allocated to charity
* 🎟️ Participate in monthly draw-based prize pools
* 🏆 View winnings and participation history
* 📊 Track payout status from the personal dashboard

### 🛠️ Admin Features

* 👥 Manage users
* ❤️ Manage charities
* 🎯 Configure and manage monthly draws
* 🎲 Simulate and publish draws
* 🏆 Review and verify winners
* 💸 Manage payout status

---

## 📸 Screenshots

### 👤 User Dashboard

![Dashboard](./Screenshot%202026-09-22%20162156.png)

### 🛠️ Admin Panel

![Admin Panel](./Screenshot%202026-09-22%20162246.png)

### 🔐 Login

![Login](./Screenshot%202026-09-22%20162411.png)

### 📝 Signup

![Signup](./Screenshot%202026-09-22%20162431.png)

---

## 🧱 Tech Stack

### ⚡ Frontend & Framework

<p align="left">
  <img src="https://cdn.simpleicons.org/nextdotjs/white" alt="Next.js" width="55" height="55"/>
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/tailwindcss/06B6D4" alt="Tailwind CSS" width="55" height="55"/>
</p>

**Next.js** • **Tailwind CSS**

### 🗄️ Database & Authentication

<p align="left">
  <img src="https://cdn.simpleicons.org/supabase/3ECF8E" alt="Supabase" width="55" height="55"/>
</p>

**Supabase**

### 💳 Payments

<p align="left">
  <img src="https://cdn.simpleicons.org/stripe/635BFF" alt="Stripe" width="55" height="55"/>
</p>

**Stripe**

### ☁️ Deployment

<p align="left">
  <img src="https://cdn.simpleicons.org/vercel/white" alt="Vercel" width="55" height="55"/>
</p>

**Vercel**

---

## 🗂️ Key Routes

| Route            | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `/login`         | User login                                                          |
| `/signup`        | User registration                                                   |
| `/dashboard`     | Subscriber dashboard — scores, charity, participation, and winnings |
| `/subscribe`     | Plan selection and Stripe checkout                                  |
| `/charities`     | Charity directory                                                   |
| `/admin`         | Admin panel — draws and winners management                          |
| `/admin/draws`   | Configure, simulate, and publish monthly draws                      |
| `/admin/winners` | Verify winner proof and mark payouts                                |

---

## 🔄 User Workflow

```text
Create Account
      ↓
Select Charity & Donation Share
      ↓
Choose Subscription
      ↓
Complete Stripe Checkout
      ↓
Enter Golf Scores
      ↓
Participate in Monthly Draw
      ↓
Track Winnings & Payout Status
```

## 🔄 Admin Workflow

```text
Admin Login
     ↓
Open Admin Panel
     ↓
Manage Draws
     ↓
Simulate / Publish Draw
     ↓
Review Winners
     ↓
Verify Winner Proof
     ↓
Mark Payout as Paid
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Sakshikumari1001/digital-heroes.git
```

### 2. Navigate to the Project

```bash
cd digital-heroes
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file and add your own **Supabase** and **Stripe** credentials.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

> ⚠️ Never commit your real API keys or secrets to GitHub.

### 5. Run the Development Server

```bash
npm run dev
```

Open the local development server in your browser.

---

## 🧪 Testing

The application can be tested using **Stripe Test Mode**.

### Test Card

```text
Card Number: 4242 4242 4242 4242
Expiry Date: Any future date
CVC: Any 3 digits
```

> Use Stripe's test environment when testing payments. No real payment is processed.

---

## 🌐 Live Application

**Live App:**
https://digital-heroes-5kvz.vercel.app/

**GitHub Repository:**
https://github.com/Sakshikumari1001/digital-heroes

---

## 📌 Project Highlights

* 🔐 Authentication and user account management
* 💳 Subscription-based payment flow
* ⛳ Golf score tracking
* ❤️ Charity contribution management
* 🎟️ Monthly draw participation
* 🏆 Winner verification and payout tracking
* 👨‍💼 Dedicated admin dashboard
* 📱 Responsive web interface
* ☁️ Vercel deployment

---

## 📄 About

Digital Heroes was built as a **sample full-stack assignment for the Digital Heroes trainee selection process**, based on **PRD Level 1 (March 2026)**.

The project demonstrates a complete web application workflow involving user authentication, subscriptions, golf score management, charity selection, draw participation, winner verification, and administrative management.

---

## 👥 Authors

| Name                 | Role                 |
| -------------------- | -------------------- |
| **Prem Kumar Gupta** | Full Stack Developer |
| **Sakshi Kumari**    | Full Stack Developer |

---

## ⭐ Acknowledgement

Built with **Next.js, Supabase, Stripe, Tailwind CSS, and Vercel**.

If you found this project interesting, feel free to explore the live application and repository.
