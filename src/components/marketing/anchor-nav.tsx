import { Container } from "@/components/layout/container";

export type AnchorItem = { label: string; href: string };

/** In-page chapter navigation: quiet 17px/500 labels, no boxes or underlines. */
export function AnchorNav({ items }: { items: AnchorItem[] }) {
  return (
    <nav aria-label="On this page" className="bg-background">
      <Container>
        <ul className="no-scrollbar flex justify-start gap-8 overflow-x-auto py-7 sm:justify-center sm:gap-10">
          {items.map((item) => (
            <li key={item.href} className="shrink-0">
              <a
                href={item.href}
                className="rounded-md text-[17px] leading-[25px] font-medium tracking-[-0.374px] text-foreground/80 transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
