/**
 * Single source of truth for site navigation.
 * Agents: add/remove/reorder links here — every navbar/sidebar/footer reads this file.
 *
 * Resources stays in code (`/resources`) but is hidden from public nav for now.
 */
import {
  Home,
  CalendarDays,
  FolderKanban,
  Users,
  Mail,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Links shown in the left sidebar (inner pages). Resources intentionally omitted. Auth is UserMenu. */
export const sidebarLinks: NavLink[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Team", href: "/team", icon: Users },
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
    { label: "Contact Us", href: "/contact" },
  ],
  connect: [
    { label: "Contact Us", href: "/contact" },
    { label: "Member Login", href: "/admin" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};
