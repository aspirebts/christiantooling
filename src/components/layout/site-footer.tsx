import Link from "next/link";
import { cacheLife } from "next/cache";

import { footerNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

import { Container } from "./container";

/** Cached so the static shell can include it (a bare new Date() would block prerendering). */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-secondary text-muted-foreground">
      <Container className="py-12">
        <p className="max-w-3xl text-compact">{siteConfig.mission}</p>
        <nav
          aria-label="Footer"
          className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border/70 pt-8 sm:grid-cols-3"
        >
          {footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="text-compact font-semibold text-foreground">{group.title}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-compact transition-colors hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline focus-visible:outline-none"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-8 flex flex-col gap-2 border-t border-border/70 pt-5 text-compact sm:flex-row sm:items-center sm:justify-between">
          <p>
            Copyright © <CurrentYear /> {siteConfig.name}. A global nonprofit Christian ministry.
          </p>
          <p>Built with volunteers, in the open.</p>
        </div>
      </Container>
    </footer>
  );
}
