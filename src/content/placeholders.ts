/**
 * PLACEHOLDER CONTENT FOR LAYOUT PREVIEWS ONLY.
 *
 * Nothing in this file is platform data. These examples exist so the
 * foundational layouts can be reviewed before the directory, ideas and
 * projects modules are built. The UI labels every item as a sample.
 *
 * Phase 2+ replaces each export with database queries (see BUILD_PROGRESS.md).
 * Practice categories, technology types and skills are NOT here: they are real
 * reference data loaded from the database.
 */

export type SampleTool = {
  name: string;
  tagline: string;
  practice: string;
  format: string;
  pricing: string;
};

export const SAMPLE_TOOLS: SampleTool[] = [
  {
    name: "Daily Office Companion",
    tagline: "Pray morning and evening prayer with guided readings and reminders.",
    practice: "Prayer",
    format: "Mobile App",
    pricing: "Free",
  },
  {
    name: "Scripture Memory Coach",
    tagline: "Spaced-repetition practice for memorising verses in your translation.",
    practice: "Scripture Memory",
    format: "Web App",
    pricing: "Freemium",
  },
  {
    name: "Small Group Planner",
    tagline: "Coordinate meetings, prayer requests and discussion guides in one place.",
    practice: "Fellowship & Community",
    format: "Web App",
    pricing: "Free",
  },
];

export type SampleIdea = {
  title: string;
  summary: string;
  practice: string;
  votes: number;
  status: string;
};

export const SAMPLE_IDEAS: SampleIdea[] = [
  {
    title: "Prayer partner matching for new believers",
    summary: "Pair people who are new to faith with a mature prayer partner from a local church.",
    practice: "Discipleship",
    votes: 128,
    status: "Open for votes",
  },
  {
    title: "Offline Bible reader for low-connectivity regions",
    summary: "A lightweight reader that syncs over SMS or occasional Wi-Fi for remote communities.",
    practice: "Bible Reading & Study",
    votes: 96,
    status: "Approved",
  },
  {
    title: "Sabbath mode for your phone",
    summary: "Gently pause notifications and suggest restful practices one day a week.",
    practice: "Rest & Sabbath",
    votes: 74,
    status: "Open for votes",
  },
];

export type SampleProject = {
  name: string;
  summary: string;
  skills: string[];
  status: string;
};

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    name: "Open Reading Plans API",
    summary: "A shared, openly licensed API of Bible reading plans that any app can use.",
    skills: ["Backend development", "Technical writing"],
    status: "Recruiting",
  },
  {
    name: "Accessible Worship Lyrics",
    summary: "High-contrast, screen-reader friendly lyric display for churches.",
    skills: ["Frontend development", "Accessibility"],
    status: "Planning",
  },
];

export type ConceptTool = {
  name: string;
  summary: string;
  stage: string;
};

export const CONCEPT_OUR_TOOLS: ConceptTool[] = [
  {
    name: "ChristianTooling Directory",
    summary: "This platform: a trusted, curated directory of tools for practising the faith.",
    stage: "In development",
  },
  {
    name: "Prayer List",
    summary: "A private, simple prayer list with gentle reminders and answered-prayer journaling.",
    stage: "In planning",
  },
  {
    name: "Church Volunteer Rota",
    summary: "Free scheduling for small churches that cannot afford commercial software.",
    stage: "In planning",
  },
];
