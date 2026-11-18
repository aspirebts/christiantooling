import Link from "next/link";

import { Button } from "@/components/ui/button";

import { GivePhone } from "./device-art";

const USES = [
  {
    title: "Staff",
    description: "People who coordinate volunteers, review tools and care for the community.",
  },
  {
    title: "Development",
    description: "Building new open-source tools that serve the Church worldwide.",
  },
  {
    title: "Maintenance",
    description: "Hosting, security updates and support so tools keep working.",
  },
];

/** Donation call to action: a calm centered statement on white, then three plain facts. */
export function SupportBand() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-5">
        <p className="eyebrow text-foreground">Support the mission</p>
        <h2 className="text-section text-foreground">
          Help keep faithful technology free and thriving.
        </h2>
        <p className="max-w-xl text-lead text-muted-foreground">
          ChristianTooling is funded by people who believe technology can serve the Church. Your
          gift supports the staff, development and maintenance behind every tool.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link href="/donate">Support the mission</Link>
          </Button>
          <Link
            href="/about"
            className="text-[17px] tracking-[-0.374px] text-apple-blue hover:underline"
          >
            Learn about our work ›
          </Link>
        </div>
        <ul className="mt-6 grid gap-5 sm:grid-cols-3">
          {USES.map(({ title, description }) => (
            <li key={title}>
              <p className="font-display text-[19px] leading-[1.21] font-semibold text-foreground">
                {title}
              </p>
              <p className="mt-1 text-[14px] leading-[1.29] text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative flex h-[30rem] items-start justify-center overflow-hidden rounded-3xl bg-secondary pt-12 sm:h-[36rem]">
        <div className="w-[15.5rem] sm:w-[18rem]">
          <GivePhone />
        </div>
      </div>
    </div>
  );
}
