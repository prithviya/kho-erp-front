import { request, requestBlob } from "./apiClient";

function formDataWithImage(file, fieldName) {
  const formData = new FormData();
  if (file) formData.append(fieldName, file);
  return formData;
}

const groupChatService = {
  list() {
    return request("/group-chat");
  },
  memberOptions() {
    return request("/group-chat/member-options");
  },
  create({ name, memberIds, imageFile }) {
    const body = formDataWithImage(imageFile, "profileImage");
    body.append("name", name);
    body.append("memberIds", JSON.stringify(memberIds || []));
    return request("/group-chat", { method: "POST", body });
  },
  messages(groupId) {
    return request(`/group-chat/${groupId}/messages`);
  },
  sendMessage(groupId, { message, mentionedUserIds, attachments }) {
    const body = new FormData();
    body.append("message", message || "");
    body.append("mentionedUserIds", JSON.stringify(mentionedUserIds || []));
    (attachments || []).forEach((file) => body.append("attachments", file));
    return request(`/group-chat/${groupId}/messages`, { method: "POST", body });
  },
  addMembers(groupId, memberIds) {
    return request(`/group-chat/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ memberIds }),
    });
  },
  removeMember(groupId, userId) {
    return request(`/group-chat/${groupId}/members/${userId}`, { method: "DELETE" });
  },
  updateImage(groupId, file) {
    return request(`/group-chat/${groupId}/profile-image`, {
      method: "PUT",
      body: formDataWithImage(file, "profileImage"),
    });
  },
  removeGroup(groupId) {
    return request(`/group-chat/${groupId}`, { method: "DELETE" });
  },
  getAttachment(groupId, fileName, download = false) {
    const query = download ? "?download=1" : "";
    return requestBlob(`/group-chat/${groupId}/attachments/${encodeURIComponent(fileName)}${query}`);
  },
};

export default groupChatService;
