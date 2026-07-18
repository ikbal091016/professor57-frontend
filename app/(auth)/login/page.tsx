"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { FormField } from "@/components/FormField";
import { ErrorBanner } from "@/components/ErrorBanner";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push(searchParams.get("next") || "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Professor57"
      subtitle="Pick up your courses and practice tests where you left off."
    >
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-forest">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm text-lime-dark hover:underline">
              Forgot it?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-rule bg-white px-3.5 py-2.5 text-sm text-forest
                       focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-forest py-2.5 text-sm font-medium text-paper transition-colors
                     hover:bg-forest-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-forest/60">
        New to Professor57?{" "}
        <Link href="/register" className="font-medium text-lime-dark hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
