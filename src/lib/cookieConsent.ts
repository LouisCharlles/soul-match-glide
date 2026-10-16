// Escolha do usuario sobre cookies de terceiros. O frontend (vercel.app) e o
// backend (onrender.com) ficam em sites diferentes, entao o cookie de sessao
// so acompanha o refresh da pagina se for criado como cookie de terceiros
// (SameSite=None). Sem aceite, o backend mantem SameSite=Lax e a sessao dura
// so ate recarregar a pagina.
export type ThirdPartyCookieChoice = "accepted" | "declined";

const STORAGE_KEY = "bonding_third_party_cookies";

export function getThirdPartyCookieChoice(): ThirdPartyCookieChoice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return null;
  }
}

export function setThirdPartyCookieChoice(choice: ThirdPartyCookieChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Sem storage (aba anonima restrita): a escolha vale so para esta tela.
  }
}

export function hasAcceptedThirdPartyCookies() {
  return getThirdPartyCookieChoice() === "accepted";
}
