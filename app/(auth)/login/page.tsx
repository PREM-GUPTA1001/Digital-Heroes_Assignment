import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <AuthCard title="Welcome back" subtitle="Log in to enter scores and check your draws.">
      <LoginForm next={safeNext} />
      <p className="mt-6 text-center text-sm text-white/60">
        New here?{" "}
        <Link href="/signup" className="text-emerald-400 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}