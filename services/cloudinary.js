import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

/**
 * Upload an image via the app's own /api/upload endpoint, which stores it on
 * Supabase Storage (replaces the old direct-to-Cloudinary upload).
 * @param file The image file (from input type="file" or others)
 * @returns URL string of the uploaded image (same contract as before)
 */
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('files', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const first = Array.isArray(response.data) ? response.data[0] : response.data;
  return first?.url;
};

// Backwards-compatible alias — existing callers import this name.
export const uploadImageToCloudinary = uploadImage;
