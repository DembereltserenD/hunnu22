'use client';

import Link from "next/link";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "./ui/sheet";
import Image from "next/image";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full border-b bg-white/80 backdrop-blur-md py-3 md:py-2 transition-colors sticky top-0 z-50 border-white/20 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image 
            src="/573289657_1631257461636918_3556630650382290902_n.jpg" 
            alt="Digital Power Logo" 
            width={40} 
            height={40}
            className="rounded-lg shadow-sm"
          />
          <span className="text-lg md:text-xl font-bold text-gray-900 font-['Clash_Display']">Digital Power</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 items-center">
          <ThemeSwitcher />
          <Link href="/worker-select">
            <Button className="bg-gradient-to-r from-purple-500 to-orange-400 hover:brightness-110 text-white border-0">Эхлэх</Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden gap-2 items-center">
          <ThemeSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Цэс</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Цэс</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/worker-select" onClick={() => setOpen(false)}>
                  <Button className="w-full justify-start text-base h-12 bg-gradient-to-r from-purple-500 to-orange-400 text-white hover:brightness-110">
                    Эхлэх
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}