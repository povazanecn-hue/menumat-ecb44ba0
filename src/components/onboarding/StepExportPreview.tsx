import { Monitor, Printer, FileSpreadsheet, Globe } from "lucide-react";

const exports = [
  { icon: Monitor, title: "TV zobrazenie", desc: "FullHD 1920×1080 pre obrazovky v reštaurácii" },
  { icon: Printer, title: "PDF / Tlač", desc: "Profesionálny formát na vytlačenie" },
  { icon: FileSpreadsheet, title: "Excel pre kuchyňu", desc: "Pracovný list pre prípravu jedál" },
  { icon: Globe, title: "Web embed", desc: "Publikovanie na web s automatickou aktualizáciou" },
];

export function StepExportPreview() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1 mb-2">
        <h2 className="font-serif text-xl font-bold text-foreground">Exporty a publikovanie</h2>
        <p className="text-sm text-muted-foreground">
          Vaše menu môžete exportovať do rôznych formátov
        </p>
      </div>
      <div className="grid gap-2">
        {exports.map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-lg bg-secondary/50 border border-border p-3">
            <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
