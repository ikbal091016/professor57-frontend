"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const hide =
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/checkout");
  if (hide) return null;

  return (
    <header className="border-b border-rule bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display italic text-xl text-forest">
          Professor57
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/courses" className="text-forest/70 hover:text-forest">
            Courses
          </Link>
          <Link href="/practice" className="text-forest/70 hover:text-forest">
            Practice tests
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-forest/70 hover:text-forest">
                Dashboard
              </Link>
              {(user.role === "admin" || user.role === "instructor") && (
                <Link href="/admin" className="text-forest/70 hover:text-forest">
                  Admin
                </Link>
              )}
              <button onClick={() => logout()} className="text-lime-dark hover:underline">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-md bg-forest px-3 py-1.5 text-paper hover:bg-forest-2">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
