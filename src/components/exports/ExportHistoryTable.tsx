import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useExportHistory } from "@/hooks/useExports";
import { Skeleton } from "@/components/ui/skeleton";

const FORMAT_LABELS: Record<string, { label: string; color: string }> = {
  tv: { label: "TV FullHD", color: "bg-primary text-primary-foreground" },
  pdf: { label: "PDF / Tlač", color: "bg-accent text-accent-foreground" },
  excel: { label: "Excel", color: "bg-success text-primary-foreground" },
  webflow: { label: "Web embed", color: "bg-secondary text-secondary-foreground" },
};

export function ExportHistoryTable() {
  const { data: exports, isLoading } = useExportHistory();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!exports?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Zatiaľ žiadne exporty.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dátum menu</TableHead>
          <TableHead>Formát</TableHead>
          <TableHead>Šablóna</TableHead>
          <TableHead>Exportované</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exports.map((exp: any) => {
          const fmt = FORMAT_LABELS[exp.format] ?? { label: exp.format, color: "" };
          return (
            <TableRow key={exp.id}>
              <TableCell className="font-medium">
                {exp.menu?.menu_date
                  ? format(new Date(exp.menu.menu_date + "T00:00:00"), "EEEE d.M.yyyy", { locale: sk })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={fmt.color}>
                  {fmt.label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {exp.template_name || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {format(new Date(exp.created_at), "d.M.yyyy HH:mm")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
