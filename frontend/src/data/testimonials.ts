export interface Testimonial {
  name: string;
  program: string;
  rating: number;
  content: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Abdullahi Odofin",
    program: "Arabic School",
    rating: 5,
    content:
      "The teachers are excellent and the Arabic lessons are very clear and structured.",
  },
  {
    name: "Aisha Bello",
    program: "Western School",
    rating: 4,
    content:
      "My children improved their English and mathematics skills significantly.",
  },
  {
    name: "Muhammad Nurudeen",
    program: "Tech Academy",
    rating: 5,
    content:
      "The programming classes helped me build my first real web application.",
  },
];
