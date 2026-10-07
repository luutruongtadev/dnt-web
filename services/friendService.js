import axios from "axios";

// Base URL for API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

const getHeaders = (token) => {
  const authToken = token || localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${authToken}`,
  };
};

export const searchUsers = async (query, token) => {
  const response = await axios.get(`${API_URL}/auth/search-users`, {
    params: { query },
    headers: getHeaders(token),
  });
  return response.data;
};

export const sendFriendRequest = async (toUserId, token) => {
  const response = await axios.post(
    `${API_URL}/friend-requests`,
    { toUserId },
    { headers: getHeaders(token) }
  );
  return response.data;
};

export const getIncomingFriendRequests = async (token) => {
  const response = await axios.get(`${API_URL}/friend-requests/incoming`, {
    headers: getHeaders(token),
  });
  return response.data;
};

export const getOutgoingFriendRequests = async (token) => {
  const response = await axios.get(`${API_URL}/friend-requests/outgoing`, {
    headers: getHeaders(token),
  });
  return response.data;
};

export const acceptFriendRequest = async (requestId, token) => {
  const response = await axios.post(
    `${API_URL}/friend-requests/${requestId}/accept`,
    {},
    { headers: getHeaders(token) }
  );
  return response.data;
};

export const rejectFriendRequest = async (requestId, token) => {
  const response = await axios.post(
    `${API_URL}/friend-requests/${requestId}/reject`,
    {},
    { headers: getHeaders(token) }
  );
  return response.data;
};
