export type SupportedLanguage = "pt-BR" | "en-US";

const copy = {
  "pt-BR": {
    brandTagline: "Encontre sua conexão",
    loginTitle: "Entrar",
    signupTitle: "Crie sua conta",
    logout: "Sair",
    navDiscover: "Descobrir",
    navMessages: "Mensagens",
    navLikes: "Likes",
    navProfile: "Perfil",
    navSettings: "Configurações",
    navIntentions: "Intenções",
    premium: "Premium",
    wallet: "Laços",
    verificationTitle: "Confirmação de e-mail",
    verificationDescription: "Enviamos um e-mail para confirmar que foi você quem criou a conta.",
  },
  "en-US": {
    brandTagline: "Find your connection",
    loginTitle: "Sign in",
    signupTitle: "Create your account",
    logout: "Sign out",
    navDiscover: "Discover",
    navMessages: "Messages",
    navLikes: "Likes",
    navProfile: "Profile",
    navSettings: "Settings",
    navIntentions: "Intentions",
    premium: "Premium",
    wallet: "Ribbons",
    verificationTitle: "Email verification",
    verificationDescription: "We sent you an email to confirm you created the account.",
  },
} as const;

export function getCopy(language: SupportedLanguage) {
  return copy[language];
}
