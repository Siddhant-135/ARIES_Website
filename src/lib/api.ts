/**
 * Public pages don't need this. Auth uses same-origin Next routes (`/api/auth/*`)
 * with Supabase session cookies.
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  base: string = API,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiBase = API;

const AUTH = "/api";

export const login = (entryNumber: string, password: string) =>
  apiFetch<{
    token: string;
    memberSlug: string;
    level: string;
    name: string;
    email: string;
  }>("/auth/login", { method: "POST", body: JSON.stringify({ entryNumber, password }) }, undefined, AUTH);

export const me = (_token?: string) =>
  apiFetch<{
    token: string;
    memberSlug: string;
    level: string;
    name: string;
    email: string;
  }>("/auth/me", {}, undefined, AUTH);

export const logout = (_token?: string) =>
  apiFetch("/auth/logout", { method: "POST" }, undefined, AUTH);

export const getAdminStats = (token: string) =>
  apiFetch<{ members: number; projects: number; events: number; problems: number }>(
    "/admin/stats",
    {},
    token,
  );

export const saveMember = (slug: string, data: unknown, token: string) =>
  apiFetch(`/members/${slug}`, { method: "PATCH", body: JSON.stringify(data) }, token);

export const saveProject = (slug: string, data: unknown, token: string) =>
  apiFetch(`/projects/${slug}`, { method: "PATCH", body: JSON.stringify(data) }, token);

export const saveEvent = (slug: string, data: unknown, token: string) =>
  apiFetch(`/events/${slug}`, { method: "PATCH", body: JSON.stringify(data) }, token);

export const createMember = (data: unknown, token: string) =>
  apiFetch("/members", { method: "POST", body: JSON.stringify(data) }, token);

export const createProject = (data: unknown, token: string) =>
  apiFetch("/projects", { method: "POST", body: JSON.stringify(data) }, token);

export const createEvent = (data: unknown, token: string) =>
  apiFetch("/events", { method: "POST", body: JSON.stringify(data) }, token);
