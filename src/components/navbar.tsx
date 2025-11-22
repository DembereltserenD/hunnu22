'use client';

import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import Image from "next/image";

export default function Navbar() {

  return (
    <nav className="w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-3 md:py-2 transition-colors sticky top-0 z-50 border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/573289657_1631257461636918_3556630650382290902_n.jpg"
            alt="Digital Power Logo"
            width={40}
            height={40}
            className="rounded-lg shadow-sm"
          />
          <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-['Clash_Display']">Digital Power</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 items-center">
          <ThemeSwitcher />
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden gap-2 items-center">
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}