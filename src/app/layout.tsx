import "./globals.css";
import { Inter } from "next/font/google";
// import SidebarLayout from "./sidebar-layout";
import SidebarLayout from "./sidebar-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Vendor Dashboard",
  description: "Vendor portal dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-gray-50 min-h-screen"}>
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
