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
    <header className="sticky top-0 z-50 border-b border-forest-2 bg-forest">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display italic text-xl text-paper">
          Professor57
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/courses" className="text-paper/70 hover:text-paper">
            Courses
          </Link>
          <Link href="/practice" className="text-paper/70 hover:text-paper">
            Practice tests
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-paper/70 hover:text-paper">
                Dashboard
              </Link>
              {(user.role === "admin" || user.role === "instructor") && (
                <Link href="/admin" className="text-paper/70 hover:text-paper">
                  Admin
                </Link>
              )}
              <button onClick={() => logout()} className="text-lime hover:underline">
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-lime px-3 py-1.5 font-medium text-forest hover:bg-lime-dark hover:text-paper"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
