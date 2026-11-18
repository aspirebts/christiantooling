import {
  BarChart3Icon,
  FolderKanbanIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  type LucideIcon,
  NewspaperIcon,
  SettingsIcon,
  ShapesIcon,
  UserCogIcon,
  UserIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import type { Permission } from "@/lib/rbac/permissions";

export type NavItem = {
  title: string;
  href: string;
  description?: string;
};

export type AppNavItem = NavItem & {
  icon: LucideIcon;
  /** Shown only to users with this permission. */
  permission?: Permission;
  /** Match only the exact path (for overview pages). */
  exact?: boolean;
};

/** Primary site navigation (header and mobile menu). */
export const mainNav: NavItem[] = [
  {
    title: "Explore Tools",
    href: "/tools",
    description: "Find tools that help you practice your faith.",
  },
  { title: "Ideas", href: "/ideas", description: "Discover and propose tools that should exist." },
  {
    title: "Help Build",
    href: "/help-build",
    description: "Volunteer your skills on open-source projects.",
  },
  {
    title: "Our Tools",
    href: "/our-tools",
    description: "Tools built and operated by ChristianTooling.",
  },
  { title: "About", href: "/about", description: "Our mission, values and approach." },
];

export const donateNavItem: NavItem = { title: "Donate", href: "/donate" };

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Platform",
    items: [
      { title: "Explore Tools", href: "/tools" },
      { title: "Ideas", href: "/ideas" },
      { title: "Help Build", href: "/help-build" },
      { title: "Our Tools", href: "/our-tools" },
    ],
  },
  {
    title: "Ministry",
    items: [
      { title: "About", href: "/about" },
      { title: "Donate", href: "/donate" },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Sign in", href: "/login" },
      { title: "Create account", href: "/register" },
      { title: "Dashboard", href: "/dashboard" },
    ],
  },
];

/** Signed-in member area. */
export const dashboardNav: AppNavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboardIcon, exact: true },
  { title: "Profile", href: "/dashboard/profile", icon: UserIcon },
  { title: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
];

/** Administration area. Items are filtered by the viewer's permissions. */
export const adminNav: AppNavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: BarChart3Icon,
    permission: "admin:access",
    exact: true,
  },
  { title: "Tools", href: "/admin/tools", icon: WrenchIcon, permission: "tools:manage" },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: ShapesIcon,
    permission: "categories:manage",
  },
  { title: "Ideas", href: "/admin/ideas", icon: LightbulbIcon, permission: "ideas:moderate" },
  {
    title: "Volunteers",
    href: "/admin/volunteers",
    icon: UsersIcon,
    permission: "volunteers:manage",
  },
  {
    title: "Projects",
    href: "/admin/projects",
    icon: FolderKanbanIcon,
    permission: "projects:manage",
  },
  {
    title: "Donations",
    href: "/admin/donations",
    icon: HandCoinsIcon,
    permission: "donations:view",
  },
  { title: "Users", href: "/admin/users", icon: UserCogIcon, permission: "users:view" },
  { title: "Content", href: "/admin/content", icon: NewspaperIcon, permission: "content:manage" },
  { title: "Settings", href: "/admin/settings", icon: SettingsIcon, permission: "settings:manage" },
];
