import { useAppExperience } from "@/contexts/AppExperienceContext";

export function useCurrency() {
  return useAppExperience();
}
