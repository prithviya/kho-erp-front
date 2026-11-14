import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Download, FileText, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import onboardingDocumentService from "../../services/onboardingDocument.service";

const API_ROOT_URL = String(import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
const ONBOARDING_DOCUMENT_PATH = "/uploads/onboarding-documents/";

function getDocumentUrl(document) {
  const storedName = String(document?.storedName || "").trim();
  if (storedName && !storedName.includes("/") && !storedName.includes("\\")) {
    return `${API_ROOT_URL}${ONBOARDING_DOCUMENT_PATH}${encodeURIComponent(storedName)}`;
  }

  const rawUrl = String(document?.fileUrl || "").trim();
  if (!rawUrl) return "";

  try {
    const parsedUrl = new URL(rawUrl, API_ROOT_URL || window.location.origin);
    if (!parsedUrl.pathname.startsWith(ONBOARDING_DOCUMENT_PATH)) return "";
    return `${API_ROOT_URL}${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return "";
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const response = await onboardingDocumentService.list();
      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error(response?.message || "The document list response was invalid.");
      }
      setDocuments(response.data);
      setSelectedIds(new Set());
    } catch (error) {
      setLoadError(true);
      toast.error(error.message || "Unable to load onboarding documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const downloadableDocuments = useMemo(
    () => documents.filter((item) => item.archiveAvailable),
    [documents],
  );
  const allSelected = downloadableDocuments.length > 0
    && downloadableDocuments.every((item) => selectedIds.has(item.id));
  const selectedDocuments = documents.filter((item) => selectedIds.has(item.id));

  const toggleDocument = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(allSelected
      ? new Set()
      : new Set(downloadableDocuments.map((item) => item.id)));
  };

  const downloadSelected = async () => {
    if (!selectedDocuments.length) return;

    try {
      setDownloading(true);
      const isDownloadingAll = allSelected;
      const archive = await onboardingDocumentService.archive(
        selectedDocuments.map(({ cifid, documentIndex }) => ({ cifid, documentIndex })),
        isDownloadingAll,
      );
      downloadBlob(archive, "onboarding-documents.zip");
    } catch (error) {
      toast.error(error.message || "Unable to download selected documents.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">HR onboarding</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Document Library</h1>
          <p className="mt-1 text-sm text-slate-500">Browse employee onboarding documents and download selected files as a ZIP.</p>
        </div>
        <button
          type="button"
          onClick={loadDocuments}
          disabled={loading}
          title="Refresh document library"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3">
        <label className="mr-auto inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            disabled={loading || !downloadableDocuments.length}
            aria-label={allSelected ? "Deselect all documents" : "Select all documents"}
            className="h-4 w-4 accent-emerald-600"
          />
          {selectedIds.size ? `${selectedIds.size} selected` : `Select all ${downloadableDocuments.length} downloadable`}
        </label>
        <button
          type="button"
          onClick={downloadSelected}
          disabled={downloading || !selectedIds.size}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Archive size={14} />
          {downloading ? "Preparing ZIP…" : `Download selected${selectedIds.size ? ` (${selectedIds.size})` : ""} as ZIP`}
        </button>
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200"
          >
            Clear selection
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading documents…</div>
      ) : loadError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-red-700">Unable to load the document library</p>
          <p className="mt-1 text-xs text-red-600">Refresh the library to try again.</p>
        </div>
      ) : documents.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {documents.map((item) => {
            const selected = selectedIds.has(item.id);
            const fileUrl = getDocumentUrl(item);
            return (
              <article
                key={item.id}
                className={`flex min-w-0 flex-col rounded-xl border p-4 transition-colors ${
                  selected ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleDocument(item.id)}
                    disabled={!item.archiveAvailable}
                    aria-label={`Select ${item.fileName || item.documentType}`}
                    className="mt-1 h-4 w-4 shrink-0 accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <FileText size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-slate-800">{item.fileName || "Document"}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.documentType || "Document"}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <p><span className="font-medium text-slate-700">Employee:</span> {item.employeeName || "—"}</p>
                  <p><span className="font-medium text-slate-700">Employee ID:</span> {item.employeeId || "—"}</p>
                  <p><span className="font-medium text-slate-700">Status:</span> <span className="capitalize">{item.status || "—"}</span></p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  {fileUrl ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      <Download size={14} /> Open file
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">File unavailable</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-14 text-center">
          <FileText size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No onboarding documents found</p>
          <p className="mt-1 text-xs text-slate-500">Documents uploaded during employee onboarding will appear here.</p>
        </div>
      )}
    </section>
  );
}
