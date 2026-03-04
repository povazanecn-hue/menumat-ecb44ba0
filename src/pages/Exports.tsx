import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublishedMenus } from "@/hooks/useExports";
import { ExportActions } from "@/components/exports/ExportActions";
import { ExportHistoryTable } from "@/components/exports/ExportHistoryTable";
import { MenuPreview } from "@/components/exports/MenuPreview";
import { ExportValidationBanner } from "@/components/exports/ExportValidationBanner";
import { useTemplateSettings } from "@/hooks/useTemplates";
import { OliviaContextTip } from "@/components/OliviaContextTip";

export default function Exports() {
  const { data: menus, isLoading } = usePublishedMenus();
  const { data: templateSettings } = useTemplateSettings();
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [activeTemplate, setActiveTemplate] = useState<string>("");
  const [showFinancials, setShowFinancials] = useState(false);

  const selectedMenu = menus?.find((m: any) => m.id === selectedMenuId) ?? null;

  return (
    <div className="space-y-6">
      {/* Olivia export tips */}
      <OliviaContextTip
        id="export-first-visit"
        text="**Vyberte menu** a exportujte ho ako **TV obraz** (1920×1080), **PDF** na tlač, **Excel** pre kuchyňu alebo **web embed** pre Webflow."
        icon="bot"
        condition={!isLoading && !selectedMenuId}
      />
      <OliviaContextTip
        id="export-template-tip"
        text="**Tip:** V sekcii Šablóny môžete nastaviť primárnu šablónu (rustikálna, minimalistická, moderná), ktorá sa automaticky použije pri exportoch."
        condition={!!selectedMenuId && !activeTemplate}
        delay={3000}
      />

      <div>
        <h1 className="font-serif text-2xl font-bold">Export centrum</h1>
        <p className="text-muted-foreground text-sm">
          Exportujte denné menu pre TV, tlač, kuchyňu alebo web.
        </p>
      </div>

      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="history">História exportov</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4 mt-4">
          {/* Menu selector */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Vybrať menu</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Načítavam…" : "Vyberte menu na export"} />
                </SelectTrigger>
                <SelectContent>
                  {(menus ?? []).map((m: any) => {
                    const d = new Date(m.menu_date + "T00:00:00");
                    const label = d.toLocaleDateString("sk-SK", {
                      weekday: "short",
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                    });
                    const itemCount = m.menu_items?.length ?? 0;
                    return (
                      <SelectItem key={m.id} value={m.id}>
                        {label} — {itemCount} jedál ({m.status === "published" ? "pub." : "koncept"})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedMenu && <ExportValidationBanner menu={selectedMenu} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MenuPreview menu={selectedMenu} templateStyle={activeTemplate || templateSettings?.primary_template || "country"} showFinancials={showFinancials} fonts={templateSettings?.fonts} />
            <ExportActions menu={selectedMenu} onTemplateChange={setActiveTemplate} onShowFinancialsChange={setShowFinancials} />
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">História exportov</CardTitle>
            </CardHeader>
            <CardContent>
              <ExportHistoryTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
