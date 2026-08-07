import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CalendarDays, DoorOpen, LayoutGrid, Settings } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Rooms", href: "/rooms", icon: DoorOpen },
  { label: "Bookings", href: "/bookings", icon: CalendarDays },
  { label: "Emergency requests", href: "/emergency", icon: AlertTriangle },
  { label: "Settings", href: "/settings", icon: Settings },
];
