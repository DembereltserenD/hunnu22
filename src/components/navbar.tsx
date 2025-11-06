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
    <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 md:py-2 transition-colors sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image 
            src="/573289657_1631257461636918_3556630650382290902_n.jpg" 
            alt="Digital Power Logo" 
            width={40} 
            height={40}
            className="rounded-md"
          />
          <span className="text-lg md:text-xl font-bold text-primary">Digital Power</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 items-center">
          <ThemeSwitcher />
          <Link href="/worker-select">
            <Button>Get Started</Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden gap-2 items-center">
          <ThemeSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/worker-select" onClick={() => setOpen(false)}>
                  <Button className="w-full justify-start text-base h-12">
                    Get Started
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