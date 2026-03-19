import {
  Bot,
  BarChart3,
  GraduationCap,
  Clock,
  Globe,
  Code2,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const features: Feature[] = [
  {
    title: "AI Powered Learning",
    description:
      "Personalized learning experience powered by artificial intelligence.",
    icon: Bot,
    color: "bg-blue-500",
  },
  {
    title: "Progress Tracking",
    description:
      "Monitor your academic growth with real time analytics and reports.",
    icon: BarChart3,
    color: "bg-indigo-500",
  },
  {
    title: "Expert Teachers",
    description:
      "Learn from highly qualified teachers with years of experience.",
    icon: GraduationCap,
    color: "bg-emerald-500",
  },
  {
    title: "Flexible Schedule",
    description:
      "Study anytime with live classes and self paced learning options.",
    icon: Clock,
    color: "bg-orange-500",
  },
  {
    title: "Global Community",
    description: "Join students from different countries learning together.",
    icon: Globe,
    color: "bg-teal-500",
  },
  {
    title: "Tech Skills",
    description: "Learn practical programming and modern technology skills.",
    icon: Code2,
    color: "bg-violet-500",
  },
];
