import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

import { FoldDevice } from "./device-art";

/**
 * The launch stage: product name, one big statement, two pills, and the
 * product render directly beneath on pure white. No card, no gradient.
 */
export function Hero() {
  return (
    <section className="bg-background" aria-labelledby="hero-heading">
      <Container className="flex flex-col items-center pt-14 text-center sm:pt-20">
        <p className="text-kicker text-foreground">ChristianTooling</p>
        <h1 id="hero-heading" className="mt-3 max-w-5xl text-hero text-foreground">
          Technology to Help You <br className="hidden sm:inline" />
          Live Your Faith.
        </h1>
        <p className="mt-5 max-w-2xl text-lead text-muted-foreground">
          Discover, create and share tools that help Christians practice their faith more
          effectively.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/tools">Explore Tools</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/ideas#submit-idea">Submit an Idea</Link>
          </Button>
        </div>

        <div className="relative mt-10 w-full max-w-5xl sm:mt-14">
          <FoldDevice title="Illustration of the ChristianTooling tool directory on an opened foldable device" />

          {/* Floating callout, partly over the render. Flat: no shadow. */}
          <div className="mt-4 flex items-center justify-between gap-4 rounded-3xl bg-card px-6 py-4 text-left ring-1 ring-border sm:absolute sm:right-[6%] sm:bottom-[9%] sm:mt-0 sm:w-[22rem]">
            <p className="text-[14px] leading-[1.29] tracking-[-0.224px] text-foreground">
              <span className="block font-semibold">Free for every church.</span>
              <span className="text-muted-foreground">Funded by supporters like you.</span>
            </p>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/donate">Donate</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
