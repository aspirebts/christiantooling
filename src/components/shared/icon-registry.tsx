import {
  BookMarkedIcon,
  BookmarkIcon,
  BookOpenIcon,
  ChurchIcon,
  CodeIcon,
  DatabaseIcon,
  GlobeIcon,
  GraduationCapIcon,
  HandCoinsIcon,
  HandHeartIcon,
  HeadphonesIcon,
  HeartHandshakeIcon,
  HouseIcon,
  LibraryIcon,
  type LucideIcon,
  type LucideProps,
  MegaphoneIcon,
  MessageSquareIcon,
  MicIcon,
  MonitorIcon,
  MusicIcon,
  NotebookPenIcon,
  PuzzleIcon,
  ShapesIcon,
  SmartphoneIcon,
  SparklesIcon,
  SproutIcon,
  SunriseIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  WatchIcon,
} from "lucide-react";

/**
 * Maps the Lucide icon names stored in the database (practice_categories.icon,
 * technology_types.icon) to components. An explicit registry keeps the bundle
 * small (importing every icon would add hundreds of kilobytes) and falls back
 * gracefully when an administrator chooses an icon that is not registered yet.
 */
const ICONS: Record<string, LucideIcon> = {
  "book-marked": BookMarkedIcon,
  bookmark: BookmarkIcon,
  "book-open": BookOpenIcon,
  church: ChurchIcon,
  code: CodeIcon,
  database: DatabaseIcon,
  globe: GlobeIcon,
  "graduation-cap": GraduationCapIcon,
  "hand-coins": HandCoinsIcon,
  "hand-heart": HandHeartIcon,
  headphones: HeadphonesIcon,
  "heart-handshake": HeartHandshakeIcon,
  house: HouseIcon,
  library: LibraryIcon,
  megaphone: MegaphoneIcon,
  "message-square": MessageSquareIcon,
  mic: MicIcon,
  monitor: MonitorIcon,
  music: MusicIcon,
  "notebook-pen": NotebookPenIcon,
  puzzle: PuzzleIcon,
  smartphone: SmartphoneIcon,
  sparkles: SparklesIcon,
  sprout: SproutIcon,
  sunrise: SunriseIcon,
  users: UsersIcon,
  "utensils-crossed": UtensilsCrossedIcon,
  watch: WatchIcon,
};

type DataIconProps = Omit<LucideProps, "name"> & { name: string | null | undefined };

/** Renders a database-configured icon by name (decorative by default). */
export function DataIcon({ name, ...props }: DataIconProps) {
  const Icon = (name ? ICONS[name] : undefined) ?? ShapesIcon;
  return <Icon aria-hidden="true" {...props} />;
}
