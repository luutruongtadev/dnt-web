import axios from "axios";

// Base URL for API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

/**
 * Create a new product
 * @param {string} authToken - The authentication token
 * @param {Object} productData - The product data to be sent
 * @returns {Promise<Object>} - The response from the API
 */
const createFreelancer = async (authToken, freelancerData) => {
  try {
    const response = await axios.post(
      `${API_URL}/freelancers`,
      {
        data: freelancerData
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

const getFreelancer = async (page = 1, pageSize = 10, type = 'offline') => {
  try {
    const response = await axios.get(
      `${API_URL}/freelancers`,
      {
        params: {
          'filters[type][$eq]': type,
          'pagination[page]': page,
          'pagination[pageSize]': pageSize
        },
        headers: {
          'Content-Type': 'application/json'
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

/**
 * Get freelancers with null pic status
 * @param {number} page - Page number for pagination
 * @param {number} pageSize - Number of items per page
 * @param {string} type - Type of freelancer (offline/online)
 * @returns {Promise<Object>} - The response from the API
 */
const getFreelancerWithNullPic = async (page = 1, pageSize = 10, type = 'offline') => {
  try {
    const response = await axios.get(
      `${API_URL}/freelancers`,
      {
        params: {
          'filters[type][$eq]': type,
          'filters[pic][$null]': true,
          'pagination[page]': page,
          'pagination[pageSize]': pageSize
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.error?.message || "Failed to fetch freelancers");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up request to fetch freelancers");
    }
  }
};

/**
 * Update an existing freelancer
 * @param {string|number} freelancerId - The ID of the freelancer to update
 * @param {string} authToken - The authentication token
 * @param {Object} freelancerData - The updated freelancer data
 * @returns {Promise<Object>} - The response from the API
 */
const updateFreelancer = async (freelancerId, authToken, freelancerData) => {
  try {
    const response = await axios.put(
      `${API_URL}/freelancers/${freelancerId}`,
      {
        data: freelancerData
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
      throw new Error(error.response.data?.error?.message || "Freelancer update failed");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up freelancer update request");
    }
  }
};

/**
 * Update freelancer's pic status
 * @param {string} freelancerId - The ID of the freelancer
 * @param {string} authToken - The authentication token
 * @returns {Promise<Object>} - The response from the API
 */
const handleAcceptFreelancer = async (documentId) => {
  if (!documentId ) {
    throw new Error("Document ID are required");
  }
  const authToken = await localStorage.getItem('authToken');
  try {
    const response = await axios.put(
      `${API_URL}/freelancers/${documentId}/pic`,
      {
        data: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    alert('Chấp nhận freelancer thành công');
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.error?.message || "Failed to update freelancer pic status");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up freelancer pic update request");
    }
  }
};

export { getFreelancerWithNullPic, createFreelancer, getFreelancer, updateFreelancer, handleAcceptFreelancer };
