/**
 * Single source of truth for site navigation.
 * Agents: add/remove/reorder links here — every navbar/sidebar/footer reads this file.
 */
import {
  Home,
  CalendarDays,
  FolderKanban,
  Users,
  BookOpen,
  Mail,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Links shown in the left sidebar (inner pages). */
export const sidebarLinks: NavLink[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Team", href: "/team", icon: Users },
  { label: "Resources", href: "/resources", icon: BookOpen },
  { label: "Contact", href: "/contact", icon: Mail },
];

/** Links shown in the landing-page top navbar (no Home — logo does that). */
export const topNavLinks = sidebarLinks.filter((l) => l.href !== "/");

/** Footer columns. */
export const footerNav = {
  navigate: [
    { label: "Events", href: "/events" },
    { label: "Projects", href: "/projects" },
    { label: "Team", href: "/team" },
    { label: "Resources", href: "/resources" },
  ],
  connect: [
    { label: "Contact Us", href: "/contact" },
    { label: "Join Us", href: "/contact" },
    { label: "Newsletter", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};
