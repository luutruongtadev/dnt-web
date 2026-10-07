import axios from 'axios';

/**
 * Upload image to Cloudinary
 * @param file The image file (from input type="file" or others)
 * @returns URL string of uploaded image
 */
export const uploadImageToCloudinary = async (file)=> {
  const cloudName = 'dz43kod4r'; // Thay cloudName nếu cần
  const uploadPreset = 'dainghaitin'; // Phải tạo sẵn upload_preset trong Cloudinary

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await axios.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.secure_url; // Trả về link ảnh sau khi upload
};
