import {
  airbnb,
  binance,
  coinbase,
  dropbox,
  facebook,
  instagram,
  linkedin,
  send,
  shield,
  star,
  twitter,
} from "../assets";
// import { Linkedin, Youtube, Send } from 'lucide-react';

export const navigationLinks = [
  {
    id: "home",
    title: "Bosh sahifa",
  },
  {
    id: "learn",
    title: "Talim",
  },
  {
    id: "skills",
    title: "Ko'nikmalar",
  },
  {
    id: "portfolio",
    title: "Loyihalar",
  },
  {
    id: "features",
    title: "Aloqa",
  },
];

export const statistics = [
  {
    id: 1,
    title: "Ishlagan Loyihalarim",
    value: "3",
  },
  {
    id: 2,
    title: "Kompaniyalar",
    value: "1",
  },
  {
    id: 3,
    title: "Tajribam",
    value: "1+",
  },
];

export const features = [
  {
    id: 1,
    icon: "Linkedin",
    title: "Linkedin",
    url: "https://www.linkedin.com/in/qudrat-razzoqov-8abb9b39b/?locale=ru_RU",
    context: "",
  },
  {
    id: 2,
    icon: "Youtube",
    title: "Youtube",
    url: "https://www.youtube.com/results?search_query=somad+mebel",
    context: "",
  },
  {
    id: 3,
    icon: "Send",
    title: "Telegram",
    url: "https://t.me/Malenkiy_master",
    context: "",
  },
  {
    id: 4,
    icon: "Github",
    title: "GitHub",
    url: "",
    context: "",
  },
  {
    id: 5,
    icon: "Mail",
    title: "Email",
    url: "",
    context: "",
  },
  {
    id: 6,
    icon: "Phone",
    title: "Telefon",
    url: "+99888 790 06 77",
    context: "+99888 790 06 77",
  },
];

export const feedbacks = [
  {
    id: 1,
    image: "https://i.postimg.cc/50R1zqCm/photo-2026-02-25-22-20-26.jpg",
    content:
      "Money is only a tool. It will take you wherever you wish, but it will nit replace you as the driver",
    name: "Herman",
    title: "FullStack",
  },
  {
    id: 2,
    image: "https://i.postimg.cc/8z0CfC8N/najot-talim-logo.webp",
    content:
      "Money makes your life easier. If you're lucky to have it, you're lucky.",
    name: "Steve Mark",
    title: "Backend",
  },
  {
    id: 3,
    image: "https://i.postimg.cc/bJ3X0NcJ/Снимок_экрана_2025_10_15_210352.png",
    content:
      "It is usually people in the money bussiness. finance, and international trade that are really rich.",
    name: "Kenn Gallagher",
    title: "Backend",
  },
];

export const clients = [
  {
    id: 1,
    logo: airbnb,
  },
  {
    id: 2,
    logo: binance,
  },
  {
    id: 3,
    logo: coinbase,
  },
  {
    id: 4,
    logo: dropbox,
  },
];

export const footerLinks = [
  {
    title: "Jamiyat",
    links: [
      {
        name: "Yordam Markazi",
        link: "https://www.hoobank.com/help-center/",
      },
      {
        name: "Hamkorlar",
        link: "https://www.hoobank.com/partners/",
      },
      {
        name: "Blog",
        link: "https://www.sammi.ac/blog/",
      },
      {
        name: "Takliflar",
        link: "https://www.hoobank.com/suggestions/",
      },
      {
        name: "Yangiliklar",
        link: "https://www.hoobank.com/newsletters/",
      },
    ],
  },
  {
    title: "Foydali Havolalar",
    links: [
      {
        name: "kontent",
        link: "https://www.sammi.ac/content/",
      },
      {
        name: "Qanday Ishlaydi",
        link: "https://www.sammi.ac/partners/",
      },
      {
        name: "Shartlar & Xizmatlar",
        link: "https://www.sammi.ac/suggestions/",
      },
    ],
  },
  {
    title: "Hamkor",
    links: [
      {
        name: "Bizning hamkorimiz",
        link: "https://www.sammi.ac/our-partner/",
      },
      {
        name: "Hamkor bo'ling",
        link: "https://www.sammi.ac/become-a-partner/",
      },
    ],
  },
];

export const socialMedia = [
  {
    id: "social-media-1",
    icon: instagram,
    link: `https://www.instagram.com`,
  },
  {
    id: "social-media-2",
    icon: facebook,
    link: `https://www.facebook.com`,
  },
  {
    id: "social-media-3",
    icon: twitter,
    link: `https://www.twitter.com`,
  },
  {
    id: "social-media-4",
    icon: linkedin,
    link: `https://www.linkedin.com`,
  },
];

export const skills = [
  {
    id: 1,
    title: "Languages",
    items: ["JavaScript", "TypeScript"],
    icon: "Code2",
  },
  {
    id: 2,
    title: "Backend",
    items: ["Node.js", "Express.js", "NestJS"],
    icon: "Server",
  },
  {
    id: 3,
    title: "Databases",
    items: ["MongoDB (NoSQL)", "PostgreSQL (SQL)"],
    icon: "Database",
  },
  {
    id: 4,
    title: "Tools",
    items: ["Git", "GitHub", "REST API", "JWT"],
    icon: "Cpu",
  },
];
