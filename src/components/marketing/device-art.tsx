import { useId } from "react";

import { cn } from "@/lib/utils";

/*
 * Original product artwork for ChristianTooling (not photography, not another
 * company's imagery). Devices are drawn as SVG so they stay sharp at any size,
 * add no image weight, and use the real design tokens. Screen contents are
 * illustrative: sample names are labelled, and nothing implies real listings.
 */

const INK = "#1d1d1f";
const SLATE = "#6e6e73";
const MIST = "#f5f5f7";
const BLUE = "#0071e3";
const LINK = "#0066cc";

type ArtProps = { className?: string; title: string };

function Text({
  x,
  y,
  size,
  weight = 400,
  fill = INK,
  anchor,
  children,
}: {
  x: number;
  y: number;
  size: number;
  weight?: number;
  fill?: string;
  anchor?: "middle" | "end";
  children: React.ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      fill={fill}
      textAnchor={anchor}
      style={{ fontFamily: "inherit", letterSpacing: size > 20 ? "-0.02em" : "-0.01em" }}
    >
      {children}
    </text>
  );
}

function Chip({
  x,
  y,
  w,
  label,
  active,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  active?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={32} rx={16} fill={active ? BLUE : MIST} />
      <Text x={x + w / 2} y={y + 21} size={13} fill={active ? "#fff" : INK} anchor="middle">
        {label}
      </Text>
    </g>
  );
}

function ToolRow({
  x,
  y,
  w,
  initials,
  name,
  meta,
}: {
  x: number;
  y: number;
  w: number;
  initials: string;
  name: string;
  meta: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={80} rx={22} fill={MIST} />
      <rect x={x + 16} y={y + 16} width={48} height={48} rx={14} fill={INK} />
      <Text x={x + 40} y={y + 46} size={16} weight={600} fill="#fff" anchor="middle">
        {initials}
      </Text>
      <Text x={x + 80} y={y + 37} size={17} weight={600}>
        {name}
      </Text>
      <Text x={x + 80} y={y + 59} size={13} fill={SLATE}>
        {meta}
      </Text>
    </g>
  );
}

