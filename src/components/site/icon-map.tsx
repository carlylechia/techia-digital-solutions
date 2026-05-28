import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  LayoutTemplate,
  Orbit,
  PanelTopOpen,
  Plane,
  BrainCircuit,
  Rocket,
  Settings2,
  ShoppingBag,
  Sparkles,
  Store,
  Workflow
} from "lucide-react";

export const iconMap = {
  "bar-chart-3": BarChart3,
  "book-open-text": BookOpenText,
  "briefcase-business": BriefcaseBusiness,
  "building-2": Building2,
  "layout-template": LayoutTemplate,
  orbit: Orbit,
  "panel-top-open": PanelTopOpen,
  plane: Plane,
  "brain-circuit": BrainCircuit,
  rocket: Rocket,
  "settings-2": Settings2,
  "shopping-bag": ShoppingBag,
  sparkles: Sparkles,
  store: Store,
  workflow: Workflow
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof iconMap;
