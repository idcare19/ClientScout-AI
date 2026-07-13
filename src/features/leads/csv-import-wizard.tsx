"use client";

import * as React from "react";
import Papa from "papaparse";
import { Download, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { leadCsvHeaders, createLeadSampleCsv } from "@/lib/csv/leads";
import { cn } from "@/lib/utils";

const targetFields = ["", ...leadCsvHeaders] as const;

type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

export function CSVImportWizard() {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [parsed, setParsed] = React.useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [preview, setPreview] = React.useState<Array<{ rowIndex: number; status: string; duplicateCount?: number; error?: string }>>([]);
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [loading, setLoading] = React.useState(false);

  const onFileChange = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    if (result.errors.length > 0) {
      toast.error("CSV parsing failed");
      return;
    }
    const headers = result.meta.fields ?? [];
    const rows = result.data.slice(0, 100);
    setParsed({ headers, rows });
    const defaultMapping = headers.reduce<Record<string, string>>((acc, header) => {
      acc[header] = header;
      return acc;
    }, {});
    setMapping(defaultMapping);
    setPreview([]);
    setSelectedRows(new Set());
  };

  const runPreview = async () => {
    if (!parsed) return;
    setLoading(true);
    try {
      const mappedRows = parsed.rows.map((row) =>
        Object.entries(mapping).reduce<Record<string, string>>((acc, [source, target]) => {
          if (!target) return acc;
          acc[target] = row[source] ?? "";
          return acc;
        }, {}),
      );
      const response = await fetch("/api/leads/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mappedRows }),
      });
      if (!response.ok) throw new Error("Preview failed");
      const payload = (await response.json()) as { preview: Array<{ rowIndex: number; status: string; duplicateCount?: number; error?: string }> };
      setPreview(payload.preview);
      setSelectedRows(
        new Set(
          payload.preview
            .filter((row) => row.status === "ready")
            .map((row) => row.rowIndex),
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const importRows = async () => {
    if (!parsed) return;
    const selected = parsed.rows
      .map((row, index) => ({ row, index }))
      .filter(({ index }) => selectedRows.has(index))
      .map(({ row }) =>
        Object.entries(mapping).reduce<Record<string, string>>((acc, [source, target]) => {
          if (!target) return acc;
          acc[target] = row[source] ?? "";
          return acc;
        }, {}),
      );

    setLoading(true);
    try {
      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: selected }),
      });
      if (!response.ok) throw new Error("Import failed");
      const payload = (await response.json()) as { imported: Array<{ status: string; error?: string }> };
      const imported = payload.imported.filter((item) => item.status === "imported" || item.status === "imported_with_warning").length;
      const warned = payload.imported.filter((item) => item.status === "imported_with_warning").length;
      toast.success(
        warned > 0
          ? `Imported ${imported} lead${imported === 1 ? "" : "s"} with ${warned} duplicate warning${warned === 1 ? "" : "s"}`
          : `Imported ${imported} lead${imported === 1 ? "" : "s"}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const sampleCsv = createLeadSampleCsv();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              <UploadCloud className="h-4 w-4" />
              Choose CSV
              <Input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} />
            </label>
            <Button asChild variant="outline">
              <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsv)}`} download="clientscout-sample.csv">
                <Download className="h-4 w-4" />
                Sample CSV
              </a>
            </Button>
            {fileName ? <p className="text-sm text-slate-500">{fileName}</p> : null}
          </div>
        </CardContent>
      </Card>

      {parsed ? (
        <Card>
          <CardHeader>
            <CardTitle>Column mapping</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    {parsed.headers.slice(0, 4).map((header) => (
                      <th key={header} className="px-3 py-2">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 3).map((row, index) => (
                    <tr key={index} className="border-t border-slate-200">
                      {parsed.headers.slice(0, 4).map((header) => (
                        <td key={header} className="px-3 py-2 text-slate-700">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsed.headers.map((header) => (
              <div key={header} className="grid gap-2 md:grid-cols-[1fr_1fr] md:items-center">
                <p className="text-sm font-medium text-slate-900">{header}</p>
                <select
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={mapping[header] ?? ""}
                  onChange={(event) => setMapping((current) => ({ ...current, [header]: event.target.value }))}
                >
                  {targetFields.map((field) => (
                    <option key={field || "skip"} value={field}>
                      {field || "Skip column"}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <Button onClick={runPreview} disabled={loading} className="w-fit">
              Preview rows
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {preview.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview and validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.map((row) => (
              <label
                key={row.rowIndex}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3",
                  row.status === "ready" ? "border-emerald-200 bg-emerald-50" : row.status === "possible_duplicate" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50",
                )}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Row {row.rowIndex + 1} - {row.status.replaceAll("_", " ")}
                  </p>
                  {row.duplicateCount ? <p className="text-xs text-slate-500">{row.duplicateCount} possible duplicate(s)</p> : null}
                  {row.error ? <p className="text-xs text-rose-700">{row.error}</p> : null}
                </div>
                <input
                  type="checkbox"
                  checked={selectedRows.has(row.rowIndex)}
                  disabled={row.status !== "ready" && row.status !== "possible_duplicate"}
                  onChange={(event) => {
                    const next = new Set(selectedRows);
                    if (event.target.checked) next.add(row.rowIndex);
                    else next.delete(row.rowIndex);
                    setSelectedRows(next);
                  }}
                />
              </label>
            ))}

            <Button onClick={importRows} disabled={loading || selectedRows.size === 0} className="w-fit">
              Import selected rows
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
