import Link from "next/link";
import { LogOutIcon } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/rbac/roles";
import { getInitials } from "@/lib/utils";
import { signOut } from "@/server/actions/auth";

import { AppMobileNav, AppSidebarNav, type AppNavVariant } from "./app-nav";

export type ShellUser = {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  role: Role;
  roleLabel: string;
};

type AppShellProps = {
  variant: AppNavVariant;
  label: string;
  user: ShellUser;
  /** Link to the other area, e.g. Administration or back to the dashboard. */
  switchLink?: { href: string; label: string };
  children: React.ReactNode;
};

function SignOutButton({ className }: { className?: string }) {
  // Progressive enhancement: works even before JavaScript loads.
  return (
    <form action={signOut} className={className}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
      >
        <LogOutIcon aria-hidden="true" />
        Sign out
      </Button>
    </form>
  );
}

function UserSummary({ user }: { user: ShellUser }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{user.displayName}</p>
        <p className="truncate text-xs text-highlight-strong">{user.roleLabel}</p>
      </div>
    </div>
  );
}

/** Layout for authenticated areas: sidebar on desktop, drawer on mobile. */
export function AppShell({ variant, label, user, switchLink, children }: AppShellProps) {
  const sidebarFooter = (
    <div className="flex flex-col gap-3">
      <UserSummary user={user} />
      {switchLink ? (
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={switchLink.href}>{switchLink.label}</Link>
        </Button>
      ) : null}
      <SignOutButton />
    </div>
  );

  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-hairline-silver bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-hairline-silver px-5">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-3 pt-2 pb-3 text-compact font-semibold text-muted-foreground">{label}</p>
          <AppSidebarNav variant={variant} role={user.role} label={label} />
        </div>
        <div className="border-t border-hairline-silver p-4">{sidebarFooter}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-hairline-silver bg-background/90 px-4 backdrop-blur lg:hidden">
          <AppMobileNav variant={variant} role={user.role} label={label} footer={sidebarFooter} />
          <Logo />
        </header>
        <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

type AppPageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

/** Page title row inside the app shell. */
export function AppPageHeader({ title, description, actions }: AppPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
