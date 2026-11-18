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
import { adminNav, dashboardNav, type AppNavItem } from "@/config/navigation";
import { can } from "@/lib/rbac/permissions";
import type { Role } from "@/lib/rbac/roles";
import { cn } from "@/lib/utils";

import { isActivePath } from "./main-nav";

export type AppNavVariant = "dashboard" | "admin";

/**
 * Items visible to the viewer. Filtering here is presentational only: every
 * admin page and action checks the same permission on the server.
 */
function visibleItems(variant: AppNavVariant, role: Role): AppNavItem[] {
  const items = variant === "admin" ? adminNav : dashboardNav;
  return items.filter((item) => !item.permission || can(role, item.permission));
}

function NavLinks({
  variant,
  role,
  onNavigate,
}: {
  variant: AppNavVariant;
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-0.5">
      {visibleItems(variant, role).map((item) => {
        const active = isActivePath(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                active
                  ? "bg-ink text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-ink",
              )}
            >
              <Icon
                className={cn("size-4", active ? "text-apple-blue" : "text-current")}
                aria-hidden="true"
              />
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppSidebarNav({
  variant,
  role,
  label,
}: {
  variant: AppNavVariant;
  role: Role;
  label: string;
}) {
  return (
    <nav aria-label={label}>
      <NavLinks variant={variant} role={role} />
    </nav>
  );
}

export function AppMobileNav({
  variant,
  role,
  label,
  footer,
}: {
  variant: AppNavVariant;
  role: Role;
  label: string;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={`Open ${label} menu`}>
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0">
        <SheetHeader className="border-b px-5 py-5">
          <SheetTitle>{label}</SheetTitle>
          <SheetDescription className="sr-only">{label} navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label={label} className="flex-1 overflow-y-auto p-3">
          <NavLinks variant={variant} role={role} onNavigate={() => setOpen(false)} />
        </nav>
        {footer ? <div className="border-t p-4">{footer}</div> : null}
      </SheetContent>
    </Sheet>
  );
}
