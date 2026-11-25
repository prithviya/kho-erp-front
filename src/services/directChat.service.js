import { request } from "./apiClient";

const directChatService = {
  users() {
    return request("/direct-chat/users");
  },
  conversations() {
    return request("/direct-chat/conversations");
  },
  openConversation(userId) {
    return request("/direct-chat/conversations", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
  messages(conversationId) {
    return request(`/direct-chat/conversations/${conversationId}/messages`);
  },
  sendMessage(conversationId, { message, replyToMessageId }) {
    return request(`/direct-chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message, replyToMessageId }),
    });
  },
};

export default directChatService;
