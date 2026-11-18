import type { Metadata } from "next";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";

import {
  ButtonSpecimens,
  DialogSpecimen,
  FormSpecimen,
} from "@/components/design-system/interactive-specimens";
import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeading } from "@/components/layout/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Design system",
  description: "ChristianTooling design tokens and components.",
  robots: { index: false },
};

// Full class names so Tailwind can detect them at build time.
const COLORS = [
  {
    name: "Gallery White",
    value: "#ffffff",
    className: "bg-gallery-white",
    role: "Canvas, hero, cards",
  },
  {
    name: "Studio Mist",
    value: "#f5f5f7",
    className: "bg-studio-mist",
    role: "Alternate bands, footer",
  },
  { name: "Paper Frost", value: "#fafafc", className: "bg-paper-frost", role: "Opened navigation" },
  {
    name: "Hairline Silver",
    value: "#d6d6d6",
    className: "bg-hairline-silver",
    role: "1px dividers",
  },
  { name: "Control Gray", value: "#e6e6e8", className: "bg-control-gray", role: "Disabled fills" },
  { name: "Ink", value: "#1d1d1f", className: "bg-ink", role: "Headlines, body" },
  { name: "Slate", value: "#6e6e73", className: "bg-slate", role: "Secondary copy" },
  { name: "Steel", value: "#86868b", className: "bg-steel", role: "Outlines, inactive" },
  { name: "Apple Blue", value: "#0066cc", className: "bg-apple-blue", role: "Links" },
  {
    name: "Pricing Blue",
    value: "#0071e3",
    className: "bg-pricing-blue",
    role: "Filled pills only",
  },
  { name: "Launch Orange", value: "#b64400", className: "bg-launch-orange", role: "Launch labels" },
];

const SPACING = [4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80];

export default function DesignSystemPage() {
  return (
    <>
      <PageHeader
        eyebrow="For contributors"
        title="Design system"
        description="A white gallery: product visuals are the event, type and controls stay quiet around them. Source: src/app/globals.css and src/components/ui."
      />

      <Section tone="muted" aria-labelledby="color-heading">
        <SectionHeading
          id="color-heading"
          title="Colour"
          description="Monochrome surfaces and ink, with one blue used sparingly: Apple Blue for links and Pricing Blue for compact filled pills. No gradients."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLORS.map((color) => (
            <li key={color.name} className="flex flex-col gap-3 rounded-3xl bg-card p-4">
              <span className={`h-20 rounded-2xl ring-1 ring-black/5 ${color.className}`} />
              <span className="flex flex-col">
                <span className="text-[17px] font-semibold text-foreground">{color.name}</span>
                <span className="font-mono text-[12px] text-muted-foreground">{color.value}</span>
                <span className="text-[14px] text-muted-foreground">{color.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-labelledby="type-heading">
        <SectionHeading
          id="type-heading"
          title="Typography"
          description="SF Pro on Apple devices, with Inter as the fallback elsewhere. Tight tracking at display sizes; slightly negative tracking in text."
        />
        <div className="mt-10 flex flex-col gap-8 rounded-3xl bg-secondary p-8 sm:p-12">
          <div>
            <p className="text-kicker text-foreground">Kicker, 21px / 600</p>
            <p className="mt-2 text-hero text-foreground">Hero display</p>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              text-hero: 80px / 600 / 1.05, -1.2px
            </p>
          </div>
          <div>
            <p className="text-section text-foreground">Section heading</p>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              text-section: 48px / 600
            </p>
          </div>
          <div>
            <p className="text-feature text-foreground">Feature statement</p>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              text-feature: 40px / 600
            </p>
          </div>
          <div>
            <p className="max-w-reading text-lead text-muted-foreground">
              Lead copy introduces a page or section in a calm, readable size.
            </p>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">text-lead: 21px</p>
          </div>
          <div>
            <p className="max-w-reading text-foreground">
              Body copy is set at 17px with a 1.47 line height and -0.374px tracking for comfortable
              reading across devices.
            </p>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Small copy, 14px, for supporting detail.
            </p>
            <p className="mt-1 text-compact text-muted-foreground">
              Compact, 12px, for navigation and footnotes.
            </p>
          </div>
          <p className="text-[12px] leading-4 font-semibold text-launch-orange">
            New: launch status is bare text, never a pill.
          </p>
        </div>
      </Section>

      <Section tone="muted" aria-labelledby="shape-heading">
        <SectionHeading
          id="shape-heading"
          title="Shape and space"
          description="28px for cards and media, fully round pills for controls, 4px base spacing, 90px between sections. Surfaces are flat: separation comes from white on mist, never shadows."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="flex h-44 items-center justify-center rounded-3xl bg-card text-[17px] text-foreground">
            28px card
          </div>
          <div className="flex h-44 items-center justify-center">
            <span className="rounded-full border border-steel px-6 py-2 text-[14px] text-foreground">
              Pill control
            </span>
          </div>
          <ul className="flex flex-col justify-center gap-2.5">
            {SPACING.map((step) => (
              <li key={step} className="flex items-center gap-3">
                <span className="w-8 font-mono text-[12px] text-muted-foreground">{step}</span>
                <span className="h-2 rounded-full bg-steel" style={{ width: step * 2 }} />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section aria-labelledby="buttons-heading">
        <SectionHeading id="buttons-heading" title="Buttons" />
        <div className="mt-8">
          <ButtonSpecimens />
        </div>
      </Section>

      <Section tone="muted" aria-labelledby="components-heading">
        <SectionHeading id="components-heading" title="Cards, badges, alerts and inputs" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Cards group related content on a flat 28px surface.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="highlight">Highlight</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </CardContent>
            <CardFooter className="gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </CardFooter>
          </Card>
          <div className="flex flex-col gap-3">
            <Alert variant="info">
              <InfoIcon />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>Neutral guidance or status.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <CircleCheckIcon />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>An action completed.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something needs attention.</AlertDescription>
            </Alert>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input">Input</Label>
            <Input id="ds-input" placeholder="Placeholder text" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-invalid">Invalid input</Label>
            <Input id="ds-invalid" aria-invalid defaultValue="not-an-email" />
          </div>
        </div>
      </Section>

      <Section aria-labelledby="forms-heading">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <SectionHeading
              id="forms-heading"
              title="Forms"
              description="React Hook Form with Zod schemas. The same schemas validate again on the server."
            />
            <FormSpecimen />
          </div>
          <div className="flex flex-col gap-6">
            <SectionHeading
              title="Modal"
              description="Accessible dialogs built on Radix UI."
              as="h3"
            />
            <div>
              <DialogSpecimen />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
