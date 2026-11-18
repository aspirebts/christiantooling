import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { donateNavItem, mainNav } from "@/config/navigation";

import { Container } from "./container";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

type SiteHeaderProps = {
  /** Account area (sign-in links or user menu), streamed in behind Suspense. */
  auth: React.ReactNode;
};

export function SiteHeader({ auth }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-[20px] backdrop-saturate-150">
      <Container className="flex h-12 items-center gap-6">
        <Logo />
        <MainNav items={mainNav} />
        <div className="ml-auto flex items-center gap-2">
          {auth}
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={donateNavItem.href}>{donateNavItem.title}</Link>
          </Button>
          <MobileNav items={mainNav} donate={donateNavItem} />
        </div>
      </Container>
    </header>
  );
}

/** Links shown to signed-out visitors. */
export function GuestActions() {
  return (
    <Button asChild size="sm" variant="ghost">
      <Link href="/login">Sign in</Link>
    </Button>
  );
}

/** Placeholder with the same footprint as the account area while it streams in. */
export function AuthAreaSkeleton() {
  return <Skeleton className="h-8 w-20 rounded-md" />;
}
