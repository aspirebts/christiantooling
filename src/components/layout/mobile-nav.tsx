"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

import { isActivePath } from "./main-nav";

type MobileNavProps = {
  items: NavItem[];
  donate: NavItem;
};

/**
 * Mobile navigation drawer. Closes itself on navigation: with Cache Components
 * routes stay mounted (React Activity), so open state would otherwise persist.
 */
export function MobileNav({ items, donate }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-0">
        <SheetHeader className="border-b px-5 py-5">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-2xl px-3 py-3 transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  active && "bg-accent",
                )}
              >
                <span className="block text-[17px] font-semibold text-foreground">
                  {item.title}
                </span>
                {item.description ? (
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {item.description}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <Button asChild className="w-full" size="lg">
            <Link href={donate.href} onClick={close}>
              {donate.title}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
