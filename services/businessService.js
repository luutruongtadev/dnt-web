import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

/**
 * Create or update business information.
 * - If the user already has a business record → updates the latest one.
 * - If not → creates a new one.
 * - Also syncs up_users.business_id with the latest business record id.
 * Supports partial update (only fields sent in body are updated).
 *
 * POST /api/business
 * @param {Object} data - Business data fields
 * @returns {Promise<Object>} - API response
 */
const createOrUpdateBusiness = async (data) => {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            throw new Error("No authentication token found");
        }

        const response = await axios.post(
            `${API_URL}/business`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw error;
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error creating/updating business");
        }
    }
};

/**
 * Get the latest business information for the authenticated user.
 *
 * GET /api/business/me
 * @returns {Promise<Object>} - API response with business data
 */
const getMyBusiness = async () => {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            throw new Error("No authentication token found");
        }

        const response = await axios.get(
            `${API_URL}/business/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw error;
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error fetching business info");
        }
    }
};

const getMyDocuments = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No authentication token found");

    const response = await axios.get(
        `${API_URL}/user-document/my`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                // Verification state must be read fresh — a stale "no documents"
                // response cached before the CCCD was scanned would wrongly gate
                // the user out of /new-post.
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            },
            params: { _ts: Date.now() },
        }
    );
    return response;
};

const verifyMyBusiness = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No authentication token found");

    const response = await axios.post(
        `${API_URL}/business/verify`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            },
        }
    );
    return response;
};

const uploadDocumentToStrapi = async (dataUrl, type) => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No authentication token found");

    const response = await axios.post(
        `${API_URL}/user-document/upload`,
        { imageBase64: dataUrl, type },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data.file; // { id, url, name, ... }
};

export { createOrUpdateBusiness, getMyBusiness, uploadDocumentToStrapi, getMyDocuments, verifyMyBusiness };
