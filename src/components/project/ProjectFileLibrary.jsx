import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Download,
  FileImage,
  FileText,
  Folder,
  LockKeyhole,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import projectLibraryService from "../../services/projectLibrary.service";

function formatBytes(size) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function fileKind(file) {
  const mimeType = String(file.mimeType || "").toLowerCase();
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf" || /\.pdf$/i.test(file.name || file.originalName || "")) return "pdf";
  return "other";
}

function fileTypeLabel(file) {
  const filename = String(file.name || file.originalName || "");
  const extension = filename.match(/\.([^.]+)$/)?.[1];
  if (extension) return extension.toUpperCase();

  const mimeType = String(file.mimeType || "").toLowerCase();
  const mimeLabels = {
    "image/jpeg": "JPEG",
    "image/svg+xml": "SVG",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    "text/plain": "TXT",
    "text/csv": "CSV",
    "application/zip": "ZIP",
  };
  if (mimeLabels[mimeType]) return mimeLabels[mimeType];
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return mimeType.slice("image/".length).toUpperCase();
  if (mimeType.startsWith("video/")) return mimeType.slice("video/".length).toUpperCase();
  return "FILE";
}

function createDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function monthKey(date) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? ""
    : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

export default function ProjectFileLibrary({ projectId, projectName }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderFilter, setFolderFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [folderEditor, setFolderEditor] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [preview, setPreview] = useState(null);
  const loadSequence = useRef(0);

  const loadLibrary = useCallback(async () => {
    const sequence = ++loadSequence.current;
    try {
      setLoading(true);
      const response = await projectLibraryService.list(projectId);
      if (sequence !== loadSequence.current) return;
      setFolders(response?.data?.folders || []);
      setFiles(response?.data?.files || []);
      setSelectedFiles([]);
    } catch (error) {
      if (sequence === loadSequence.current) {
        toast.error(error.message || "Unable to load project library.");
      }
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setFolderFilter("all");
    setMonthFilter("all");
    loadLibrary();
  }, [loadLibrary]);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const months = useMemo(() => [...new Set(files.map((file) => monthKey(file.createdAt)).filter(Boolean))]
    .sort((left, right) => right.localeCompare(left)), [files]);

  const visibleFiles = useMemo(() => files.filter((file) => {
    const matchesFolder = folderFilter === "all"
      || (folderFilter === "unfiled" && !file.folderId)
      || String(file.folderId) === folderFilter;
    return matchesFolder && (monthFilter === "all" || monthKey(file.createdAt) === monthFilter);
  }), [files, folderFilter, monthFilter]);

  const selectedFileCannotBeDeleted = selectedFiles.some((file) => !file.deletable);
  const allVisibleFilesSelected = visibleFiles.length > 0
    && visibleFiles.every((file) => selectedFiles.some((selected) => selected.id === file.id));

  const toggleFile = (file) => {
    const isSelected = selectedFiles.some((item) => item.id === file.id);
    if (!isSelected && selectedFiles.length >= 100) {
      toast.error("You can select up to 100 files at a time.");
      return;
    }
    setSelectedFiles((current) => isSelected
      ? current.filter((item) => item.id !== file.id)
      : [...current, file]);
  };

  const toggleVisibleFiles = () => {
    const visibleIds = new Set(visibleFiles.map((file) => file.id));
    if (allVisibleFilesSelected) {
      setSelectedFiles((current) => current.filter((file) => !visibleIds.has(file.id)));
      return;
    }

    const selectedOutsideView = selectedFiles.filter((file) => !visibleIds.has(file.id));
    if (selectedOutsideView.length + visibleFiles.length > 100) {
      toast.error("You can select up to 100 files at a time.");
      return;
    }
    setSelectedFiles([...selectedOutsideView, ...visibleFiles]);
  };

  const openFile = async (file, download = false) => {
    try {
      const blob = await projectLibraryService.content(projectId, file, download);
      if (download) {
        createDownload(blob, file.name || file.originalName || "download");
        return;
      }
      const url = URL.createObjectURL(blob);
      setPreview({ ...file, kind: fileKind(file), url });
    } catch (error) {
      toast.error(error.message || "Unable to open this file.");
    }
  };

  const uploadFiles = async (event) => {
    const selected = event.target.files;
    if (!selected?.length) return;
    const folderId = /^\d+$/.test(folderFilter) ? folderFilter : null;
    try {
      setUploading(true);
      await projectLibraryService.upload(projectId, folderId, selected);
      toast.success("Files uploaded.");
      await loadLibrary();
    } catch (error) {
      toast.error(error.message || "Unable to upload files.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const saveFolder = async (event) => {
    event.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    try {
      setBusy(true);
      if (folderEditor?.id) {
        await projectLibraryService.renameFolder(projectId, folderEditor.id, name);
      } else {
        const response = await projectLibraryService.createFolder(projectId, name);
        setFolderFilter(String(response.data.id));
      }
      setFolderEditor(null);
      setFolderName("");
      await loadLibrary();
    } catch (error) {
      toast.error(error.message || "Unable to save folder.");
    } finally {
      setBusy(false);
    }
  };

  const deleteFolder = async (folder) => {
    if (!window.confirm(`Delete the empty folder "${folder.name}"?`)) return;
    try {
      setBusy(true);
      await projectLibraryService.deleteFolder(projectId, folder.id);
      if (folderFilter === String(folder.id)) setFolderFilter("all");
      await loadLibrary();
    } catch (error) {
      toast.error(error.message || "Unable to delete folder.");
    } finally {
      setBusy(false);
    }
  };

  const downloadSelected = async () => {
    try {
      setBusy(true);
      const archive = await projectLibraryService.archive(projectId, selectedFiles.map((file) => (
        file.type === "chat"
          ? { type: "chat", messageId: file.messageId, attachmentIndex: file.attachmentIndex }
          : { type: "library", id: file.id }
      )));
      createDownload(archive, `${String(projectName || "project").replace(/[^\w.-]+/g, "-")}-library.zip`);
    } catch (error) {
      toast.error(error.message || "Unable to download selected files.");
    } finally {
      setBusy(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedFiles.length) return;
    const chatCount = selectedFiles.filter((file) => file.type === "chat").length;
    const message = chatCount
      ? `Delete ${selectedFiles.length} selected file(s)? ${chatCount} task chat attachment(s) will also be removed from their chat messages.`
      : `Delete ${selectedFiles.length} selected file(s)?`;
    if (!window.confirm(message)) return;
    try {
      setBusy(true);
      await projectLibraryService.deleteFiles(
        projectId,
        selectedFiles.filter((file) => file.type !== "chat").map((file) => file.id),
        selectedFiles.filter((file) => file.type === "chat").map((file) => ({
          messageId: file.messageId,
          attachmentIndex: file.attachmentIndex,
        })),
      );
      setSelectedFiles([]);
      toast.success("Selected files deleted.");
      await loadLibrary();
    } catch (error) {
      toast.error(error.message || "Unable to delete selected files.");
    } finally {
      setBusy(false);
    }
  };

  const selectedFolder = folders.find((folder) => String(folder.id) === folderFilter);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">Project files</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Library</h2>
          <p className="mt-1 text-sm text-slate-500">{projectName} · Images, videos, and documents</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* <button type="button" onClick={() => { setFolderEditor({}); setFolderName(""); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <FolderPlus size={16} /> New folder
          </button> */}
          <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            <Upload size={16} /> {uploading ? "Uploading…" : "Upload files"}
            <input type="file" multiple accept="image/*,video/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp" className="hidden" onChange={uploadFiles} disabled={uploading} />
          </label>
          <button type="button" onClick={loadLibrary} disabled={loading} title="Refresh library" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {folderEditor && (
        <form onSubmit={saveFolder} className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <Folder size={17} className="text-emerald-700" />
          <input autoFocus value={folderName} onChange={(event) => setFolderName(event.target.value)} maxLength={120} placeholder="Folder name" className="min-w-40 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <button type="submit" disabled={busy || !folderName.trim()} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{folderEditor.id ? "Save name" : "Create folder"}</button>
          <button type="button" onClick={() => setFolderEditor(null)} className="rounded-md border border-slate-200 bg-white p-2 text-slate-500" aria-label="Cancel folder edit"><X size={16} /></button>
        </form>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-2">
          <button type="button" onClick={() => setFolderFilter("all")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${folderFilter === "all" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>All files</button>
          <button type="button" onClick={() => setFolderFilter("unfiled")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${folderFilter === "unfiled" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Unfiled</button>
          {folders.map((folder) => (
            <div key={folder.id} className={`flex items-center rounded-full text-xs font-semibold ${folderFilter === String(folder.id) ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
              <button type="button" onClick={() => setFolderFilter(String(folder.id))} className="flex items-center gap-1.5 py-1.5 pl-3 pr-1.5"><Folder size={13} />{folder.name}</button>
              <button type="button" title={`Rename ${folder.name}`} onClick={() => { setFolderEditor(folder); setFolderName(folder.name); }} className="rounded-full p-1 hover:bg-white/70"><Pencil size={12} /></button>
              <button type="button" title={`Delete ${folder.name}`} onClick={() => deleteFolder(folder)} disabled={busy} className="rounded-full p-1 pr-2 hover:bg-white/70"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
        <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} aria-label="Filter by month" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          <option value="all">All months</option>
          {months.map((month) => {
            const [year, value] = month.split("-");
            const label = new Date(Number(year), Number(value) - 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
            return <option key={month} value={month}>{label}</option>;
          })}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading library…</div>
      ) : visibleFiles.length ? (
        <>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          <label className="mr-auto inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={allVisibleFilesSelected}
              onChange={toggleVisibleFiles}
              aria-label={allVisibleFilesSelected ? "Deselect all visible files" : "Select all visible files"}
              className="h-4 w-4 accent-emerald-600"
            />
            {selectedFiles.length ? `${selectedFiles.length} selected` : "Select all visible"}
          </label>
          <button type="button" onClick={downloadSelected} disabled={busy || !selectedFiles.length} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"><Archive size={14} /> Download selected{selectedFiles.length ? ` (${selectedFiles.length})` : ""} as ZIP</button>
          {selectedFiles.length > 0 && (
            <>
              <button type="button" onClick={deleteSelected} disabled={busy || selectedFileCannotBeDeleted} title={selectedFileCannotBeDeleted ? "You can only delete files you uploaded." : "Delete selected files"} className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} /> Delete</button>
              <button type="button" onClick={() => setSelectedFiles([])} className="rounded-md p-2 text-slate-500 hover:bg-slate-200" aria-label="Clear selection"><X size={15} /></button>
            </>
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visibleFiles.map((file) => {
            const kind = fileKind(file);
            const Icon = kind === "image" ? FileImage : kind === "video" ? Video : FileText;
            const selected = selectedFiles.some((item) => item.id === file.id);
            return (
              <article key={file.id} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 ${selected ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
                <input type="checkbox" checked={selected} onChange={() => toggleFile(file)} aria-label={`Select ${file.name}`} className="h-4 w-4 accent-emerald-600" />
                <button type="button" onClick={() => openFile(file)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-emerald-700"><Icon size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{file.name}</span>
                    <span className="mt-1 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-slate-600">{fileTypeLabel(file)}</span>
                    <span className="mt-1 block text-[11px] text-slate-500">{formatBytes(file.size)} · {new Date(file.createdAt).toLocaleDateString()}</span>
                  </span>
                </button>
                {file.type === "chat" && <span title="Task chat attachment" className="text-slate-400"><LockKeyhole size={14} /></span>}
                <button type="button" onClick={() => openFile(file, true)} title="Download file" aria-label={`Download ${file.name}`} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"><Download size={16} /></button>
              </article>
            );
          })}
        </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-14 text-center">
          <Folder size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">{selectedFolder ? `No files in ${selectedFolder.name}` : "No files found"}</p>
          <p className="mt-1 text-xs text-slate-500">Upload images, videos, or documents to this project library.</p>
        </div>
      )}

      {preview && (
        <div role="dialog" aria-modal="true" aria-label={`Preview ${preview.name}`} onClick={() => setPreview(null)} className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4">
          <div onClick={(event) => event.stopPropagation()} className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-800">{preview.name}</p>
              <button type="button" onClick={() => setPreview(null)} aria-label="Close preview" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
              {preview.kind === "image" && <img src={preview.url} alt={preview.name} className="max-h-[78vh] max-w-full object-contain" />}
              {preview.kind === "video" && <video src={preview.url} controls autoPlay className="max-h-[78vh] max-w-full" />}
              {preview.kind === "pdf" && <iframe src={preview.url} title={preview.name} className="h-[78vh] w-full rounded border border-slate-200 bg-white" />}
              {preview.kind === "other" && <p className="text-sm text-slate-600">Preview is not available for this file type.</p>}
            </div>
            <div className="flex justify-end border-t border-slate-200 px-4 py-3">
              <button type="button" onClick={() => openFile(preview, true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"><Download size={14} /> Download</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
