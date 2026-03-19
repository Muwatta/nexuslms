import { Users, BookOpen, Award, Globe } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const stats: Stat[] = [
  {
    label: "Students",
    value: "100+",
    icon: Users,
  },
  {
    label: "Courses",
    value: "10+",
    icon: BookOpen,
  },
  {
    label: "Certified Teachers",
    value: "25+",
    icon: Award,
  },
  {
    label: "Countries",
    value: "2+",
    icon: Globe,
  },
];
