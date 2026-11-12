import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export default function SortableHeader({ label, sortKey, sortConfig, onSort, className = "" }) {
  const active = sortConfig.key === sortKey;
  const direction = active ? sortConfig.direction : null;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      aria-label={`Sort by ${label} ${direction === "asc" ? "descending" : "ascending"}`}
      className={`inline-flex items-center gap-1 text-left transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${className}`}
    >
      {label}
      {direction === "asc" ? <ArrowUp size={13} aria-hidden="true" /> : direction === "desc" ? <ArrowDown size={13} aria-hidden="true" /> : <ArrowUpDown size={13} className="opacity-50" aria-hidden="true" />}
    </button>
  );
}
