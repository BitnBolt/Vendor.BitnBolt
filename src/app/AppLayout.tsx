"use client";

import { usePathname } from "next/navigation";
import { Toaster } from 'react-hot-toast';
import SidebarLayout from "./sidebar-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {isAuthRoute ? children : <SidebarLayout>{children}</SidebarLayout>}
    </>
  );
}
