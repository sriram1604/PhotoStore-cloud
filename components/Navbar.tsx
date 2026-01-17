"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Home, Upload, Image as ImageIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Upload", href: "/upload", icon: Upload },
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="hidden md:flex fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
                <ImageIcon className="w-6 h-6 text-primary" />
            </div>
          <span className="text-xl font-bold tracking-tight">PhotoStore</span>
        </div>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </header>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-background/90 backdrop-blur-lg border-t border-border flex justify-around items-center py-3 pb-safe">
        {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                    isActive ? "text-primary" : "text-muted-foreground"
                )}
                >
                <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
                <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
            )
        })}
        <div className="flex flex-col items-center gap-1 p-2">
            <UserButton />
            <span className="text-[10px] font-medium text-muted-foreground">Profile</span>
        </div>
      </nav>
    </>
  );
}
