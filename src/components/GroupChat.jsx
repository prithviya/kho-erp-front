import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  AtSign,
  Check,
  Download,
  Eye,
  FileText,
  ImagePlus,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { getCanonicalRoles, getCurrentUser, isSuperAdmin } from "../utils/auth";
import { subscribe } from "../services/realtime.service";
import groupChatService from "../services/groupChat.service";
import { getProfileImageUrl } from "../utils/profileImage";

const WELCOME_MESSAGE = "Welcome! A little space for friendly chats, updates, and discussions.";
const dateTimeLabel = (value) => {
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
  return `${date} at ${time}`;
};
const fullName = (user) => user?.fullName || "Unknown member";
const memberSubtitle = (member) => (
  member?.designation && String(member.designation).toLowerCase() !== String(member.role || "").toLowerCase()
    ? `${member.role} · ${member.designation}`
    : member?.role || member?.designation || ""
);
const isSuperAdminMember = (member) => /super.?admin/i.test(String(member?.role || ""))
  || (member?.roles || []).some((role) => /super.?admin/i.test(`${role?.code || ""} ${role?.name || ""}`));
const normalizeApiUser = (user = {}) => {
  const roleNames = (user.roles || []).flatMap((role) => [role?.code, role?.name]).filter(Boolean);
  const role = roleNames.some((value) => /super.?admin/i.test(value))
    ? "Super Admin"
    : roleNames.some((value) => /manager/i.test(value))
      ? "Manager"
      : roleNames.some((value) => /employee|team.?member/i.test(value))
        ? "Employee"
        : roleNames[0] || "Employee";
  return {
    ...user,
    id: String(user.id),
    fullName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Employee",
    role,
    designation: user.designation || user.jobPosition || "",
    avatar: getProfileImageUrl(user.profileImage || user.avatar),
  };
};
const parseApiAttachments = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new TypeError("Group chat message attachments contain invalid JSON.");
    }
    return parseApiAttachments(parsed);
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (!keys.length) return [];
    if (["storedName", "originalName", "name", "url"].some((key) => key in value)) return [value];
    if (Array.isArray(value.attachments)) return value.attachments;
    const items = Object.values(value);
    if (items.every((item) => item && typeof item === "object"
      && ["storedName", "originalName", "name", "url"].some((key) => key in item))) return items;
  }
  throw new TypeError("Group chat message attachments must be an array.");
};
const normalizeApiMessage = (message = {}) => ({
  ...message,
  id: message.id == null ? "" : String(message.id),
  senderId: message.senderId == null ? null : String(message.senderId),
  sender: message.sender ? normalizeApiUser(message.sender) : null,
  text: message.message ?? message.text ?? "",
  system: Boolean(message.isSystem || message.system),
  pinned: Boolean(message.isPinned || message.pinned),
  createdAt: message.createdAt || new Date().toISOString(),
  attachments: parseApiAttachments(message.attachments).map((attachment) => ({
    ...attachment,
    id: String(attachment.id || attachment.storedName || attachment.name),
    file: {
      name: attachment.name || attachment.originalName || "Attachment",
      size: Number(attachment.size || 0),
      type: attachment.mimeType || attachment.type || "",
    },
    url: attachment.url ? getProfileImageUrl(attachment.url) : "",
  })),
});
const normalizeApiGroup = (group = {}) => {
  const members = (group.members || []).map(normalizeApiUser);
  return {
    ...group,
    id: String(group.id),
    name: group.name || "Untitled group",
    avatar: getProfileImageUrl(group.profileImage || group.avatar),
    createdAt: group.createdAt || new Date().toISOString(),
    memberIds: members.map((member) => member.id),
    members,
    messages: group.lastMessage ? [normalizeApiMessage(group.lastMessage)] : [],
  };
};
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatFileSize = (size = 0) => size < 1024 * 1024
  ? `${Math.max(1, Math.round(size / 1024))} KB`
  : `${(size / (1024 * 1024)).toFixed(1)} MB`;
const isImageFile = (file) => file?.type?.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file?.name || "");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Avatar({ person, className = "h-10 w-10" }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [person?.avatar]);

  if (person?.avatar && !imageFailed) {
    return (
      <img
        src={person.avatar}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span className={`${className} ${person?.color || "bg-slate-500"} inline-flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white`}>
      {initials(person?.fullName || person?.name)}
    </span>
  );
}

