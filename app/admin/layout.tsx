"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, ListChecks, ClipboardList, Receipt, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/questions", label: "Question bank", icon: ListChecks },
  { href: "/admin/tests", label: "Practice tests", icon: ClipboardList },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) return <main className="p-10 text-forest/60">Loading…</main>;

  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="font-display text-2xl text-forest">Staff access only</p>
        <p className="mt-2 text-forest/60">This area is for course admins and instructors.</p>
      </main>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr]">
      <aside className="border-r border-rule bg-white px-4 py-8">
        <p className="px-3 font-display italic text-lg text-forest">Professor57</p>
        <p className="px-3 text-xs text-forest/40">Admin</p>
        <nav className="mt-6 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
                  active ? "bg-forest text-paper" : "text-forest/60 hover:bg-paper hover:text-forest"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="bg-paper">{children}</div>
    </div>
  );
}
