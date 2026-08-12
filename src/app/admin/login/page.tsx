import type { Metadata } from "next";

import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
