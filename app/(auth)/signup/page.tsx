import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { createClient } from "@/lib/supabase/server";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: charities } = await supabase
    .from("charities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <AuthCard title="Join Digital Heroes" subtitle="Pick a cause. Play. Win. Give back.">
      <SignupForm charities={charities ?? []} />
      <p className="mt-6 text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-400 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}