"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function BlogSignOutButton({ callbackUrl }: { callbackUrl: string }) {
  return <button className="btn-secondary px-4 py-2 text-sm" type="button" onClick={() => signOut({ callbackUrl })}><LogOut className="size-4" />Sign out</button>;
}
