"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaHome, FaBoxOpen, FaTruck, FaChartBar, FaCreditCard, FaTags, FaUsers, FaBuilding, FaCog, FaShoppingBag, FaBars } from "react-icons/fa";

const sidebarLinks = [
  {
    href: "/",
    icon: <FaHome size={18} />,
    label: "Home",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/orders",
    icon: <FaShoppingBag size={18} />,
    label: "Orders",
    isActive: (pathname: string) => pathname.startsWith("/orders"),
  },
  {
    href: "/delivery",
    icon: <FaTruck size={18} />,
    label: "Delivery",
    isActive: (pathname: string) => pathname.startsWith("/delivery"),
  },
  {
    href: "/products",
    icon: <FaBoxOpen size={18} />,
    label: "Products",
    isActive: (pathname: string) => pathname.startsWith("/products"),
  },
  {
    href: "/analytics",
    icon: <FaChartBar size={18} />,
    label: "Analytics",
    badge: "Pro",
    isActive: (pathname: string) => pathname.startsWith("/analytics"),
  },
  {
    href: "/payments",
    icon: <FaCreditCard size={18} />,
    label: "Payments",
    isActive: (pathname: string) => pathname.startsWith("/payments"),
  },
  {
    href: "/discounts",
    icon: <FaTags size={18} />,
    label: "Discounts",
    isActive: (pathname: string) => pathname.startsWith("/discounts"),
  },
  {
    href: "/customer",
    icon: <FaUsers size={18} />,
    label: "Customer",
    isActive: (pathname: string) => pathname.startsWith("/customer"),
  },
  {
    href: "/my-company",
    icon: <FaBuilding size={18} />,
    label: "My Company",
    isActive: (pathname: string) => pathname.startsWith("/my-company"),
  },
  {
    href: "/settings",
    icon: <FaCog size={18} />,
    label: "Settings",
    isActive: (pathname: string) => pathname.startsWith("/settings"),
  },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`bg-[#10272f] text-white w-64 flex flex-col py-6 px-4 space-y-2 fixed inset-y-0 left-0 z-30 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative md:w-64 md:block`}
      >
        <div className="flex items-center gap-2 mb-8 px-2">
          <span className="bg-green-500 rounded-md w-6 h-6 flex items-center justify-center"><span className="text-white font-bold">BB</span></span>
          <span className="text-xl font-bold tracking-wide">BitnBolt</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {sidebarLinks.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              badge={link.badge}
              active={link.isActive(pathname)}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>
      </aside>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen ml-0">
        {/* Topbar */}
        <header className="flex items-center justify-between bg-white shadow px-4 py-3 sticky top-0 z-10">
          <button
            className="md:hidden text-gray-700 mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Open sidebar"
          >
            <FaBars size={22} />
          </button>
          <div className="text-2xl font-semibold text-gray-800">
            {sidebarLinks.find((l) => l.isActive(pathname))?.label || "Dashboard"}
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search  products and more..."
              className="rounded-lg border border-gray-200 px-4 py-2 w-40 sm:w-64 focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-100 text-gray-800"
            />
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-6 bg-gray-50 min-h-[calc(100vh-64px)] w-full">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label, badge, active, onClick }: { href: string; icon: React.ReactNode; label: string; badge?: string; active?: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${active ? "bg-[#183642] text-white" : "hover:bg-[#183642] text-gray-200"}`}
      onClick={onClick}
    >
      <span className="text-lg group-hover:text-white">{icon}</span>
      <span className="flex-1 text-base">{label}</span>
      {badge && (
        <span className="ml-2 bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">{badge}</span>
      )}
    </Link>
  );
}
