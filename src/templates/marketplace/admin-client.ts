// Plain-fetch data layer for the on-site /admin (managers). Deliberately NOT the
// dashboard `api` client: this runs on the PUBLIC served site, so a 401 must never
// bounce a site-user to the dashboard /login. Returns the envelope's `data` and
// surfaces `error.message`; every call is authorized by the site-session cookie.

import type { CreateListingInput, UpdateListingInput } from "@/server/listings/listings.schema";

const BASE = "/api/public/site-auth";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (res.ok && json?.ok) return json.data as T;
  const message = json && !json.ok ? json.error?.message ?? "تعذّر إتمام الطلب" : "تعذّر إتمام الطلب";
  throw Object.assign(new Error(message), { code: json?.error?.code as string | undefined });
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: "manager" | "contributor" | "member";
  createdAt: string;
}

/** A listing row as the admin listings API returns it (raw Prisma JSON columns). */
export interface AdminListingRow {
  id: string;
  vertical: "car" | "home";
  title: string;
  price: number | null;
  offer: string | null;
  place: string | null;
  description: string | null;
  images: string[];
  features: string[];
  specs: Record<string, string | number>;
  published: boolean;
  featured: boolean;
  status: "available" | "reserved" | "sold";
}

export const adminApi = {
  users: {
    list: () => req<AdminUserRow[]>("GET", "/admin/users"),
    setRole: (id: string, role: AdminUserRow["role"]) => req<{ id: string }>("PATCH", `/admin/users/${id}`, { role }),
    resetPassword: (id: string) => req<{ id: string; tempPassword: string }>("POST", `/admin/users/${id}/reset-password`),
    remove: (id: string) => req<{ id: string; deleted: true }>("DELETE", `/admin/users/${id}`),
  },
  listings: {
    list: () => req<AdminListingRow[]>("GET", "/admin/listings"),
    create: (input: CreateListingInput) => req<AdminListingRow>("POST", "/admin/listings", input),
    update: (id: string, input: UpdateListingInput) => req<AdminListingRow>("PATCH", `/admin/listings/${id}`, input),
    remove: (id: string) => req<{ id: string; deleted: true }>("DELETE", `/admin/listings/${id}`),
  },
  async uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${BASE}/admin/uploads`, { method: "POST", body: fd });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.ok) return json.data.url as string;
    throw new Error(json && !json.ok ? json.error?.message ?? "تعذّر رفع الصورة" : "تعذّر رفع الصورة");
  },
};

export interface ProfileInput {
  name?: string;
  phone?: string | null;
  password?: string;
}

/** The signed-in user edits their OWN profile (name/phone/password) via /me. */
export const profileApi = {
  update: (input: ProfileInput) =>
    req<{ user: { id: string; email: string; name: string | null; phone: string | null; role: AdminUserRow["role"] } }>(
      "PATCH",
      "/me",
      input,
    ),
};

/** A seller (contributor) manages only their OWN listings via /my/listings. */
export const sellerApi = {
  list: () => req<AdminListingRow[]>("GET", "/my/listings"),
  create: (input: CreateListingInput) => req<AdminListingRow>("POST", "/my/listings", input),
  update: (id: string, input: UpdateListingInput) => req<AdminListingRow>("PATCH", `/my/listings/${id}`, input),
  remove: (id: string) => req<{ id: string; deleted: true }>("DELETE", `/my/listings/${id}`),
};
