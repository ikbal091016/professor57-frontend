"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { FormField } from "@/components/FormField";
import { ErrorBanner } from "@/components/ErrorBanner";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details)) {
        const next: FieldErrors = {};
        for (const d of err.details as { field: string; message: string }[]) {
          if (d.field in ({} as FieldErrors) || ["name", "email", "password"].includes(d.field)) {
            (next as any)[d.field] = d.message;
          }
        }
        setFieldErrors(next);
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't create your account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Free preview lectures on every course — no card required to start."
    >
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="name"
          label="Full name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <p className="text-xs text-forest/50 -mt-2">At least 8 characters, with one uppercase letter and one number.</p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-forest py-2.5 text-sm font-medium text-paper transition-colors
                     hover:bg-forest-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-forest/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-lime-dark hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
