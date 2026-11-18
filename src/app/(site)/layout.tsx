import { Suspense } from "react";

import { AuthAreaSkeleton, SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

import { HeaderAuth } from "./_components/header-auth";

/**
 * Public marketing site. Everything here is prerendered into a static shell;
 * only the header's account area reads the session and streams in.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader
        auth={
          <Suspense fallback={<AuthAreaSkeleton />}>
            <HeaderAuth />
          </Suspense>
        }
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
