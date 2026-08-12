"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionCookieValue,
  safeStringEquals,
} from "@/analytics/server/adminSession";

export interface AdminLoginState {
  error?: string;
}

export async function loginAction(
  _previous: AdminLoginState | undefined,
  formData: FormData,
): Promise<AdminLoginState> {
  const expectedPassword = process.env.ANALYTICS_ADMIN_PASSWORD;
  const sessionSecret = process.env.ANALYTICS_ADMIN_SESSION_SECRET;
  if (!expectedPassword || !sessionSecret) {
    return {
      error:
        "Authentification admin non configurée sur ce déploiement (ANALYTICS_ADMIN_PASSWORD / ANALYTICS_ADMIN_SESSION_SECRET manquants).",
    };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return { error: "Mot de passe requis." };
  }
  if (!safeStringEquals(password, expectedPassword)) {
    return { error: "Mot de passe incorrect." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionCookieValue(sessionSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  redirect("/admin/analytics");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
