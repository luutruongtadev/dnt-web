import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

/**
 * Get list of banks from system configuration
 * @returns {Promise<Array>} List of banks
 */
export const getBanks = async () => {
    try {
        const response = await axios.get(`${API_URL}/system-configuration/banks`);
        if (response.data && response.data.success) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching banks:", error);
        return [];
    }
};

export const getMicroblinkLicense = async () => {
    const response = await axios.get(`${API_URL}/system-configuration/microblink-license`);
    return response.data?.data?.licenseKey || "";
};
