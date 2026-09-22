import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export type PlanKey = "monthly" | "yearly";

type Plan = {
  label: string;
  price: number;
  per: string;
  note: string;
  priceId: string;
};

export const PLANS: { monthly: Plan; yearly: Plan } = {
  monthly: {
    label: "Monthly",
    price: 9.99,
    per: "month",
    note: "Flexible. Cancel anytime.",
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
  },
  yearly: {
    label: "Yearly",
    price: 99.99,
    per: "year",
    note: "Best value: about 2 months free.",
    priceId: process.env.STRIPE_PRICE_YEARLY!,
  },
};