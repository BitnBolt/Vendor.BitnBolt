"use client";

import { usePathname } from "next/navigation";
import SidebarLayout from "./sidebar-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return <SidebarLayout>{children}</SidebarLayout>;
}
