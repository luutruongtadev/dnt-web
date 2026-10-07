import axios from "axios";

// Base URL for API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

/**
 * Download contract file
 * @param {Object} data - The data to generate the contract
 * @returns {Promise<boolean>} - True if successful
 */
const downloadContract = async (data) => {
  const { returnBlob, ...payload } = data;
  try {
    const response = await axios.post(
      `${API_URL}/contract/generate`,
      payload,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });

    if (returnBlob) return blob;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_${payload.benAIdentityNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.error?.message || "Contract download failed");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up contract download request");
    }
  }
};

/**
 * Upload signature file
 * @param {File} signatureFile - The signature file to upload
 * @param {string} authToken - The authentication token
 * @returns {Promise<Object>} - The response from the API
 */
const uploadSignature = async (signatureFile, authToken) => {
  try {
    const formData = new FormData();
    formData.append('signature', signatureFile);

    const response = await axios.post(
      `${API_URL}/signature/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.error?.message || "Signature upload failed");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up signature upload request");
    }
  }
};

export { downloadContract, uploadSignature };