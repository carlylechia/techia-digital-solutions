"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Locale } from "@/content/site";

export function AdminSignOutButton({ locale }: { locale: Locale }) {
  return (
    <button className="btn-secondary px-4 py-2 text-sm" type="button" onClick={() => signOut({ callbackUrl: `/${locale}/admin` })}>
      <LogOut className="size-4" />
      Sign out
    </button>
  );
}
