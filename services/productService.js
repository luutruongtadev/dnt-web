import axios from "axios";

// Base URL for API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

/**
 * Create a new product
 * @param {string} authToken - The authentication token
 * @param {Object} productData - The product data to be sent
 * @returns {Promise<Object>} - The response from the API
 */
// File field names that are sent as binary uploads
const PRODUCT_FILE_FIELDS = [
  'videoFile', 'livestreamVideoFile', 'livestreamCertFile',
  'advertisingVideoFile', 'advertisingCertFile',
  'regLivestreamProductProfile', 'regLivestreamCertFile',
  'regProductAdCompanyProfile', 'regProductAdCertFile',
  'regPersonalBrandProductProfile', 'regPersonalBrandCertFile',
];

const ITEM_FILE_FIELDS = [
  'image', 'videoFile', 'qualityInfoFile', 'warrantyPolicyFile'
];

/**
 * Build FormData from a plain object, hoisting File values to multipart slots.
 * Non-file fields are appended as strings. Arrays/objects are JSON-stringified.
 */
function buildFormData(data) {
  const fd = new FormData();
  const dataToSerialize = { ...data };

  // 1. Handle root-level files
  for (const field of PRODUCT_FILE_FIELDS) {
    if (data[field] instanceof File) {
      fd.append(field, data[field], data[field].name);
      delete dataToSerialize[field];
    }
  }

  // 2. Handle item-level files
  if (Array.isArray(data.items)) {
    dataToSerialize.items = data.items.map((item, index) => {
      const itemCopy = { ...item };
      for (const field of ITEM_FILE_FIELDS) {
        if (item[field] instanceof File) {
          fd.append(`items[${index}][${field}]`, item[field], item[field].name);
          // Replace File object with a placeholder or remove it from JSON serialization
          itemCopy[field] = null;
        }
      }
      return itemCopy;
    });
  }

  // 3. Append everything else
  for (const [key, val] of Object.entries(dataToSerialize)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val) || (typeof val === 'object')) {
      fd.append(key, JSON.stringify(val));
    } else {
      fd.append(key, String(val));
    }
  }

  return fd;
}

const createProduct = async (authToken, productData) => {
  try {
    const hasRootFiles = PRODUCT_FILE_FIELDS.some(f => productData[f] instanceof File);
    const hasItemFiles = Array.isArray(productData.items) && 
      productData.items.some(item => ITEM_FILE_FIELDS.some(f => item[f] instanceof File));
    
    const hasFiles = hasRootFiles || hasItemFiles;
    let body;
    let headers = { 'Authorization': `Bearer ${authToken}` };

    if (hasFiles) {
      body = buildFormData(productData);
    } else {
      body = productData;
      headers['Content-Type'] = 'application/json';
    }

    const response = await axios.post(`${API_URL}/products`, body, { headers });
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.error?.message || "Product creation failed");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up product creation request");
    }
  }
};

/**
 * Get all products
 * @param {string} authToken - The authentication token (optional for public products)
 * @returns {Promise<Object>} - The response from the API
 */
const getProducts = async (authToken = null) => {
  try {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await axios.get(`${API_URL}/products`, { headers });
    return response;
  } catch {
    throw new Error("Failed to fetch products");
  }
};

/**
 * Get a specific product by ID
 * @param {string|number} productId - The ID of the product to fetch
 * @param {string} authToken - The authentication token (optional for public products)
 * @returns {Promise<Object>} - The response from the API
 */
const getProductById = async (productId, authToken = null) => {
  try {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await axios.get(`${API_URL}/products/${productId}`, {
      headers,
      params: { populate: "*" },
    });
    return response;
  } catch {
    throw new Error("Failed to fetch product");
  }
};

/**
 * Update an existing product
 * @param {string|number} productId - The ID of the product to update
 * @param {string} authToken - The authentication token
 * @param {Object} productData - The updated product data
 * @returns {Promise<Object>} - The response from the API
 */
const updateProduct = async (productId, authToken, productData) => {
  try {
    const response = await axios.put(
      `${API_URL}/products/${productId}`,
      productData,
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
      throw new Error(error.response.data?.error?.message || "Product update failed");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up product update request");
    }
  }
};

/**
 * Delete a product
 * @param {string|number} productId - The ID of the product to delete
 * @param {string} authToken - The authentication token
 * @returns {Promise<Object>} - The response from the API
 */
const deleteProduct = async (productId, authToken) => {
  try {
    const response = await axios.delete(
      `${API_URL}/products/${productId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.error?.message || "Product deletion failed");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up product deletion request");
    }
  }
};

const filterProducts = async (filters = {}, page = 1, pageSize = 10, authToken = null, isEmptyPic = false) => {
  try {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Create params object with direct parameter names to match the curl command format
    const params = {
      page,
      pageSize
    };

    // Add filters directly to params without the Strapi filter syntax
    if (filters.listingType) params.listingType = filters.listingType;
    if (filters.categoryType) params.categoryType = filters.categoryType;
    if (filters.conditionType) params.conditionType = filters.conditionType;
    if (filters.nation) params.nation = filters.nation;
    if (filters.province) params.province = filters.province;
    if (filters.name) params.name = filters.name;
    params.isEmptyPic = isEmptyPic;

    const response = await axios.get(`${API_URL}/products`, { 
      headers,
      params
    });
    
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.error?.message || "Failed to filter products");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up product filter request");
    }
  }
};



/**
 * Update a product's price information
 * @param {string|number} productId - The ID of the product to update price info
 * @param {string} authToken - The authentication token
 * @param {Object} priceData - The price data to update (setPrice, depositRequirement)
 * @returns {Promise<Object>} - The response from the API
 */
const updateProductPriceInfo = async (productId, authToken, priceData) => {
  if (!priceData.setPrice || !priceData.depositRequirement) {
    throw new Error("setPrice and depositRequirement must be provided");
  }
  try {
    const response = await axios.post(
      `${API_URL}/products/${productId}/pic`,
      priceData,
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
      throw new Error(error.response.data?.error?.message || "Product price update failed");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up product price update request");
    }
  }
};

const getLiveGoodsSession = async (productId, authToken = null) => {
  try {
    const headers = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return await axios.get(`${API_URL}/products/${productId}/live-session`, { headers });
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || "Failed to fetch live session");
  }
};

const joinLiveGoodsSession = async (productId, viewer, authToken = null) => {
  try {
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return await axios.post(`${API_URL}/products/${productId}/live-session/join`, { viewer }, { headers });
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || "Failed to join live session");
  }
};

const submitLiveGoodsBid = async (productId, bidData, authToken = null) => {
  try {
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return await axios.post(`${API_URL}/products/${productId}/live-session/bids`, bidData, { headers });
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || "Failed to submit live bid");
  }
};

export { createProduct, getProducts, getProductById, updateProduct, deleteProduct,
  filterProducts, updateProductPriceInfo, getLiveGoodsSession, joinLiveGoodsSession, submitLiveGoodsBid };
