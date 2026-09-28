import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ConsentCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ConsentCheckbox = ({ checked, onCheckedChange, disabled }: ConsentCheckboxProps) => (
  <div className="flex items-start gap-2">
    <Checkbox
      id="accept-legal-documents"
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      className="mt-0.5"
    />
    <Label
      htmlFor="accept-legal-documents"
      className="text-xs font-body leading-relaxed text-muted-foreground"
    >
      Li e concordo com o{" "}
      <Link to="/tcle" target="_blank" className="text-primary underline">
        Termo de Consentimento Livre e Esclarecido (TCLE)
      </Link>
      , com os{" "}
      <Link to="/terms" target="_blank" className="text-primary underline">
        Termos de Uso
      </Link>{" "}
      e com a{" "}
      <Link to="/privacy" target="_blank" className="text-primary underline">
        Política de Privacidade
      </Link>
      , incluindo minha participação voluntária nesta pesquisa acadêmica e o tratamento dos meus
      dados pessoais conforme descrito nesses documentos.
    </Label>
  </div>
);

export default ConsentCheckbox;
