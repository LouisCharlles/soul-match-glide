import { useAppExperience } from "@/contexts/AppExperienceContext";

const INTENTION_OPTIONS = [
  { value: "serious", label: "Relacionamento sério", description: "Pessoas buscando algo mais profundo e consistente." },
  { value: "casual", label: "Casual", description: "Conexões leves, encontros sem tanta formalidade." },
  { value: "friendship", label: "Amizade", description: "Pessoas abertas a companhia, amizade e conexão social." },
  { value: "exploring", label: "Descobrindo", description: "Quem ainda está entendendo o que procura no app." },
] as const;

const Intentions = () => {
  const { discoveryFilters, setDiscoveryIntentions } = useAppExperience();

  const toggleIntention = (value: typeof INTENTION_OPTIONS[number]["value"]) => {
    const isSelected = discoveryFilters.intentions.includes(value);
    if (isSelected) {
      setDiscoveryIntentions(discoveryFilters.intentions.filter((item) => item !== value));
      return;
    }
    setDiscoveryIntentions([...discoveryFilters.intentions, value]);
  };

  return (
    <section className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-3xl text-foreground">Intenções</h1>
        <p className="mt-2 text-sm text-muted-foreground font-body">
          Escolha quais intenções você quer navegar no discover. O filtro é aplicado junto com idade e gênero.
        </p>
      </div>

      <div className="grid gap-4">
        {INTENTION_OPTIONS.map((option) => {
          const selected = discoveryFilters.intentions.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleIntention(option.value)}
              className={`card-surface p-5 text-left transition-colors ${
                selected ? "border-primary bg-primary/10" : "hover:bg-accent/40"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-heading text-lg text-foreground">{option.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-body-bold ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "border border-white/10 text-foreground"
                  }`}
                >
                  {selected ? "Selecionado" : "Selecionar"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default Intentions;
