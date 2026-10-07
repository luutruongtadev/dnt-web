import axios from "axios";

// Base URL for API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

const getHeaders = (token) => {
  const authToken = token || localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${authToken}`,
  };
};

export const getConversations = async (token) => {
  const response = await axios.get(`${API_URL}/conversations`, {
    headers: getHeaders(token),
  });
  return response.data;
};

export const getOrCreateConversation = async (userId, token) => {
  const response = await axios.post(
    `${API_URL}/conversations`,
    { userId },
    {
      headers: getHeaders(token),
    }
  );
  return response.data;
};

export const getMessages = async (conversationId, since = '', limit = 50, token) => {
  const params = {};
  if (since) params.since = since;
  if (limit) params.limit = limit;
  const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
    params,
    headers: getHeaders(token),
  });
  return response.data;
};

export const sendMessage = async (conversationId, content, type = 'text', attachmentId, token) => {
  const response = await axios.post(
    `${API_URL}/conversations/${conversationId}/messages`,
    { content, type, attachmentId },
    {
      headers: getHeaders(token),
    }
  );
  return response.data;
};

// Uploads a file via Strapi's built-in /api/upload and returns the created
// media object ({ id, url, ... }) — used for image messages.
export const uploadFile = async (file, token) => {
  const formData = new FormData();
  formData.append('files', file);
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      ...getHeaders(token),
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.[0];
};

export const markAsRead = async (conversationId, token) => {
  const response = await axios.post(
    `${API_URL}/conversations/${conversationId}/read`,
    {},
    {
      headers: getHeaders(token),
    }
  );
  return response.data;
};

export const getUnreadCount = async (token) => {
  const response = await axios.get(`${API_URL}/conversations/unread-count`, {
    headers: getHeaders(token),
  });
  return response.data;
};

// Combined poll: conversations + incoming friend requests + (if activeConversationId
// is given) new messages since sinceMessageId — and marks that conversation read.
// Replaces separately polling getConversations / getIncomingFriendRequests /
// getMessages(since) / markAsRead every few seconds.
export const syncAll = async (activeConversationId, sinceMessageId, token) => {
  const params = {};
  if (activeConversationId) params.activeConversationId = activeConversationId;
  if (sinceMessageId) params.sinceMessageId = sinceMessageId;
  const response = await axios.get(`${API_URL}/conversations/sync`, {
    params,
    headers: getHeaders(token),
  });
  return response.data;
};

// Removes the conversation from my list only — the other participant is unaffected.
export const hideConversation = async (conversationId, token) => {
  const response = await axios.post(
    `${API_URL}/conversations/${conversationId}/hide`,
    {},
    { headers: getHeaders(token) }
  );
  return response.data;
};

// Toggles mute for me only; returns { success, muted }.
export const muteConversation = async (conversationId, token) => {
  const response = await axios.post(
    `${API_URL}/conversations/${conversationId}/mute`,
    {},
    { headers: getHeaders(token) }
  );
  return response.data;
};

// Clears the message history (both sides) — the conversation/friendship stays intact.
export const clearMessages = async (conversationId, token) => {
  const response = await axios.delete(`${API_URL}/conversations/${conversationId}/messages`, {
    headers: getHeaders(token),
  });
  return response.data;
};

export const reportConversation = async (conversationId, token) => {
  const response = await axios.post(
    `${API_URL}/conversations/${conversationId}/report`,
    {},
    { headers: getHeaders(token) }
  );
  return response.data;
};

// Unfriends the other participant and deletes the conversation + messages for both sides.
export const removeContact = async (conversationId, token) => {
  const response = await axios.delete(`${API_URL}/conversations/${conversationId}`, {
    headers: getHeaders(token),
  });
  return response.data;
};
