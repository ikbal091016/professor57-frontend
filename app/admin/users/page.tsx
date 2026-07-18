"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchUsers, updateUserRole, AdminUser } from "@/lib/admin-api";

const ROLES: AdminUser["role"][] = ["student", "instructor", "admin"];

export default function AdminUsersPage() {
  const { accessToken, user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");

  function load() {
    fetchUsers({ search: search || undefined }, accessToken).then((res) => setUsers(res.users));
  }

  useEffect(load, [accessToken, search]);

  async function handleRoleChange(userId: string, role: string) {
    await updateUserRole(userId, role, accessToken);
    load();
  }

  return (
    <main className="p-10">
      <h1 className="font-display text-2xl text-forest">Users</h1>

      <input
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-72 rounded-md border border-rule bg-white px-3 py-2 text-sm"
      />

      <div className="mt-6 overflow-hidden rounded-lg border border-rule bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-rule bg-paper text-left text-xs uppercase tracking-wide text-forest/40">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-3 text-forest">{u.name}</td>
                <td className="px-4 py-3 text-forest/60">{u.email}</td>
                <td className="px-4 py-3">
                  {u._id === me?.id ? (
                    <span className="text-forest/40">{u.role} (you)</span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="rounded-md border border-rule px-2 py-1 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-forest/40">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-forest/40">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
