"use client";

/**
 * DataTable — a generic, column-configurable table.
 *
 * Generalized from the 21st.dev "contacts-table-with-modal" component so every
 * table in the app can share one implementation: animated grid rows, optional
 * sort / filter / CSV-JSON export, row selection, an in-card detail modal, and
 * internal *or* external (controlled) pagination.
 *
 * It is token-based (bg-background / border-border / text-primary …), so it
 * automatically renders in the MCT brand palette defined in globals.css.
 *
 * Each consumer supplies `columns` with a custom `cell` renderer, so badges,
 * links, action menus, etc. are all expressible without touching this file.
 */

import { useState, useMemo, type ReactNode } from "react";
import { motion, useReducedMotion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronDown, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export interface DataTableColumn<T> {
  /** Stable id, used as React key and for sort state. */
  id: string;
  /** Header label. */
  header?: ReactNode;
  /** Optional small icon shown before the header label. */
  icon?: ReactNode;
  /** CSS grid track for this column, e.g. "220px" | "1fr" | "minmax(0,1fr)". Default "1fr". */
  width?: string;
  align?: "left" | "center" | "right";
  /** Cell content for a row. */
  cell: (row: T) => ReactNode;
  /** When provided, the column becomes sortable; returns a comparable value. */
  sortValue?: (row: T) => string | number;
  /** When provided, the column is included in CSV/JSON export. */
  exportValue?: (row: T) => string | number | null | undefined;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableFilter {
  label?: string;
  allLabel?: string;
  options: { label: string; value: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export interface DataTableSelection {
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
}

export interface DataTablePagination {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  /** Render numbered page buttons (brand style) instead of just Prev/Next. */
  numbered?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  className?: string;
  /** Horizontal min-width before the body scrolls. Default "720px". */
  minWidth?: string;
  enableAnimations?: boolean;

  onRowClick?: (row: T) => void;
  /** Fired when a row is hovered — use to prefetch/warm the destination's data. */
  onRowHover?: (row: T) => void;
  rowClassName?: (row: T) => string;

  /** Pass a selection adapter (e.g. from useRowSelection) to show checkboxes. */
  selection?: DataTableSelection;

  /** Custom toolbar content (search, tabs…) rendered on the left of the toolbar row. */
  toolbar?: ReactNode;
  /** Enable the built-in Sort dropdown, populated from columns with `sortValue`. */
  enableSort?: boolean;
  /** Controlled filter dropdown (the consumer applies the predicate to `data`). */
  filter?: DataTableFilter;
  /** Enable CSV/JSON export of the current `data` using columns' `exportValue`. */
  exportConfig?: { fileName?: string };
  /** Hide the whole toolbar row. */
  hideToolbar?: boolean;

  /**
   * "internal" → DataTable sorts + slices `data` itself (itemsPerPage).
   * object     → controlled/external pagination (consumer pre-paginates `data`).
   */
  pagination?: DataTablePagination | "internal";
  itemsPerPage?: number;

  /** When provided, a trailing "⋯" opens an in-card modal rendering this. */
  renderDetail?: (row: T) => ReactNode;

  /** Drop the outer rounded border so the table nests inside an existing card. */
  bare?: boolean;
  emptyMessage?: ReactNode;
}

type SortOrder = "asc" | "desc";

const containerVariants: Variants = {
  // Light, capped stagger — no long delay before the first row paints.
  visible: { transition: { staggerChildren: 0.015, delayChildren: 0 } },
};

const rowVariants: Variants = {
  // A plain fade-up: no per-row blur/scale (those force expensive repaints on every
  // row and made large tables feel sluggish).
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.16, ease: "easeOut" },
  },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

function alignClass(align?: "left" | "center" | "right") {
  return align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  className,
  minWidth = "720px",
  enableAnimations = true,
  onRowClick,
  onRowHover,
  rowClassName,
  selection,
  toolbar,
  enableSort = false,
  filter,
  exportConfig,
  hideToolbar = false,
  pagination,
  itemsPerPage = 10,
  renderDetail,
  bare = false,
  emptyMessage = "Aucun résultat.",
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const [sortColId, setSortColId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [detailRow, setDetailRow] = useState<T | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const sortableColumns = useMemo(() => columns.filter((c) => c.sortValue), [columns]);

  // Sort (only meaningful when sorting internally).
  const sorted = useMemo(() => {
    if (!sortColId) return data;
    const col = columns.find((c) => c.id === sortColId);
    if (!col?.sortValue) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortOrder === "asc" ? -1 : 1;
      if (av > bv) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sortColId, sortOrder, columns]);

  const isInternalPaging = pagination === "internal";
  const totalPages = isInternalPaging ? Math.max(1, Math.ceil(sorted.length / itemsPerPage)) : 1;
  const page = isInternalPaging ? Math.min(internalPage, totalPages) : 1;

  const rows = useMemo(() => {
    if (!isInternalPaging) return sorted;
    const start = (page - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, isInternalPaging, page, itemsPerPage]);

  // Grid template: [selection] columns [detail]
  const gridTemplate = useMemo(() => {
    const tracks: string[] = [];
    if (selection) tracks.push("44px");
    columns.forEach((c) => tracks.push(c.width ?? "1fr"));
    if (renderDetail) tracks.push("44px");
    return tracks.join(" ");
  }, [columns, selection, renderDetail]);

  const handleSort = (colId: string) => {
    if (sortColId === colId) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortColId(colId);
      setSortOrder("asc");
    }
    setShowSortMenu(false);
    setInternalPage(1);
  };

  const exportRows = (format: "csv" | "json") => {
    const exportCols = columns.filter((c) => c.exportValue);
    const fileBase = exportConfig?.fileName ?? "export";
    if (format === "json") {
      const json = JSON.stringify(
        sorted.map((row) => {
          const obj: Record<string, unknown> = {};
          exportCols.forEach((c) => {
            obj[c.id] = c.exportValue!(row) ?? "";
          });
          return obj;
        }),
        null,
        2,
      );
      downloadBlob(json, "application/json;charset=utf-8;", `${fileBase}.json`);
      return;
    }
    const headers = exportCols.map((c) => c.id);
    const lines = [
      headers.join(","),
      ...sorted.map((row) =>
        exportCols
          .map((c) => `"${String(c.exportValue!(row) ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    downloadBlob(lines.join("\n"), "text/csv;charset=utf-8;", `${fileBase}.csv`);
  };

  const showToolbar = !hideToolbar && (toolbar || enableSort || filter || exportConfig);

  return (
    <div className={cn("w-full", className)}>
      {showToolbar && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">{toolbar}</div>

          <div className="flex flex-wrap items-center gap-2">
            {filter && (
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu((s) => !s)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/30",
                    filter.value && "ring-2 ring-primary/30",
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M2 3H14M4 8H12M6 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {filter.label ?? "Filtrer"}
                  {filter.value && (
                    <span className="ml-1 rounded-sm bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">1</span>
                  )}
                </button>
                {showFilterMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-border/50 bg-background py-1 shadow-lg">
                      <button
                        onClick={() => {
                          filter.onChange(null);
                          setShowFilterMenu(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                          !filter.value && "bg-muted/30",
                        )}
                      >
                        {filter.allLabel ?? "Tous"}
                      </button>
                      <div className="my-1 h-px bg-border/30" />
                      {filter.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            filter.onChange(opt.value);
                            setShowFilterMenu(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                            filter.value === opt.value && "bg-muted/30",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {enableSort && sortableColumns.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu((s) => !s)}
                  className="flex items-center gap-2 rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/30"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 6L6 3L9 6M6 3V13M13 10L10 13L7 10M10 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Trier
                  {sortColId && <span className="ml-1 rounded-sm bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">1</span>}
                  <ChevronDown size={14} className="opacity-50" />
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border border-border/50 bg-background py-1 shadow-lg">
                      {sortableColumns.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSort(c.id)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                            sortColId === c.id && "bg-muted/30",
                          )}
                        >
                          {c.header}{" "}
                          {sortColId === c.id && `(${sortOrder === "asc" ? "↑" : "↓"})`}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {exportConfig && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu((s) => !s)}
                  className="flex items-center gap-2 rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/30"
                >
                  <Download size={14} />
                  Exporter
                  <ChevronDown size={14} className="opacity-50" />
                </button>
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-border/50 bg-background shadow-lg">
                      <button
                        onClick={() => {
                          exportRows("csv");
                          setShowExportMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => {
                          exportRows("json");
                          setShowExportMenu(false);
                        }}
                        className="w-full border-t border-border/30 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                      >
                        JSON
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={cn("relative overflow-hidden", !bare && "rounded-lg border border-border/50 bg-background")}>
        <div className="overflow-x-auto">
          <div style={{ minWidth }}>
            {/* Header */}
            <div
              className="border-b border-border/30 bg-muted/5 px-3 py-3 text-left text-xs font-medium text-muted-foreground/70"
              style={{ display: "grid", gridTemplateColumns: gridTemplate, columnGap: "0px" }}
            >
              {selection && (
                <div className="flex items-center justify-center border-r border-border/20 pr-3">
                  <Checkbox
                    checked={selection.allSelected}
                    indeterminate={selection.someSelected}
                    onCheckedChange={selection.toggleAll}
                    label="Tout sélectionner"
                  />
                </div>
              )}
              {columns.map((c, i) => (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center gap-1.5 px-3",
                    alignClass(c.align),
                    i < columns.length - 1 || renderDetail ? "border-r border-border/20" : "",
                    c.headerClassName,
                  )}
                >
                  {c.icon && <span className="opacity-40">{c.icon}</span>}
                  {c.header && <span className="truncate">{c.header}</span>}
                </div>
              ))}
              {renderDetail && <div className="flex items-center justify-center px-3" />}
            </div>

            {/* Body */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${isInternalPaging ? page : "ext"}`}
                variants={shouldAnimate ? containerVariants : undefined}
                initial={shouldAnimate ? "hidden" : false}
                animate="visible"
              >
                {rows.map((row) => {
                  const id = getRowId(row);
                  const selected = selection?.isSelected(id) ?? false;
                  return (
                    <motion.div key={id} variants={shouldAnimate ? rowVariants : undefined}>
                      <div
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        onMouseEnter={onRowHover ? () => onRowHover(row) : undefined}
                        className={cn(
                          "group relative border-b border-border/20 px-3 py-3.5 transition-all duration-150",
                          selected ? "bg-muted/30" : "bg-muted/5 hover:bg-muted/20",
                          onRowClick && "cursor-pointer",
                          rowClassName?.(row),
                        )}
                        style={{ display: "grid", gridTemplateColumns: gridTemplate, columnGap: "0px", alignItems: "center" }}
                      >
                        {selection && (
                          <div
                            className="flex items-center justify-center border-r border-border/20 pr-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => selection.toggle(id)}
                              label="Sélectionner la ligne"
                            />
                          </div>
                        )}
                        {columns.map((c, i) => (
                          <div
                            key={c.id}
                            className={cn(
                              "flex min-w-0 items-center px-3",
                              alignClass(c.align),
                              i < columns.length - 1 || renderDetail ? "border-r border-border/20" : "",
                              c.cellClassName,
                            )}
                          >
                            {c.cell(row)}
                          </div>
                        ))}
                        {renderDetail && (
                          <div className="flex items-center justify-center px-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailRow(row);
                              }}
                              className="cursor-pointer opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60"
                              aria-label="Voir le détail"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="3" r="1.5" fill="currentColor" />
                                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                                <circle cx="8" cy="13" r="1.5" fill="currentColor" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {rows.length === 0 && (
                  <div className="px-3 py-12 text-center text-sm font-semibold text-muted-foreground">
                    {emptyMessage}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Detail modal */}
        <AnimatePresence>
          {detailRow && renderDetail && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm"
              onClick={() => setDetailRow(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                className="relative mx-6 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setDetailRow(null)}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-muted/50 transition-colors hover:bg-muted/70"
                  aria-label="Fermer"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
                {renderDetail(detailRow)}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {isInternalPaging
        ? totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="text-xs text-muted-foreground/70">
                Page {page} sur {totalPages} • {sorted.length} éléments
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setInternalPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-border/50 bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setInternalPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-border/50 bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            </div>
          )
        : pagination && pagination.totalPages > 1 && (
            <ExternalPagination {...pagination} />
          )}
    </div>
  );
}

function ExternalPagination({ page, totalPages, totalItems, onPageChange, numbered }: DataTablePagination) {
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
        Page {page} sur {totalPages}
        {typeof totalItems === "number" ? ` • ${totalItems} éléments` : ""}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-border/50 bg-background px-3 py-1.5 text-[10px] font-bold uppercase text-foreground transition-all hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Précédent
        </button>
        {numbered &&
          Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "h-7 w-7 rounded-lg text-xs font-bold transition-all",
                p === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/50 bg-background text-foreground hover:bg-muted/30",
              )}
            >
              {p}
            </button>
          ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-border/50 bg-background px-3 py-1.5 text-[10px] font-bold uppercase text-foreground transition-all hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
