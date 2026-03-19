export interface Program {
  id: string;
  title: string;
  description: string;
  features: string[];
  color: string;
  image: string;
}

export const programs: Program[] = [
  {
    id: "western",
    title: "Western School",
    description:
      "High quality Western education with modern teaching methods and international curriculum.",
    image: "🎓",
    color: "from-blue-500 to-indigo-600",
    features: [
      "English Language Mastery",
      "Mathematics & Sciences",
      "Digital Learning Tools",
      "Interactive Classrooms",
    ],
  },

  {
    id: "arabic",
    title: "المدرسة العربيّة",
    description:
      "تعليم عربي وإسلامي أصيل، تحت إشراف علماء ناطقين مؤهلين، مع منهجية تعليمية منظمة تضمن الفهم العميق والممارسة العملية للمعارف",
    image: "🕌",
    color: "from-emerald-500 to-teal-600",
    features: [
      "Arabic Reading & Writing",
      "Qur'an & Tajweed",
      "Islamic Studies",
      "Classical Text Learning",
    ],
  },
  
  {
    id: "tech",
    title: "Tech Academy",
    description:
      "Future ready technology training including programming, AI, and digital skills.",
    image: "💻",
    color: "from-violet-500 to-purple-600",
    features: [
      "Web Development",
      "AI & Machine Learning",
      "Programming Fundamentals",
      "Project Based Learning",
    ],
  },
];