function MessageBody({ text, members }) {
  const names = members.map(fullName).sort((a, b) => b.length - a.length);
  if (!names.length) return text;
  const pattern = new RegExp(`@(${names.map(escapeRegExp).join("|")})(?=$|[\\s.,!?])`, "gi");
  const parts = [];
  let cursor = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(
      <span key={`${match.index}-${match[1]}`} className="mx-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
        @{match[1]}
      </span>
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function GroupChat() {
  const currentUser = getCurrentUser();
  const canonicalRoles = getCanonicalRoles(currentUser);
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(searchParams.get("groupId") || "");
  const [groupSearch, setGroupSearch] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const attachmentInput = useRef(null);
  const messagesContainerRef = useRef(null);
  const objectUrls = useRef(new Set());

  const liveActor = normalizeApiUser(currentUser || {});
  const activeUser = liveActor;
  const canCreateGroup = isSuperAdmin() || canonicalRoles.includes("MANAGER");
  const canManageGroup = canCreateGroup;
  const getPersonById = (id) => directoryUsers.find((person) => String(person.id) === String(id));
  const visibleGroups = useMemo(() => groups
    .filter((group) => canManageGroup || group.memberIds.some((id) => String(id) === String(activeUser.id)))
    .filter((group) => group.name.toLowerCase().includes(groupSearch.toLowerCase()))
    .sort((a, b) => new Date(b.messages.at(-1)?.createdAt || b.updatedAt || b.createdAt || 0) - new Date(a.messages.at(-1)?.createdAt || a.updatedAt || a.createdAt || 0)), [activeUser.id, canManageGroup, groups, groupSearch]);
  const activeGroup = visibleGroups.find((group) => group.id === activeGroupId) || visibleGroups[0] || null;
  const groupMembers = activeGroup?.members || [];
  const mentionOptions = mentionQuery === null ? [] : groupMembers.filter((member) => (
    !isSuperAdminMember(member)
    && fullName(member).toLowerCase().includes(mentionQuery.trim().toLowerCase())
  ));

  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.clear();
  }, []);

  useEffect(() => {
    if (activeGroup && activeGroup.id !== activeGroupId) setActiveGroupId(activeGroup.id);
  }, [activeGroup, activeGroupId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [activeGroup?.id, activeGroup?.messages.length]);

  useEffect(() => {
    let active = true;
    setIsLoadingGroups(true);
    Promise.all([
      groupChatService.list(),
      canManageGroup ? groupChatService.memberOptions() : Promise.resolve({ data: [] }),
    ])
      .then(([groupsResponse, membersResponse]) => {
        if (!active) return;
        const apiGroups = (groupsResponse?.data || []).map(normalizeApiGroup);
        const apiUsers = (membersResponse?.data || []).map(normalizeApiUser);
        const groupUsers = apiGroups.flatMap((group) => group.members || []);
        const byId = new Map([...apiUsers, ...groupUsers, liveActor].filter((user) => user.id).map((user) => [String(user.id), user]));
        setDirectoryUsers([...byId.values()]);
        setGroups(apiGroups);
        const requestedGroup = searchParams.get("groupId");
        const selectedGroup = apiGroups.find((group) => group.id === String(requestedGroup)) || apiGroups[0];
        setActiveGroupId(selectedGroup?.id || "");
      })
      .catch((error) => {
        if (active) {
          setGroups([]);
          toast.error(error.message || "Unable to load group chats.");
        }
      })
      .finally(() => {
        if (active) setIsLoadingGroups(false);
      });
    return () => { active = false; };
  }, [canManageGroup, liveActor.id, searchParams]);

  useEffect(() => {
      if (!activeGroup) return undefined;
    let active = true;
    groupChatService.messages(activeGroup.id)
      .then((response) => {
        if (!active) return;
        const messages = (response?.data || []).map(normalizeApiMessage);
        const messageUsers = messages.map((message) => message.sender).filter(Boolean);
        setDirectoryUsers((current) => [...new Map([...current, ...messageUsers].map((user) => [String(user.id), user])).values()]);
        setGroups((current) => current.map((group) => (
          group.id === activeGroup.id ? { ...group, messages } : group
        )));
      })
      .catch((error) => {
        if (active) toast.error(error.message || "Unable to load group messages.");
      });
    return () => { active = false; };
  }, [activeGroup?.id]);

  useEffect(() => {
    const unsubscribeMessage = subscribe("group-chat-message", (payload) => {
      const message = normalizeApiMessage(payload?.message);
      const groupId = String(payload?.groupId || "");
      if (!groupId || !message.id) return;
      if (message.sender) {
        setDirectoryUsers((current) => [...new Map([...current, message.sender].map((user) => [String(user.id), user])).values()]);
      }
      setGroups((current) => current.map((group) => {
        if (group.id !== groupId || group.messages.some((item) => item.id === message.id)) return group;
        return { ...group, messages: [...group.messages, message], updatedAt: message.createdAt };
      }));
    });
    const unsubscribeUpdated = subscribe("group-chat-updated", (payload) => {
      if (!payload?.group) return;
      const updated = normalizeApiGroup(payload.group);
      setGroups((current) => {
        const existing = current.find((group) => group.id === updated.id);
        const merged = existing ? { ...updated, messages: existing.messages } : updated;
        return existing
          ? current.map((group) => group.id === updated.id ? merged : group)
          : [merged, ...current];
      });
      setDirectoryUsers((current) => [...new Map([...current, ...(updated.members || [])].map((user) => [String(user.id), user])).values()]);
      groupChatService.messages(updated.id)
        .then((response) => {
          const messages = (response?.data || []).map(normalizeApiMessage);
          setGroups((current) => current.map((group) => group.id === updated.id ? { ...group, messages } : group));
        })
        .catch((error) => toast.error(error.message || "Unable to refresh group messages."));
    });
    const unsubscribeRemoved = subscribe("group-chat-removed", (payload) => {
      const groupId = String(payload?.groupId || "");
      setGroups((current) => current.filter((group) => group.id !== groupId));
      setActiveGroupId((current) => current === groupId ? "" : current);
    });
    const unsubscribeDeleted = subscribe("group-chat-deleted", (payload) => {
      const groupId = String(payload?.groupId || "");
      setGroups((current) => current.filter((group) => group.id !== groupId));
      setActiveGroupId((current) => current === groupId ? "" : current);
    });
    return () => {
      unsubscribeMessage();
      unsubscribeUpdated();
      unsubscribeRemoved();
      unsubscribeDeleted();
    };
  }, []);

  const selectGroup = (groupId) => {
    setActiveGroupId(groupId);
    setMobileChatOpen(true);
    setShowGroupSettings(false);
  };

  const applyApiGroupUpdate = async (apiGroup) => {
    const updated = normalizeApiGroup(apiGroup);
    let messages = updated.messages;
    try {
      const response = await groupChatService.messages(updated.id);
      messages = (response?.data || []).map(normalizeApiMessage);
    } catch (error) {
      toast.error(error.message || "Unable to refresh group messages.");
    }
    setGroups((current) => {
      const existing = current.find((group) => group.id === updated.id);
      return existing
        ? current.map((group) => group.id === updated.id ? { ...updated, messages: messages.length ? messages : existing.messages } : group)
        : [{ ...updated, messages }, ...current];
    });
    setDirectoryUsers((current) => [...new Map([...current, ...(updated.members || [])].map((user) => [String(user.id), user])).values()]);
    return { ...updated, messages };
  };

  const loadAttachmentBlob = useCallback(async (attachment, groupId = activeGroup?.id) => {
    if (attachment.url?.startsWith("blob:") || attachment.url?.startsWith("data:")) return null;
    return groupChatService.getAttachment(groupId, attachment.storedName || attachment.id);
  }, [activeGroup?.id]);

  const previewFileAttachment = async (attachment) => {
    try {
      const blob = await loadAttachmentBlob(attachment);
      if (!blob) {
        setPreviewAttachment(attachment);
        return;
      }
      const url = URL.createObjectURL(blob);
      objectUrls.current.add(url);
      setPreviewAttachment({ ...attachment, url, downloadUrl: url, objectUrl: url });
    } catch (error) {
      toast.error(error.message || "Unable to preview this attachment.");
    }
  };

  const downloadFileAttachment = async (attachment) => {
    try {
      const blob = await loadAttachmentBlob(attachment);
      const url = blob ? URL.createObjectURL(blob) : attachment.url;
      if (blob) objectUrls.current.add(url);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (blob) {
        window.setTimeout(() => {
          URL.revokeObjectURL(url);
          objectUrls.current.delete(url);
        }, 1000);
      }
    } catch (error) {
      toast.error(error.message || "Unable to download this attachment.");
    }
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const allowedFile = /\.(jpe?g|png|webp|docx?)$|\.pdf$/i;
    const validFiles = files.filter((file) => allowedFile.test(file.name));
    if (validFiles.length !== files.length) {
      toast.error("Attach JPG, PNG, WEBP, DOC, DOCX, or PDF files only.");
    }
    if (validFiles.some((file) => file.size > 10 * 1024 * 1024)) {
      toast.error("Each attachment must be 10 MB or smaller.");
    }
    const filesToAdd = validFiles.filter((file) => file.size <= 10 * 1024 * 1024);
    const remainingSlots = Math.max(0, 5 - pendingAttachments.length);
    if (filesToAdd.length > remainingSlots) {
      toast.error("You can attach up to 5 files per message.");
    }
    const nextAttachments = filesToAdd.slice(0, remainingSlots).map((file) => {
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      return { id: `${Date.now()}-${file.name}`, file, url };
    });
    setPendingAttachments((current) => [...current, ...nextAttachments]);
  };

  const removePendingAttachment = (attachmentId) => {
    const removed = pendingAttachments.find((item) => item.id === attachmentId);
    if (removed) {
      URL.revokeObjectURL(removed.url);
      objectUrls.current.delete(removed.url);
    }
    setPendingAttachments((current) => {
      return current.filter((item) => item.id !== attachmentId);
    });
  };

  const updateMentionQuery = (value) => {
    const match = value.match(/@([^@\n]*)$/);
    setMentionQuery(match && !/\s$/.test(value) ? match[1] : null);
    setMentionIndex(0);
  };

  const insertMention = (member) => {
    setMessageText((value) => value.replace(/@[^@\n]*$/, `@${fullName(member)} `));
    setMentionQuery(null);
  };

  const sendMessage = async () => {
    const message = messageText.trim();
    if (!activeGroup || (!message && !pendingAttachments.length)) return;

    const mentionedMembers = groupMembers.filter((member) => (
      String(member.id) !== String(activeUser.id) && message.includes(`@${fullName(member)}`)
    ));
    try {
      setIsSending(true);
      const response = await groupChatService.sendMessage(activeGroup.id, {
        message,
        mentionedUserIds: mentionedMembers.map((member) => member.id),
        attachments: pendingAttachments.map((attachment) => attachment.file),
      });
      const savedMessage = normalizeApiMessage(response?.data);
      setGroups((current) => current.map((group) => (
        group.id === activeGroup.id
          ? { ...group, messages: group.messages.some((item) => item.id === savedMessage.id) ? group.messages : [...group.messages, savedMessage] }
          : group
      )));
      setMessageText("");
      pendingAttachments.forEach(({ url }) => {
        URL.revokeObjectURL(url);
        objectUrls.current.delete(url);
      });
      setPendingAttachments([]);
      setMentionQuery(null);
    } catch (error) {
      toast.error(error.message || "Failed to send group message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (mentionQuery !== null && mentionOptions.length) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionIndex((index) => (index + 1) % mentionOptions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionIndex((index) => (index - 1 + mentionOptions.length) % mentionOptions.length);
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        insertMention(mentionOptions[mentionIndex]);
        return;
      }
    }
    if (event.key === "Escape" && mentionQuery !== null) {
      setMentionQuery(null);
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100dvh-5rem)] flex-col p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9c1018]">Team communication</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Group chat</h1>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <aside className={`${mobileChatOpen ? "hidden" : "flex"} w-full shrink-0 flex-col border-r border-slate-200 md:flex md:w-80`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Your groups</h2>
              <p className="mt-0.5 text-xs text-slate-500">{visibleGroups.length} conversations</p>
            </div>
            {canCreateGroup && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#9c1018] px-3 py-2 text-xs font-semibold text-white hover:bg-[#7d0d15]"
              >
                <Plus size={15} /> Create Group
              </button>
            )}
          </div>
          <label className="relative mx-3 my-3 block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={groupSearch}
              onChange={(event) => setGroupSearch(event.target.value)}
              placeholder="Search groups"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </label>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {visibleGroups.map((group) => {
              const lastMessage = group.messages.at(-1);
              const lastSender = lastMessage?.sender || getPersonById(lastMessage?.senderId);
              const selected = activeGroup?.id === group.id;
              return (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => selectGroup(group.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${selected ? "bg-rose-50 ring-1 ring-rose-100" : "hover:bg-slate-50"}`}
                >
                  <Avatar person={{ fullName: group.name, avatar: group.avatar, color: "bg-[#9c1018]" }} className="h-11 w-11" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{group.name}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{lastMessage ? formatTime(lastMessage.createdAt) : ""}</span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {lastMessage?.system ? lastMessage.text : `${lastSender ? `${lastSender.fullName}: ` : ""}${lastMessage?.text || "No messages yet"}`}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><Users size={11} /> {group.memberIds.length} members</span>
                  </span>
                </button>
              );
            })}
            {isLoadingGroups && <p className="px-4 py-10 text-center text-sm text-slate-500">Loading group chats…</p>}
            {!visibleGroups.length && !isLoadingGroups && (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No groups yet. You’ll see groups here when you’re added as a member.
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-[11px] leading-5 text-slate-500">
            Group chats and messages are stored on the server.
          </div>
        </aside>

        <section className={`${mobileChatOpen ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}>
          {activeGroup ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
                <button type="button" onClick={() => setMobileChatOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Back to groups">
                  <ArrowLeft size={18} />
                </button>
                <button type="button" onClick={() => setShowGroupSettings(true)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left hover:bg-slate-50">
                  <Avatar person={{ fullName: activeGroup.name, avatar: activeGroup.avatar, color: "bg-[#9c1018]" }} className="h-11 w-11" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-slate-900">{activeGroup.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Users size={13} /> {groupMembers.length} members
                    </span>
                  </span>
                </button>
                <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-500 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Group conversation
                </div>
              </header>

              <div ref={messagesContainerRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6">
                <div className="mx-auto max-w-xl rounded-xl border border-[#9c1018]/15 bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-[11px] font-semibold text-[#9c1018]">Created on {dateTimeLabel(activeGroup.createdAt)}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{WELCOME_MESSAGE}</p>
                </div>
                {activeGroup.messages.filter((message) => !(message.pinned && message.text === WELCOME_MESSAGE)).map((message) => {
                  if (message.system) {
                    return (
                      <div key={message.id} className="mx-auto max-w-xl rounded-lg bg-slate-200/70 px-4 py-2 text-center text-xs text-slate-600">
                        {message.text}
                      </div>
                    );
                  }
                  const sender = groupMembers.find((member) => String(member.id) === String(message.senderId))
                    || message.sender
                    || getPersonById(message.senderId);
                  const ownMessage = String(message.senderId) === String(activeUser.id);
                  const attachments = parseApiAttachments(message.attachments);
                  return (
                    <div key={message.id} className={`flex items-end gap-2 ${ownMessage ? "justify-end" : "justify-start"}`}>
                      {!ownMessage && <Avatar person={sender} className="h-8 w-8" />}
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[75%] ${ownMessage ? "rounded-br-md bg-[#9c1018] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                        <div className={`mb-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] ${ownMessage ? "text-rose-100" : "text-slate-500"}`}>
                          <span className={`font-semibold ${ownMessage ? "text-white" : "text-slate-800"}`}>{ownMessage ? "You" : fullName(sender)}</span>
                          {!ownMessage && <span>{sender?.role}</span>}
                          <time>{formatTime(message.createdAt)}</time>
                        </div>
                        {!!message.text && <p className="whitespace-pre-wrap break-words text-sm leading-6"><MessageBody text={message.text} members={groupMembers} /></p>}
                        {!!attachments.length && (
                          <div className={`mt-2 space-y-2 ${message.text ? "" : "mt-0"}`}>
                            {attachments.map((attachment) => (
                              <AttachmentCard
                                key={attachment.id}
                                attachment={attachment}
                                dark={ownMessage}
                                onLoad={loadAttachmentBlob}
                                onPreview={() => previewFileAttachment(attachment)}
                                onDownload={() => downloadFileAttachment(attachment)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {ownMessage && <Avatar person={activeUser} className="h-8 w-8" />}
                    </div>
                  );
                })}
              </div>

              <div className="relative border-t border-slate-200 bg-white p-3 sm:p-4">
                {mentionQuery !== null && mentionOptions.length > 0 && (
                  <div className="absolute bottom-full left-3 right-3 z-10 mb-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl sm:left-4 sm:right-4">
                    {mentionOptions.map((member, index) => (
                      <button
                        type="button"
                        key={member.id}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => insertMention(member)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left ${index === mentionIndex ? "bg-rose-50" : "hover:bg-slate-50"}`}
                      >
                        <Avatar person={member} className="h-8 w-8" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800">{member.fullName}</span>
                          <span className="block truncate text-xs text-slate-500">{memberSubtitle(member)}</span>
                        </span>
                        {index === mentionIndex && <span className="text-[10px] font-medium text-[#9c1018]">Enter</span>}
                      </button>
                    ))}
                  </div>
                )}
                {mentionQuery !== null && mentionOptions.length === 0 && (
                  <div className="absolute bottom-full left-3 right-3 z-10 mb-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg sm:left-4 sm:right-4">
                    No group members match “{mentionQuery}”.
                  </div>
                )}
                {!!pendingAttachments.length && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {pendingAttachments.map((attachment) => (
                      <span key={attachment.id} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">
                        {isImageFile(attachment.file) ? <img src={attachment.url} alt="" className="h-8 w-8 rounded object-cover" /> : <FileText size={17} className="shrink-0 text-[#9c1018]" />}
                        <span className="max-w-40 truncate">{attachment.file.name}</span>
                        <span className="shrink-0 text-slate-400">{formatFileSize(attachment.file.size)}</span>
                        <button type="button" onClick={() => removePendingAttachment(attachment.id)} aria-label={`Remove ${attachment.file.name}`} className="rounded p-1 text-[#9c1018] hover:bg-red-50"><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100">
                  <input
                    ref={attachmentInput}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.doc,.docx,.pdf"
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                  <button type="button" onClick={() => attachmentInput.current?.click()} aria-label="Attach files" title="Attach images, DOC, DOCX, or PDF" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#9c1018]">
                    <Paperclip size={18} />
                  </button>
                  <textarea
                    rows={2}
                    value={messageText}
                    onChange={(event) => {
                      setMessageText(event.target.value);
                      updateMentionQuery(event.target.value);
                    }}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={`Message ${activeGroup.name}...`}
                    aria-label="Message"
                    className="max-h-32 min-h-12 flex-1 resize-y bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={isSending || (!messageText.trim() && !pendingAttachments.length)}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#9c1018] px-3 text-sm font-semibold text-white hover:bg-[#7d0d15] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send size={15} /><span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="mt-2 flex items-center gap-1 px-1 text-[11px] text-slate-400"><AtSign size={12} /> Type @ to mention a group member · Enter to send · Shift+Enter for a new line</p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-red-50 p-4 text-[#9c1018]"><MessageCircle size={28} /></div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">No group selected</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {canCreateGroup ? "Create a group or choose one from the list to start chatting." : "You can chat in groups after a manager or Super Admin adds you."}
              </p>
              {canCreateGroup && <button type="button" onClick={() => setShowCreateModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#9c1018] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d0d15]"><Plus size={16} /> Create Group</button>}
            </div>
          )}
        </section>
      </div>

      {showCreateModal && (
        <CreateGroupModal
          creator={activeUser}
          users={directoryUsers}
          onClose={() => setShowCreateModal(false)}
          onCreate={async ({ name, memberIds, imageFile }) => {
            const response = await groupChatService.create({ name, memberIds, imageFile });
            const group = normalizeApiGroup(response?.data);
            setGroups((current) => [group, ...current.filter((item) => item.id !== group.id)]);
            setActiveGroupId(group.id);
            setMobileChatOpen(true);
            setShowCreateModal(false);
          }}
        />
      )}

      {showGroupSettings && activeGroup && (
        <GroupSettingsDrawer
          group={activeGroup}
          members={groupMembers}
          users={directoryUsers}
          canManage={canManageGroup}
          onClose={() => setShowGroupSettings(false)}
          onChangeImage={async (file) => {
            const response = await groupChatService.updateImage(activeGroup.id, file);
            applyApiGroupUpdate(response?.data);
            toast.success("Group image updated.");
          }}
          onAddMembers={async (memberIds) => {
            const additions = memberIds.filter((id) => !activeGroup.memberIds.some((memberId) => String(memberId) === String(id)));
            if (!additions.length) return;
            const response = await groupChatService.addMembers(activeGroup.id, additions);
            applyApiGroupUpdate(response?.data);
            toast.success("Members added to the group.");
          }}
          onRemoveMember={async (member) => {
            if (!window.confirm(`Remove ${fullName(member)} from ${activeGroup.name}?`)) return;
            try {
              const response = await groupChatService.removeMember(activeGroup.id, member.id);
              applyApiGroupUpdate(response?.data);
              toast.success(`${fullName(member)} was removed from the group.`);
            } catch (error) {
              toast.error(error.message || "Unable to remove this member.");
            }
          }}
          onDelete={async () => {
            if (!window.confirm(`Permanently delete "${activeGroup.name}"? This cannot be undone.`)) return;
            try {
              await groupChatService.removeGroup(activeGroup.id);
            } catch (error) {
              toast.error(error.message || "Unable to delete this group.");
              return;
            }
            const remainingGroups = visibleGroups.filter((group) => group.id !== activeGroup.id);
            setGroups((current) => current.filter((group) => group.id !== activeGroup.id));
            setActiveGroupId(remainingGroups[0]?.id || "");
            setShowGroupSettings(false);
            setMobileChatOpen(false);
            toast.success("Group deleted.");
          }}
        />
      )}

      {previewAttachment && (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          onDownload={() => downloadFileAttachment(previewAttachment)}
          onClose={() => {
            if (previewAttachment.objectUrl) {
              URL.revokeObjectURL(previewAttachment.objectUrl);
              objectUrls.current.delete(previewAttachment.objectUrl);
            }
            setPreviewAttachment(null);
          }}
        />
      )}
    </div>
  );
}

function CreateGroupModal({ creator, users, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [avatar, setAvatar] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);
  const availableMembers = users.filter((user) => (
    !isSuperAdminMember(user)
    &&
    String(user.id) !== String(creator.id)
    && !selectedIds.includes(String(user.id))
    && `${user.fullName} ${user.role} ${user.designation}`.toLowerCase().includes(search.toLowerCase())
  ));

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result || ""));
      setImageFile(file);
      setError("");
    };
    reader.onerror = () => setError("The selected image could not be read.");
    reader.readAsDataURL(file);
  };

  const createGroup = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a group name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreate({ name: name.trim(), memberIds: selectedIds, imageFile, avatar });
    } catch (createError) {
      setError(createError.message || "Unable to create the group.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={createGroup} className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><h2 className="text-lg font-bold text-slate-900">Create a group</h2><p className="mt-0.5 text-sm text-slate-500">Choose a name, image, and members.</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="space-y-5 overflow-y-auto p-5">
          <div className="flex items-center gap-4">
            <Avatar person={{ fullName: name || "Group", avatar, color: "bg-[#9c1018]" }} className="h-16 w-16" />
            <div>
              <input ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className="hidden" />
              <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ImagePlus size={16} /> Upload image</button>
              <p className="mt-1.5 text-xs text-slate-500">Optional · JPG, PNG or WEBP · up to 5 MB</p>
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Group name <span className="text-rose-600">*</span></span>
            <input autoFocus value={name} onChange={(event) => { setName(event.target.value); setError(""); }} maxLength={80} required placeholder="e.g. Product Launch" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
          </label>
          <div>
            <label htmlFor="group-member-search" className="mb-1.5 block text-sm font-semibold text-slate-700">Add members</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="group-member-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, role, or designation" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
            </div>
            {selectedIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedIds.map((id) => {
                  const member = users.find((user) => String(user.id) === String(id));
                  return <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 py-1 pl-1 pr-2 text-xs font-medium text-rose-800"><Avatar person={member} className="h-6 w-6" />{member?.fullName || "Employee"}<button type="button" onClick={() => setSelectedIds((ids) => ids.filter((item) => item !== id))} aria-label={`Remove ${member?.fullName || "employee"}`} className="ml-0.5 rounded-full p-0.5 hover:bg-rose-100"><X size={12} /></button></span>;
                })}
              </div>
            )}
            <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-200">
              {availableMembers.length ? availableMembers.map((member) => (
                <button type="button" key={member.id} onClick={() => { setSelectedIds((ids) => [...ids, String(member.id)]); setSearch(""); }} className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50">
                  <Avatar person={member} className="h-9 w-9" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{member.fullName}</span><span className="block truncate text-xs text-slate-500">{memberSubtitle(member)}</span></span>
                  <Plus size={16} className="text-slate-400" />
                </button>
              )) : <p className="px-3 py-4 text-center text-sm text-slate-500">{search ? "No matching employees." : "No more employees to add."}</p>}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">You’ll be included as the group creator.</p>
          </div>
          {error && <p role="alert" className="text-sm font-medium text-[#9c1018]">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#9c1018] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d0d15] disabled:opacity-50"><Check size={15} className="mr-1.5 inline" />{saving ? "Creating…" : "Create Group"}</button>
        </div>
      </form>
    </div>
  );
}

function GroupSettingsDrawer({ group, members, users, canManage, onClose, onChangeImage, onAddMembers, onRemoveMember, onDelete }) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [imageError, setImageError] = useState("");
  const imageInput = useRef(null);
  const currentMemberIds = new Set(group.memberIds.map(String));
  const availableMembers = users.filter((member) => (
    !currentMemberIds.has(String(member.id))
    && `${member.fullName} ${member.role} ${member.designation}`.toLowerCase().includes(search.toLowerCase())
  ));

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Choose an image smaller than 5 MB.");
      return;
    }
    try {
      await onChangeImage(file);
      setImageError("");
    } catch (error) {
      setImageError(error.message || "The selected image could not be read.");
    }
  };

  const addSelectedMembers = async () => {
    try {
      await onAddMembers(selectedIds);
      setSelectedIds([]);
      setSearch("");
    } catch (error) {
      toast.error(error.message || "Unable to add selected members.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/45 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-[#9c1018]">Group info & settings</p><h2 className="mt-1 text-lg font-bold text-slate-900">{group.name} <span className="text-sm font-medium text-slate-400">· {members.length}</span></h2></div>
          <button type="button" onClick={onClose} aria-label="Close group settings" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Avatar person={{ fullName: group.name, avatar: group.avatar, color: "bg-[#9c1018]" }} className="h-14 w-14" />
          <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-800">{group.name}</p><p className="text-xs text-slate-500">Created {dateTimeLabel(group.createdAt)}</p></div>
          {canManage && (
            <>
              <input ref={imageInput} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className="hidden" />
              <button type="button" onClick={() => imageInput.current?.click()} title="Change group image" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-[#9c1018]"><ImagePlus size={17} /></button>
            </>
          )}
        </div>
        {imageError && <p role="alert" className="px-5 pt-2 text-sm text-[#9c1018]">{imageError}</p>}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {canManage && (
            <section>
              <h3 className="text-sm font-semibold text-slate-800">Add members</h3>
              <div className="relative mt-2">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#9c1018] focus:ring-2 focus:ring-red-100" />
              </div>
              {selectedIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedIds.map((id) => {
                    const member = users.find((item) => String(item.id) === String(id));
                    return <span key={id} className="inline-flex items-center gap-1 rounded-full bg-red-50 py-1 pl-1 pr-2 text-xs text-[#9c1018]"><Avatar person={member} className="h-6 w-6" />{member?.fullName || "Employee"}<button type="button" onClick={() => setSelectedIds((ids) => ids.filter((item) => item !== id))} aria-label={`Remove ${member?.fullName || "employee"} from selection`}><X size={12} /></button></span>;
                  })}
                </div>
              )}
              <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-slate-200">
                {availableMembers.length ? availableMembers.map((member) => (
                  <button type="button" key={member.id} onClick={() => setSelectedIds((ids) => ids.includes(String(member.id)) ? ids.filter((id) => id !== String(member.id)) : [...ids, String(member.id)])} className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-slate-50">
                    <Avatar person={member} className="h-8 w-8" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800">{member.fullName}</span><span className="block truncate text-[11px] text-slate-500">{memberSubtitle(member)}</span></span>
                    {selectedIds.includes(String(member.id)) && <Check size={15} className="text-[#9c1018]" />}
                  </button>
                )) :                 <p className="px-3 py-3 text-center text-xs text-slate-500">{search ? "No matching employees." : "All available employees are members."}</p>}
              </div>
              <button type="button" onClick={addSelectedMembers} disabled={!selectedIds.length} className="mt-2 rounded-lg bg-[#9c1018] px-3 py-2 text-xs font-semibold text-white hover:bg-[#7d0d15] disabled:cursor-not-allowed disabled:opacity-40">Add selected members</button>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Members · {members.length}</h3>
            <div className="space-y-1">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
              <Avatar person={member} className="h-9 w-9" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{member.fullName}</p><p className="truncate text-xs text-slate-500">{memberSubtitle(member)}</p></div>
          {canManage && (
            <button
              type="button"
              onClick={() => onRemoveMember(member)}
              disabled={member.role === "Super Admin" || member.role === "Manager"}
              title={member.role === "Super Admin" || member.role === "Manager" ? "Super Admins and Managers cannot be removed." : "Remove member"}
              className="rounded-lg bg-[#9c1018] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#7d0d15] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#9c1018]"
            >
              Remove
            </button>
          )}
            </div>
          ))}
            </div>
          </section>
        </div>
        {canManage && (
          <div className="border-t border-slate-100 p-4">
            <button type="button" onClick={onDelete} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#9c1018] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7d0d15]">
              <Trash2 size={16} /> Delete Group
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function AttachmentCard({ attachment, dark, onPreview, onDownload, onLoad }) {
  const { file, url } = attachment;
  const isImage = isImageFile(file);
  const [assetUrl, setAssetUrl] = useState(url);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setAssetUrl(url);
    if (!isImage || !attachment.storedName) return undefined;
    onLoad(attachment)
      .then((blob) => {
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setAssetUrl(objectUrl);
      })
      .catch(() => {
        if (active) setAssetUrl(url);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment, isImage, onLoad, url]);

  return (
    <div className={`overflow-hidden rounded-lg border ${dark ? "border-white/20 bg-white/10" : "border-slate-200 bg-slate-50"}`}>
      {isImage && (
        <button type="button" onClick={onPreview} className="block max-h-52 w-full overflow-hidden">
          <img src={assetUrl} alt={file.name} className="max-h-52 w-full object-cover" />
        </button>
      )}
      <div className="flex items-center gap-2 px-2.5 py-2">
        {!isImage && <FileText size={20} className={dark ? "shrink-0 text-white" : "shrink-0 text-[#9c1018]"} />}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{file.name}</p>
          <p className={`text-[10px] ${dark ? "text-rose-100" : "text-slate-500"}`}>{formatFileSize(file.size)}</p>
        </div>
        <button type="button" onClick={onPreview} title="View attachment" className={`rounded p-1.5 ${dark ? "text-white hover:bg-white/10" : "text-slate-500 hover:bg-slate-200"}`}><Eye size={15} /></button>
        <button type="button" onClick={onDownload} title="Download attachment" className={`rounded p-1.5 ${dark ? "text-white hover:bg-white/10" : "text-slate-500 hover:bg-slate-200"}`}><Download size={15} /></button>
      </div>
    </div>
  );
}

function AttachmentPreviewModal({ attachment, onClose, onDownload }) {
  const { file, url } = attachment;
  const isImage = isImageFile(file);
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <FileText size={18} className="shrink-0 text-[#9c1018]" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{file.name}</p>
          <button type="button" onClick={onDownload} className="inline-flex items-center gap-1 rounded-lg bg-[#9c1018] px-3 py-2 text-xs font-semibold text-white hover:bg-[#7d0d15]"><Download size={14} /> Download</button>
          <button type="button" onClick={onClose} aria-label="Close preview" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex min-h-[50dvh] flex-1 items-center justify-center overflow-auto bg-slate-100 p-3">
          {isImage ? <img src={url} alt={file.name} className="max-h-[75dvh] max-w-full object-contain" />
            : isPdf ? <iframe title={`Preview of ${file.name}`} src={url} className="h-[75dvh] w-full rounded border border-slate-200 bg-white" />
              : <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
                <FileText size={40} className="mx-auto text-[#9c1018]" />
                <h3 className="mt-3 font-semibold text-slate-800">Document preview</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">DOC and DOCX files are attached and downloadable in this demo. Open the downloaded file to view its contents.</p>
              </div>}
        </div>
      </div>
    </div>
  );
}

export default GroupChat;
