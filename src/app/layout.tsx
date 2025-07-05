import "./globals.css";
import { Inter } from "next/font/google";
import AppLayout from "./AppLayout"; // import the client wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Vendor Dashboard",
  description: "Vendor portal dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-gray-50 min-h-screen"}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
