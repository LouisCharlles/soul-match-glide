const ERROR_MAP: [string, string][] = [
  ["Ambiente muito escuro", "Tente em um ambiente com mais iluminação."],
  ["desfocada demais", "A foto está desfocada. Mantenha o celular firme e tente novamente."],
  ["Nenhum rosto detectado", "Nenhum rosto detectado. Olhe diretamente para a câmera."],
  ["Remova acessórios", "Remova óculos, bonés ou máscaras e tente novamente."],
  ["semelhança suficiente", "O rosto não corresponde às fotos do perfil. Use uma foto mais recente no perfil."],
  ["pelo menos duas fotos", "Adicione pelo menos 2 fotos ao perfil antes de verificar."],
  ["arquivo de imagem ausente", "Nenhuma imagem foi enviada. Tente capturar novamente."],
  ["Nenhum rosto detectado na selfie", "Nenhum rosto detectado na selfie. Olhe diretamente para a câmera."],
];

export function getFriendlyVerificationError(rawError: string): string {
  const lower = rawError.toLowerCase();
  for (const [key, friendly] of ERROR_MAP) {
    if (lower.includes(key.toLowerCase())) return friendly;
  }
  return "A verificação falhou. Tente uma foto em ambiente mais claro e com rosto visível.";
}
