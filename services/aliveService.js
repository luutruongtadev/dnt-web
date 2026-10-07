import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";
const SESSION_KEY = "sitePresenceSessionId";

const getPresenceSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    const randomPart = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    sessionId = `web_${Date.now()}_${randomPart}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

const sendAlive = async (path = window.location.pathname) => {
  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await axios.post(
    `${API_URL}/alive`,
    {
      sessionId: getPresenceSessionId(),
      path,
    },
    { headers }
  );

  return response.data?.data || {};
};

export { sendAlive };
