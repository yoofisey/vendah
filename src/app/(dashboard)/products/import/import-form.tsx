"use client";

import { useCallback, useRef, useState, useActionState } from "react";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { importProducts } from "./actions";

type ParsedRow = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
};

function parseCsvPreview(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const cells = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += c;
        }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += c;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const header = cells(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.indexOf("name");
  const descIdx = header.indexOf("description");
  const priceIdx = header.indexOf("price");
  const stockIdx = header.indexOf("stock");
  const categoryIdx = header.indexOf("category");

  if (nameIdx === -1 || priceIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const c = cells(line);
    return {
      name: c[nameIdx] ?? "",
      description: descIdx >= 0 ? (c[descIdx] ?? "") : "",
      price: c[priceIdx] ?? "",
      stock: stockIdx >= 0 ? (c[stockIdx] ?? "0") : "0",
      category: categoryIdx >= 0 ? (c[categoryIdx] ?? "") : "",
    };
  });
}

type ImportState = {
  success?: boolean;
  imported?: number;
  errors?: { row: number; message: string }[];
  error?: string;
};

export function ImportForm() {
  const [state, action, pending] = useActionState(
    async (_prev: ImportState, formData: FormData): Promise<ImportState> => {
      return importProducts(formData);
    },
    {}
  );

  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<File | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    setFileData(text);
    setPreview(parseCsvPreview(text));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        fileRef.current = file;
        handleFile(file);
      }
    },
    [handleFile]
  );

  if (state.success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 className="mt-3 font-heading text-xl font-semibold text-charcoal">
          Import complete
        </h2>
        <p className="mt-2 text-sm text-muted">
          {state.imported} product{state.imported === 1 ? "" : "s"} imported as
          drafts.
        </p>
        {state.errors && state.errors.length > 0 && (
          <div className="mt-4 text-left">
            <p className="text-sm font-medium text-amber-700">
              {state.errors.length} row{state.errors.length === 1 ? "" : "s"}{" "}
              skipped:
            </p>
            <ul className="mt-1 space-y-1 text-xs text-amber-600">
              {state.errors.map((e) => (
                <li key={e.row}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="file" value={fileData ?? ""} />

      {preview.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition duration-150 ${
            dragOver
              ? "border-pine bg-pine/5"
              : "border-charcoal/20 hover:border-gold"
          }`}
        >
          <ArrowUpTrayIcon className="h-10 w-10 text-muted" />
          <p className="mt-3 text-sm font-medium text-charcoal">
            Drop your CSV file here
          </p>
          <p className="mt-1 text-xs text-muted">or click to browse</p>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                fileRef.current = file;
                handleFile(file);
              }
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-lg bg-cream px-4 py-3">
            <p className="text-sm font-medium text-charcoal">{fileName}</p>
            <button
              type="button"
              onClick={() => {
                setPreview([]);
                setFileName(null);
                setFileData(null);
                fileRef.current = null;
              }}
              className="text-xs text-muted hover:text-red-600"
            >
              Remove
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/70 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 bg-cream/50">
                  <th className="px-4 py-2.5 font-medium text-charcoal-soft">
                    Name
                  </th>
                  <th className="px-4 py-2.5 font-medium text-charcoal-soft">
                    Price
                  </th>
                  <th className="px-4 py-2.5 font-medium text-charcoal-soft">
                    Stock
                  </th>
                  <th className="hidden px-4 py-2.5 font-medium text-charcoal-soft sm:table-cell">
                    Description
                  </th>
                  <th className="hidden px-4 py-2.5 font-medium text-charcoal-soft sm:table-cell">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-charcoal">{row.name || <span className="text-red-500">required</span>}</td>
                    <td className="px-4 py-2 text-charcoal-soft">{row.price}</td>
                    <td className="px-4 py-2 text-charcoal-soft">{row.stock}</td>
                    <td className="hidden max-w-[200px] truncate px-4 py-2 text-charcoal-soft sm:table-cell">
                      {row.description}
                    </td>
                    <td className="hidden px-4 py-2 text-charcoal-soft sm:table-cell">
                      {row.category}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <p className="px-4 py-2 text-xs text-muted">
                Showing 20 of {preview.length} rows
              </p>
            )}
          </div>

          {state.errors && state.errors.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-700">
                    {state.errors.length} row{state.errors.length === 1 ? "" : "s"} have errors
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-amber-600">
                    {state.errors.slice(0, 10).map((e) => (
                      <li key={e.row}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || preview.length === 0}
            className="w-full rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-150 hover:-translate-y-px hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? "Importing…"
              : `Import ${preview.length} product${preview.length === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </form>
  );
}
