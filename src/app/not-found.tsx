import Link from "next/link";
import { CompassIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-hairline-silver">
        <Container className="flex h-16 items-center">
          <Logo />
        </Container>
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="flex max-w-md flex-col items-center gap-5 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-studio-mist text-slate">
            <CompassIcon className="size-7" aria-hidden="true" />
          </span>
          <p className="eyebrow text-highlight-strong">404</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Page not found</h1>
          <p className="text-muted-foreground">
            The page you are looking for does not exist, has moved, or you do not have access to it.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">Go to the homepage</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tools">Explore tools</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
