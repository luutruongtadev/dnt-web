import axios from "axios";

// Base URL for API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

/**
 * Create a new product
 * @param {string} authToken - The authentication token
 * @param {Object} liveData - The live data to be sent
 * @returns {Promise<Object>} - The response from the API
 */
const createLive = async (authToken, liveData) => {
  try {
    const response = await axios.post(
      `${API_URL}/lives`,
      {
        data: liveData
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    return response;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data?.error?.message || "Product creation failed");
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error("No response from server");
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error("Error setting up product creation request");
    }
  }
};

export { createLive };
