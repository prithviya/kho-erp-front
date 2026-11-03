import { request, requestBlob } from "./apiClient";

const projectLibraryService = {
  list(projectId) {
    return request(`/project-library/${projectId}`);
  },
  createFolder(projectId, name) {
    return request(`/project-library/${projectId}/folders`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },
  renameFolder(projectId, folderId, name) {
    return request(`/project-library/${projectId}/folders/${folderId}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  },
  deleteFolder(projectId, folderId) {
    return request(`/project-library/${projectId}/folders/${folderId}`, { method: "DELETE" });
  },
  upload(projectId, folderId, files) {
    const body = new FormData();
    if (folderId) body.append("folderId", String(folderId));
    [...files].forEach((file) => body.append("files", file));
    return request(`/project-library/${projectId}/files`, { method: "POST", body });
  },
  content(projectId, file, download = false) {
    const path = file.type === "chat"
      ? `/project-library/${projectId}/chat-files/${file.messageId}/${file.attachmentIndex}/content`
      : `/project-library/${projectId}/files/${file.id}/content`;
    return requestBlob(`${path}${download ? "?download=1" : ""}`);
  },
  archive(projectId, files) {
    return requestBlob(`/project-library/${projectId}/files/archive`, {
      method: "POST",
      body: JSON.stringify({ files }),
    });
  },
  deleteFiles(projectId, ids, chatFiles = []) {
    return request(`/project-library/${projectId}/files`, {
      method: "DELETE",
      body: JSON.stringify({ ids, chatFiles }),
    });
  },
};

export default projectLibraryService;
