export interface UserProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  distance: string;
  bio: string;
  occupation: string;
  education: string;
  interests: string[];
  photos: string[];
  online: boolean;
}

export interface Match {
  id: string;
  user: UserProfile;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export const currentUser: UserProfile = {
  id: "current",
  name: "Lucas",
  age: 26,
  location: "São Paulo, SP",
  distance: "0 km",
  bio: "Apaixonado por tecnologia, viagens e bons cafés ☕",
  occupation: "Desenvolvedor Full Stack",
  education: "USP - Ciência da Computação",
  interests: ["Tecnologia", "Viagens", "Café", "Música", "Fotografia", "Corrida"],
  photos: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop",
  ],
  online: true,
};

export const profiles: UserProfile[] = [
  {
    id: "1",
    name: "Mariana",
    age: 24,
    location: "São Paulo, SP",
    distance: "3 km",
    bio: "Artista digital e amante de café. Sempre em busca de novas aventuras 🎨✨",
    occupation: "Designer UX/UI",
    education: "UNICAMP - Design",
    interests: ["Arte", "Café", "Yoga", "Fotografia", "Viagens"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
    ],
    online: true,
  },
  {
    id: "2",
    name: "Juliana",
    age: 27,
    location: "Rio de Janeiro, RJ",
    distance: "5 km",
    bio: "Médica, apaixonada por praia e sushi 🏖️🍣",
    occupation: "Médica Pediatra",
    education: "UFRJ - Medicina",
    interests: ["Praia", "Sushi", "Corrida", "Séries", "Animais"],
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop",
    ],
    online: false,
  },
  {
    id: "3",
    name: "Carolina",
    age: 25,
    location: "Belo Horizonte, MG",
    distance: "8 km",
    bio: "Engenheira de dia, musicista de noite 🎸",
    occupation: "Engenheira Civil",
    education: "UFMG - Engenharia",
    interests: ["Música", "Rock", "Trilhas", "Gastronomia", "Livros"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop",
    ],
    online: true,
  },
  {
    id: "4",
    name: "Beatriz",
    age: 23,
    location: "Curitiba, PR",
    distance: "2 km",
    bio: "Fotógrafa profissional 📸 Viciada em viagens e chocolate",
    occupation: "Fotógrafa",
    education: "PUC-PR - Comunicação",
    interests: ["Fotografia", "Viagens", "Chocolate", "Cinema", "Dança"],
    photos: [
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1464863979621-258859e62245?w=400&h=500&fit=crop",
    ],
    online: true,
  },
  {
    id: "5",
    name: "Amanda",
    age: 26,
    location: "Florianópolis, SC",
    distance: "12 km",
    bio: "Advogada fitness lover 💪 Amo praia e bons papos",
    occupation: "Advogada",
    education: "UFSC - Direito",
    interests: ["Fitness", "Praia", "Direito", "Vinhos", "Pets"],
    photos: [
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop",
    ],
    online: false,
  },
  {
    id: "6",
    name: "Isabela",
    age: 28,
    location: "Porto Alegre, RS",
    distance: "6 km",
    bio: "Chef de cozinha apaixonada por gastronomia 🍳",
    occupation: "Chef de Cozinha",
    education: "Le Cordon Bleu",
    interests: ["Gastronomia", "Vinhos", "Jazz", "Viagens", "Leitura"],
    photos: [
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=400&h=500&fit=crop",
    ],
    online: true,
  },
];

export const matches: Match[] = [
  {
    id: "m1",
    user: profiles[0],
    lastMessage: "Adorei sua foto de viagem! 😍",
    timestamp: "2min",
    unread: true,
  },
  {
    id: "m2",
    user: profiles[2],
    lastMessage: "Vamos tomar um café?",
    timestamp: "1h",
    unread: false,
  },
];

export const chatMessages: Record<string, Message[]> = {
  m1: [
    { id: "msg1", senderId: "1", text: "Oi! Tudo bem? 😊", timestamp: "10:30" },
    { id: "msg2", senderId: "current", text: "Oi Mariana! Tudo ótimo, e você?", timestamp: "10:32" },
    { id: "msg3", senderId: "1", text: "Muito bem! Vi que você gosta de café também ☕", timestamp: "10:33" },
    { id: "msg4", senderId: "current", text: "Sim! Sou viciado haha. Conhece algum lugar bom?", timestamp: "10:35" },
    { id: "msg5", senderId: "1", text: "Adorei sua foto de viagem! 😍", timestamp: "10:36" },
  ],
  m2: [
    { id: "msg6", senderId: "3", text: "Ei! Vi que você curte rock também 🎸", timestamp: "09:15" },
    { id: "msg7", senderId: "current", text: "Com certeza! Qual sua banda favorita?", timestamp: "09:20" },
    { id: "msg8", senderId: "3", text: "Foo Fighters! E a sua?", timestamp: "09:22" },
    { id: "msg9", senderId: "current", text: "Boa escolha! Curto demais Arctic Monkeys", timestamp: "09:25" },
    { id: "msg10", senderId: "3", text: "Vamos tomar um café?", timestamp: "09:30" },
  ],
};
