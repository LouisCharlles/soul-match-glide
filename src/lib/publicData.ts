export interface BrazilianState {
  id: number;
  sigla: string;
  nome: string;
}

export interface StaticOption {
  value: string;
  label: string;
}

interface IbgeCity {
  id: number;
  nome: string;
}

const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export const GENDER_OPTIONS: StaticOption[] = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
  { value: "non_binary", label: "Não-binário" },
  { value: "fluid", label: "Gênero fluido" },
  { value: "other", label: "Outro" },
];

export const SEXUAL_ORIENTATION_OPTIONS: StaticOption[] = [
  { value: "straight", label: "Heterossexual" },
  { value: "gay", label: "Homossexual" },
  { value: "bisexual", label: "Bissexual" },
  { value: "asexual", label: "Assexual" },
  { value: "pansexual", label: "Pansexual" },
  { value: "other", label: "Outro" },
];

export const EDUCATION_OPTIONS = [
  "Ensino Fundamental",
  "Ensino Médio",
  "Ensino Técnico",
  "Tecnólogo",
  "Graduação",
  "Pós-graduação",
  "MBA",
  "Mestrado",
  "Doutorado",
  "Pós-doutorado",
];

export const OCCUPATION_OPTIONS = [
  "Administrador",
  "Advogado",
  "Analista de Dados",
  "Analista de Marketing",
  "Arquiteto",
  "Assistente Administrativo",
  "Biomédico",
  "Contador",
  "Coordenador de Projetos",
  "Designer Gráfico",
  "Designer UX/UI",
  "Desenvolvedor Back-end",
  "Desenvolvedor Front-end",
  "Desenvolvedor Full Stack",
  "Enfermeiro",
  "Engenheiro Civil",
  "Engenheiro de Produção",
  "Engenheiro de Software",
  "Fisioterapeuta",
  "Fotógrafo",
  "Jornalista",
  "Médico",
  "Nutricionista",
  "Personal Trainer",
  "Product Manager",
  "Professor",
  "Psicólogo",
  "Publicitário",
  "Recepcionista",
  "Vendedor",
];

export const COURSE_OPTIONS = [
  "Administração",
  "Análise e Desenvolvimento de Sistemas",
  "Arquitetura e Urbanismo",
  "Biomedicina",
  "Ciência da Computação",
  "Ciências Contábeis",
  "Comunicação Social",
  "Design",
  "Design Gráfico",
  "Direito",
  "Educação Física",
  "Enfermagem",
  "Engenharia Civil",
  "Engenharia de Produção",
  "Engenharia de Software",
  "Fisioterapia",
  "Gastronomia",
  "Jornalismo",
  "Marketing",
  "Medicina",
  "Nutrição",
  "Pedagogia",
  "Psicologia",
  "Publicidade e Propaganda",
  "Relações Internacionais",
  "Sistemas de Informação",
];

export async function fetchBrazilianStates() {
  const response = await fetch(`${IBGE_BASE_URL}/estados`);
  if (!response.ok) {
    throw new Error("Não foi possível carregar os estados.");
  }

  const states = await response.json() as BrazilianState[];
  return states.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function fetchCitiesByState(stateCode: string) {
  if (!stateCode.trim()) {
    return [];
  }

  const response = await fetch(`${IBGE_BASE_URL}/estados/${stateCode}/municipios`);
  if (!response.ok) {
    throw new Error("Não foi possível carregar as cidades.");
  }

  const cities = await response.json() as IbgeCity[];
  return cities.map((city) => city.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
}
