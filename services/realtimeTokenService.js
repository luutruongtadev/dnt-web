import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

const getHeaders = (token) => {
  const authToken = token || localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${authToken}`,
  };
};

// Mints a short-lived Supabase-compatible JWT (signed with the Supabase
// project's own JWT secret) so the frontend can authenticate Supabase
// Realtime private channel subscriptions as this Strapi user.
export const getRealtimeToken = async (token) => {
  const response = await axios.post(
    `${API_URL}/realtime-token`,
    {},
    { headers: getHeaders(token) }
  );
  return response.data; // { token, expires_in }
};