/** Opened foldable device showing the tool directory. Hero centerpiece. */
export function FoldDevice({ className, title }: ArtProps) {
  const uid = useId().replaceAll(":", "");
  return (
    <svg
      viewBox="0 0 1200 800"
      role="img"
      aria-label={title}
      className={cn("h-auto w-full font-sans", className)}
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f6" />
          <stop offset="0.5" stopColor="#dcdce0" />
          <stop offset="1" stopColor="#c9c9ce" />
        </linearGradient>
        <linearGradient id={`${uid}-crease`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.09" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}-ground`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-screen`}>
          <rect x="130" y="92" width="940" height="568" rx="34" />
        </clipPath>
      </defs>

      <ellipse cx="600" cy="738" rx="470" ry="30" fill={`url(#${uid}-ground)`} />

      {/* Body and bezel */}
      <rect x="100" y="60" width="1000" height="640" rx="62" fill={`url(#${uid}-body)`} />
      <rect x="116" y="76" width="968" height="608" rx="48" fill="#0b0b0c" />
      <rect x="130" y="92" width="940" height="568" rx="34" fill="#fff" />

      <g clipPath={`url(#${uid}-screen)`}>
        {/* Left page: directory */}
        <Text x={162} y={126} size={13} weight={600}>
          9:41
        </Text>
        <Text x={162} y={190} size={40} weight={600}>
          Explore tools
        </Text>
        <Text x={162} y={222} size={15} fill={SLATE}>
          Find tools for the way you practise your faith.
        </Text>
        <Chip x={162} y={246} w={78} label="Prayer" active />
        <Chip x={250} y={246} w={104} label="Scripture" />
        <Chip x={364} y={246} w={92} label="Worship" />
        <Chip x={466} y={246} w={96} label="Service" />
        <ToolRow
          x={162}
          y={304}
          w={400}
          initials="DO"
          name="Daily Office Companion"
          meta="Mobile app · Free · Sample"
        />
        <ToolRow
          x={162}
          y={396}
          w={400}
          initials="SM"
          name="Scripture Memory Coach"
          meta="Web app · Freemium · Sample"
        />
        <ToolRow
          x={162}
          y={488}
          w={400}
          initials="SG"
          name="Small Group Planner"
          meta="Web app · Free · Sample"
        />

        {/* Right page: tool detail */}
        <rect x="638" y="110" width="404" height="222" rx="26" fill={MIST} />
        <rect x="816" y="166" width="48" height="104" rx="16" fill={INK} />
        <rect x="788" y="194" width="104" height="42" rx="16" fill={INK} />
        <circle cx="888" cy="258" r="9" fill="#d9a956" />
        <Text x={640} y={376} size={30} weight={600}>
          Daily Office Companion
        </Text>
        <Text x={640} y={404} size={15} fill={SLATE}>
          Guided morning and evening prayer with gentle reminders.
        </Text>
        <rect x="640" y="430" width="360" height="9" rx="4.5" fill="#e6e6e8" />
        <rect x="640" y="452" width="300" height="9" rx="4.5" fill="#e6e6e8" />
        <rect x="640" y="474" width="330" height="9" rx="4.5" fill="#e6e6e8" />
        <rect x="640" y="520" width="104" height="38" rx="19" fill={BLUE} />
        <Text x={692} y={544} size={14} fill="#fff" anchor="middle">
          Open tool
        </Text>
        <Text x={770} y={544} size={14} fill={LINK}>
          Learn more ›
        </Text>

        {/* Fold crease */}
        <rect x="582" y="92" width="36" height="568" fill={`url(#${uid}-crease)`} />
      </g>
    </svg>
  );
}

/** A single phone with children drawn on a 312x692 screen. */
function Phone({ className, title, children }: ArtProps & { children: React.ReactNode }) {
  const uid = useId().replaceAll(":", "");
  return (
    <svg
      viewBox="0 0 360 740"
      role="img"
      aria-label={title}
      className={cn("h-auto w-full font-sans", className)}
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f6" />
          <stop offset="1" stopColor="#c9c9ce" />
        </linearGradient>
        <clipPath id={`${uid}-screen`}>
          <rect x="24" y="24" width="312" height="692" rx="40" />
        </clipPath>
      </defs>
      <rect x="6" y="6" width="348" height="728" rx="56" fill={`url(#${uid}-body)`} />
      <rect x="14" y="14" width="332" height="712" rx="50" fill="#0b0b0c" />
      <rect x="24" y="24" width="312" height="692" rx="40" fill="#fff" />
      <g clipPath={`url(#${uid}-screen)`}>{children}</g>
      <rect x="140" y="38" width="80" height="24" rx="12" fill="#0b0b0c" />
    </svg>
  );
}

export function PrayerPhone({ className }: { className?: string }) {
  const steps = ["Opening", "Psalm", "Reflection", "Closing prayer"];
  return (
    <Phone className={className} title="A prayer tool guiding an evening prayer, shown on a phone">
      <Text x={52} y={118} size={14} fill={SLATE}>
        Daily office
      </Text>
      <Text x={52} y={160} size={34} weight={600}>
        Evening prayer
      </Text>
      <circle cx="180" cy="282" r="74" fill="none" stroke="#e6e6e8" strokeWidth="10" />
      <circle
        cx="180"
        cy="282"
        r="74"
        fill="none"
        stroke={BLUE}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="190 280"
        transform="rotate(-90 180 282)"
      />
      <Text x={180} y={290} size={22} weight={600} anchor="middle">
        10 min
      </Text>
      {steps.map((step, i) => (
        <g key={step}>
          <rect x="48" y={398 + i * 62} width="264" height="50" rx="16" fill={MIST} />
          <circle cx="76" cy={423 + i * 62} r="11" fill={i === 0 ? BLUE : "#d6d6d6"} />
          <Text x={100} y={429 + i * 62} size={16}>
            {step}
          </Text>
        </g>
      ))}
      <rect x="48" y="650" width="264" height="44" rx="22" fill={BLUE} />
      <Text x={180} y={678} size={16} fill="#fff" anchor="middle">
        Begin
      </Text>
    </Phone>
  );
}

export function IdeasPhone({ className }: { className?: string }) {
  const ideas = [
    ["128", "Prayer partner matching"],
    ["96", "Offline Bible reader"],
    ["74", "Sabbath mode for your phone"],
  ];
  return (
    <Phone className={className} title="A list of tool ideas with vote counts, shown on a phone">
      <Text x={52} y={118} size={14} fill={SLATE}>
        Community
      </Text>
      <Text x={52} y={160} size={34} weight={600}>
        Ideas
      </Text>
      {ideas.map(([votes, name], i) => (
        <g key={name}>
          <rect x="40" y={196 + i * 132} width="280" height="116" rx="24" fill={MIST} />
          <rect x="56" y={214 + i * 132} width="50" height="64" rx="16" fill="#fff" />
          <Text x={81} y={238 + i * 132} size={12} fill={LINK} anchor="middle">
            ▲
          </Text>
          <Text x={81} y={264 + i * 132} size={18} weight={600} anchor="middle">
            {votes}
          </Text>
          <Text x={122} y={240 + i * 132} size={16} weight={600}>
            {name}
          </Text>
          <rect x="122" y={254 + i * 132} width="170" height="8" rx="4" fill="#d6d6d6" />
          <rect x="122" y={272 + i * 132} width="120" height="8" rx="4" fill="#e6e6e8" />
        </g>
      ))}
      <Text x={180} y={618} size={12} fill={SLATE} anchor="middle">
        Sample ideas
      </Text>
      <rect x="48" y="640" width="264" height="44" rx="22" fill={BLUE} />
      <Text x={180} y={668} size={16} fill="#fff" anchor="middle">
        Submit an idea
      </Text>
    </Phone>
  );
}

export function TeamPhone({ className }: { className?: string }) {
  const skills = ["Frontend", "Design", "Writing", "Translation"];
  return (
    <Phone
      className={className}
      title="A volunteer project recruiting contributors, shown on a phone"
    >
      <Text x={52} y={118} size={14} fill={SLATE}>
        Open source
      </Text>
      <Text x={52} y={160} size={34} weight={600}>
        Help build
      </Text>
      <rect x="40" y="196" width="280" height="196" rx="26" fill={MIST} />
      <Text x={60} y={236} size={19} weight={600}>
        Open Reading Plans API
      </Text>
      <Text x={60} y={262} size={14} fill={SLATE}>
        Recruiting · Sample project
      </Text>
      {[0, 1, 2, 3].map((n) => (
        <circle
          key={n}
          cx={78 + n * 30}
          cy={322}
          r="20"
          fill={["#1d1d1f", "#6e6e73", "#0071e3", "#86868b"][n]}
          stroke={MIST}
          strokeWidth="4"
        />
      ))}
      <Text x={60} y={374} size={13} fill={SLATE}>
        4 volunteers
      </Text>
      <Text x={52} y={438} size={16} weight={600}>
        Skills needed
      </Text>
      {skills.map((skill, i) => (
        <Chip
          key={skill}
          x={48 + (i % 2) * 130}
          y={456 + Math.floor(i / 2) * 44}
          w={i % 2 ? 118 : 120}
          label={skill}
          active={i === 0}
        />
      ))}
      <rect x="48" y="650" width="264" height="44" rx="22" fill={BLUE} />
      <Text x={180} y={678} size={16} fill="#fff" anchor="middle">
        Apply to volunteer
      </Text>
    </Phone>
  );
}

export function GivePhone({ className }: { className?: string }) {
  const uses = ["Staff", "Development", "Maintenance"];
  return (
    <Phone className={className} title="A donation screen listing where gifts go, shown on a phone">
      <Text x={52} y={118} size={14} fill={SLATE}>
        Donate
      </Text>
      <Text x={52} y={160} size={34} weight={600}>
        Support the mission
      </Text>
      <Text x={52} y={196} size={14} fill={SLATE}>
        Where your gift goes
      </Text>
      {uses.map((use, i) => (
        <g key={use}>
          <rect x="40" y={224 + i * 100} width="280" height="84" rx="24" fill={MIST} />
          <rect x="58" y={244 + i * 100} width="44" height="44" rx="14" fill={INK} />
          <rect x="70" y={256 + i * 100} width="20" height="20" rx="6" fill="#d9a956" />
          <Text x={120} y={272 + i * 100} size={18} weight={600}>
            {use}
          </Text>
          <rect x="120" y={284 + i * 100} width="150" height="8" rx="4" fill="#d6d6d6" />
        </g>
      ))}
      <rect x="48" y="650" width="264" height="44" rx="22" fill={BLUE} />
      <Text x={180} y={678} size={16} fill="#fff" anchor="middle">
        Give
      </Text>
    </Phone>
  );
}
