import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/shared/logo";

/** Focused layout for sign-in, registration and password recovery. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col bg-secondary">
      <header className="relative">
        <Container className="flex h-16 items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to site
          </Link>
        </Container>
      </header>
      <main
        id="main-content"
        className="relative flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
