"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Bookmark,
  User,
  Settings,

  FileText,
  Menu,
  X,
  UserCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Browse Jobs", icon: Search },
  { href: "/dashboard/saved", label: "Saved Jobs", icon: Bookmark },
  { href: "/dashboard/applications", label: "Applications", icon: FileText },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#FAFAFA] border-r border-slate-200/60 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/60">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg className="h-8 w-8 text-slate-900 transition-transform group-hover:scale-105" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M50 18 L80 70 C82 74 80 79 76 81 C74 82 72 82 70 82 L30 82 C25 82 21 78 20 73 C19 71 20 68 21 66 L44 22 C46 18 50 16 54 18 Z" 
                stroke="currentColor" 
                strokeWidth="9" 
                strokeLinejoin="round" 
              />
              <circle cx="50" cy="56" r="7.5" fill="currentColor" />
            </svg>
            <span className="text-[15px] font-bold tracking-wider text-slate-900 uppercase">
              CareerPilot<span className="text-slate-400 font-normal">AI</span>
            </span>
          </Link>
          <button
            className="lg:hidden text-slate-400 hover:text-[#111827] transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-[#111827] border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                    : "text-slate-500 hover:text-[#111827] hover:bg-slate-100/50"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-slate-200/60 bg-[#FAFAFA]">
          <div className="flex items-center gap-3 px-2">
            <img 
              src="https://ui-avatars.com/api/?name=Vardhan+Thadala&background=f1f5f9&color=0f172a&rounded=true&bold=true" 
              alt="Vardhan Thadala" 
              className="h-9 w-9 rounded-full border border-slate-200 object-cover" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-900">Vardhan Thadala</p>
              <p className="text-xs text-slate-500">vardhan@dexze.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAFA]">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-200/60 bg-[#FAFAFA]/80 backdrop-blur-xl flex items-center px-6 sticky top-0 z-30">
          <button
            className="lg:hidden mr-4 text-slate-400 hover:text-[#111827] transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">Vardhan Thadala</p>
              <p className="text-xs text-slate-500 mt-1">vardhan@dexze.com</p>
            </div>
            <img 
              src="https://ui-avatars.com/api/?name=Vardhan+Thadala&background=f1f5f9&color=0f172a&rounded=true&bold=true" 
              alt="Vardhan Thadala" 
              className="h-9 w-9 rounded-full border border-slate-200 object-cover" 
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
