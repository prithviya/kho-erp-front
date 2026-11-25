import { useEffect, useMemo, useRef, useState } from "react";
import { CornerUpLeft, MessageCircle, Plus, Search, Send, UserRound, X } from "lucide-react";
import { toast } from "react-toastify";
import { getCurrentUser } from "../utils/auth";
import { subscribe } from "../services/realtime.service";
import directChatService from "../services/directChat.service";
import { getProfileImageUrl } from "../utils/profileImage";

const personName = (person) => (
  `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || person?.email || "Employee"
);
const normalizePerson = (person = {}) => ({
  ...person,
  id: String(person.id),
  fullName: person.fullName || personName(person),
  avatar: person.profileImage ? getProfileImageUrl(person.profileImage) : "",
});
const normalizeMessage = (message = {}) => ({
  ...message,
  id: String(message.id),
  senderId: String(message.senderId),
  sender: message.sender ? normalizePerson(message.sender) : null,
  text: message.message || "",
  replyTo: message.replyTo ? {
    id: String(message.replyTo.id),
    senderId: String(message.replyTo.senderId),
    sender: message.replyTo.sender ? normalizePerson(message.replyTo.sender) : null,
    text: message.replyTo.message || "",
  } : null,
});
const formatTime = (value) => new Date(value).toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
});

function Avatar({ person }) {
  const initials = person?.fullName?.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  return person?.avatar
    ? <img src={person.avatar} alt="" className="h-10 w-10 rounded-full object-cover shadow-xs" />
    : <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7a0c16] text-xs font-semibold text-white shadow-xs">{initials}</span>;
}

export default function DirectChat() {
  const currentUser = getCurrentUser();
  const self = normalizePerson(currentUser || {});
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [showPeople, setShowPeople] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const messagesRef = useRef(null);

  const visibleConversations = useMemo(() => conversations.filter((conversation) => (
    conversation.otherUser?.fullName?.toLowerCase().includes(search.toLowerCase())
  )), [conversations, search]);
  const visibleUsers = useMemo(() => users.filter((user) => (
    user.fullName.toLowerCase().includes(search.toLowerCase())
  )), [users, search]);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
  const activePerson = activeConversation?.otherUser;

  useEffect(() => {
    let active = true;
    Promise.all([directChatService.users(), directChatService.conversations()])
      .then(([usersResponse, conversationsResponse]) => {
        if (!active) return;
        const people = (usersResponse?.data || []).map(normalizePerson);
        const chats = (conversationsResponse?.data || []).map((conversation) => {
          const first = normalizePerson(conversation.participantOne || {});
          const second = normalizePerson(conversation.participantTwo || {});
          const otherUser = first.id === self.id ? second : first;
          return {
            ...conversation,
            id: String(conversation.id),
            otherUser,
            lastMessage: conversation.lastMessage ? normalizeMessage(conversation.lastMessage) : null,
          };
        });
        setUsers(people);
        setConversations(chats);
        setActiveConversationId(chats[0]?.id || "");
      })
      .catch((error) => {
        if (active) toast.error(error.message || "Unable to load direct chats.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [self.id]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return undefined;
    }
    let active = true;
    directChatService.messages(activeConversationId)
      .then((response) => {
        if (active) setMessages((response?.data || []).map(normalizeMessage));
      })
      .catch((error) => {
        if (active) toast.error(error.message || "Unable to load messages.");
      });
    return () => { active = false; };
  }, [activeConversationId]);

  useEffect(() => {
    const unsubscribe = subscribe("direct-chat-message", (payload) => {
      const conversationId = String(payload?.conversationId || "");
      const message = normalizeMessage(payload?.message);
      if (!conversationId || !message.id) return;
      setConversations((current) => current.map((conversation) => (
        conversation.id === conversationId
          ? { ...conversation, lastMessage: message, lastMessageAt: message.createdAt }
          : conversation
      )).sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt)));
      if (conversationId === activeConversationId) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      }
    });
    return unsubscribe;
  }, [activeConversationId]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages.length, activeConversationId]);

  const openConversation = async (person) => {
    try {
      const response = await directChatService.openConversation(person.id);
      const raw = response?.data;
      const first = normalizePerson(raw.participantOne || {});
      const second = normalizePerson(raw.participantTwo || {});
      const conversation = {
        ...raw,
        id: String(raw.id),
        otherUser: first.id === self.id ? second : first,
        lastMessage: raw.lastMessage ? normalizeMessage(raw.lastMessage) : null,
      };
      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ]);
      setActiveConversationId(conversation.id);
      setShowPeople(false);
      setMobileChatOpen(true);
      setSearch("");
    } catch (error) {
      toast.error(error.message || "Unable to open the conversation.");
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!activeConversationId || !text || isSending) return;
    setIsSending(true);
    try {
      const response = await directChatService.sendMessage(activeConversationId, {
        message: text,
        replyToMessageId: replyingTo?.id,
      });
      const saved = normalizeMessage(response?.data);
      setMessages((current) => current.some((item) => item.id === saved.id) ? current : [...current, saved]);
      setDraft("");
      setReplyingTo(null);
    } catch (error) {
      toast.error(error.message || "Unable to send the message.");
    } finally {
      setIsSending(false);
    }
  };

  const composerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100dvh-5rem)] flex-col p-3 sm:p-5 bg-white">
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a0c16]">TEAM COMMUNICATION</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Direct chat</h1>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <aside className={`${mobileChatOpen ? "hidden" : "flex"} w-full shrink-0 flex-col border-r border-slate-200/80 md:flex md:w-80`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">{showPeople ? "Employees" : "Your chats"}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{showPeople ? "Start a private conversation" : `${conversations.length} conversations`}</p>
            </div>
            <button
              type="button"
              title={showPeople ? "Back to chats" : "New chat"}
              aria-label={showPeople ? "Back to chats" : "New chat"}
              onClick={() => { setShowPeople((value) => !value); setSearch(""); }}
              className="h-8 w-8 rounded-full bg-black text-white hover:bg-gray-800 flex items-center justify-center shadow-xs transition-colors"
            >
              {showPeople ? <X size={16} /> : <Plus size={16} strokeWidth={2.5} />}
            </button>
          </div>
          <label className="relative mx-3.5 my-3 block">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={showPeople ? "Search employees" : "Search chats"}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#7a0c16] focus:ring-2 focus:ring-[#7a0c16]/10"
            />
          </label>
          <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-1.5">
            {showPeople ? visibleUsers.map((person) => (
              <button
                type="button"
                key={person.id}
                onClick={() => openConversation(person)}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-left border border-slate-200/70 hover:bg-slate-50 transition-colors"
              >
                <Avatar person={person} />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{person.fullName}</span>
                <MessageCircle size={15} className="text-slate-400" />
              </button>
            )) : visibleConversations.map((conversation) => {
              const isActive = activeConversationId === conversation.id;
              return (
                <button
                  type="button"
                  key={conversation.id}
                  onClick={() => { setActiveConversationId(conversation.id); setMobileChatOpen(true); }}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                    isActive
                      ? "bg-blue-50/40 border border-blue-200/80 shadow-xs"
                      : "bg-white border border-slate-200/70 hover:bg-slate-50"
                  }`}
                >
                  <Avatar person={conversation.otherUser} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-slate-900">{conversation.otherUser?.fullName || "Employee"}</span>
                    <span className="mt-1 block truncate text-[11px] text-slate-500">{conversation.lastMessage?.text || "No messages yet"}</span>
                  </span>
                  {conversation.lastMessage && <time className="shrink-0 text-[10px] text-slate-400 font-medium">{formatTime(conversation.lastMessage.createdAt)}</time>}
                </button>
              );
            })}
            {!isLoading && ((showPeople && !visibleUsers.length) || (!showPeople && !visibleConversations.length)) && (
              <p className="px-4 py-10 text-center text-xs text-slate-500">{showPeople ? "No employees found." : "No conversations yet. Start a new chat."}</p>
            )}
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-[10px] text-slate-400">Only the two conversation participants can access these messages.</div>
        </aside>

        <section className={`${mobileChatOpen ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex bg-white`}>
          {activeConversation && activePerson ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-3.5 bg-white">
                <button type="button" onClick={() => setMobileChatOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Back to chats"><X size={18} /></button>
                <Avatar person={activePerson} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900 text-sm">{activePerson.fullName}</p>
                  <p className="text-[11px] text-slate-500">Private conversation</p>
                </div>
              </header>
              <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto bg-white px-5 py-6 sm:px-8">
                {messages.map((message) => {
                  const own = message.senderId === self.id;
                  return (
                    <div id={`direct-message-${message.id}`} key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] transition-all ${
                          own
                            ? "bg-[#7a0c16] text-[#FFFFFF] shadow-xs"
                            : "bg-[#F4F5F9] text-slate-800"
                        }`}
                      >
                        <div className={`mb-1.5 flex items-center gap-3 text-[11px] ${own ? "text-white/80" : "text-slate-500"}`}>
                          <span className={`font-semibold ${own ? "text-white" : "text-slate-900"}`}>{own ? "You" : message.sender?.fullName || activePerson.fullName}</span>
                          <time className="text-[10px] font-medium">{formatTime(message.createdAt)}</time>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(message)}
                            aria-label="Reply to message"
                            title="Reply"
                            className={`ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                              own ? "hover:bg-white/10 text-white/90" : "hover:bg-black/5 text-slate-600"
                            }`}
                          >
                            <CornerUpLeft size={11} /> Reply
                          </button>
                        </div>

                        {message.replyTo && (
                          <button
                            type="button"
                            onClick={() => document.getElementById(`direct-message-${message.replyTo.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                            className={`mb-2 w-full rounded-xl px-3 py-2 text-left border-l-4 transition-all ${
                              own
                                ? "bg-[#FFFFFF] border-l-[#F4BB00] text-slate-800 shadow-xs"
                                : "bg-white border-l-[#7a0c16] text-slate-800"
                            }`}
                          >
                            <span className="block text-[11px] font-bold text-slate-900">
                              {message.replyTo.senderId === self.id ? "You" : message.replyTo.sender?.fullName || activePerson.fullName}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-600 font-normal">
                              {message.replyTo.text || "Message"}
                            </span>
                          </button>
                        )}
                        <p className={`whitespace-pre-wrap break-words text-xs leading-relaxed font-normal ${own ? "text-[#FFFFFF]" : "text-slate-800"}`}>
                          {message.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!messages.length && (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                    <UserRound size={28} />
                    <p className="mt-2 text-xs">Start the conversation with {activePerson.fullName}.</p>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 bg-white p-3 sm:p-5">
                {replyingTo && (
                  <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="min-w-0 border-l-3 border-[#7a0c16] pl-2.5">
                      <p className="text-[11px] font-bold text-[#7a0c16]">Replying to {replyingTo.senderId === self.id ? "yourself" : activePerson.fullName}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-600">{replyingTo.text}</p>
                    </div>
                    <button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200"><X size={15} /></button>
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-2xl border border-slate-200/90 p-2.5 bg-white focus-within:border-[#7a0c16] focus-within:ring-2 focus-within:ring-[#7a0c16]/10 transition-all">
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={composerKeyDown}
                    placeholder={`Message ${activePerson.fullName}...`}
                    aria-label="Message"
                    className="max-h-32 min-h-12 flex-1 resize-y bg-transparent px-2 py-1 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={isSending || !draft.trim()}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#7a0c16] px-4 text-xs font-semibold text-white hover:bg-[#630911] disabled:cursor-not-allowed disabled:opacity-40 transition-all"
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                </div>
                <p className="mt-2 px-1 text-[10px] text-slate-400">Enter to send · Shift+Enter for a new line</p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-rose-50 p-4 text-[#7a0c16]"><MessageCircle size={28} /></div>
              <h2 className="mt-4 text-base font-bold text-slate-900">Choose a conversation</h2>
              <p className="mt-1 max-w-sm text-xs text-slate-500">Select an existing chat or start a new private conversation with an employee.</p>
              <button
                type="button"
                onClick={() => setShowPeople(true)}
                className="mt-4 rounded-xl bg-[#7a0c16] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#630911] transition-colors"
              >
                New chat
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
