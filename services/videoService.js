import axios from "axios";

// Base URL for API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

/**
 * Tạo một video (gắn với sản phẩm). File được upload trực tiếp qua Strapi
 * (multipart `files.source`) — Strapi lưu qua provider đã cấu hình (Supabase storage).
 * @param {string} authToken - The authentication token
 * @param {Object} videoData - Dữ liệu video. `source` có thể là File (sẽ upload qua Strapi)
 *   hoặc bỏ trống. `product` là id sản phẩm để liên kết.
 * @returns {Promise<Object>} - The response from the API
 */
const createVideo = async (authToken, videoData) => {
  try {
    const headers = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const { source, ...rest } = videoData || {};
    let body;

    if (source instanceof File) {
      // Upload file qua Strapi: field phẳng + file ở `source` (controller đọc ctx.request.files.source)
      const fd = new FormData();
      for (const [key, val] of Object.entries(rest)) {
        if (val === undefined || val === null) continue;
        fd.append(key, typeof val === "object" ? JSON.stringify(val) : String(val));
      }
      fd.append("source", source, source.name);
      body = fd; // axios tự set Content-Type multipart kèm boundary
    } else {
      headers["Content-Type"] = "application/json";
      body = { data: videoData };
    }

    const response = await axios.post(`${API_URL}/videos`, body, { headers });
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.error?.message || "Video creation failed");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error("Error setting up video creation request");
    }
  }
};

const FILE_BASE_URL = API_URL.replace(/\/api\/?$/, "");

const normalizeFileUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? `${FILE_BASE_URL}${url}` : `${FILE_BASE_URL}/${url}`;
};

const getMediaUrl = (media) => {
  if (!media) return "";
  if (typeof media === "string") return normalizeFileUrl(media);
  if (media.url) return normalizeFileUrl(media.url);
  if (media.attributes?.url) return normalizeFileUrl(media.attributes.url);
  if (media.data?.attributes?.url) return normalizeFileUrl(media.data.attributes.url);
  if (Array.isArray(media.data) && media.data[0]?.attributes?.url) return normalizeFileUrl(media.data[0].attributes.url);
  return "";
};

// Strapi entity (flattened or attributes-wrapped) -> shape dùng cho AiLiveVideoList/VideoCard
const mapVideo = (raw) => {
  const v = { id: raw?.id, documentId: raw?.documentId, ...(raw?.attributes || raw || {}) };
  return {
    id: v.id,
    documentId: v.documentId,
    name: v.name || "",
    productId: v.product?.data?.id ?? v.product?.id ?? null,
    viewers: Number(v.startFromView || 0),
    saves: 0,
    shares: 0,
    hasPlatformLogo: Boolean(v.hasPlatformLogo),
    url: getMediaUrl(v.source),
    isGoods: true,
  };
};

/**
 * Lấy "thư mục ID hàng hóa" cho tab LIVESTREAM: các sản phẩm có video livestream
 * (đã tải lên), kèm danh sách video của từng sản phẩm. Không phụ thuộc phiên live.
 * @param {Object} opts - { page, pageSize, search }
 * @param {string} authToken - optional
 * @returns {Promise<{ folders: Array<{id, name, updatedAt, videos: Array}>, pagination: Object }>}
 */
const getGoodsVideoFolders = async (opts = {}, authToken = null) => {
  try {
    const { page = 1, pageSize = 20, search = "" } = opts;
    const headers = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const params = { page, pageSize };
    if (search) params.search = search;

    const response = await axios.get(`${API_URL}/products/goods-videos`, { headers, params });
    const list = response.data?.data || [];
    const folders = list.map((p) => ({
      id: p.id,
      name: p.name || `ID ${p.id}`,
      updatedAt: p.updatedAt,
      // Video từ media của product không có quan hệ product -> gán productId = id thư mục
      videos: (p.videos || []).map((v) => {
        const mv = mapVideo(v);
        return { ...mv, productId: mv.productId ?? p.id };
      }),
    }));
    return {
      folders,
      pagination: response.data?.meta?.pagination || { page, pageSize, pageCount: 0, total: list.length },
    };
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || "Failed to fetch goods videos");
  }
};

export { createVideo, getGoodsVideoFolders, getMediaUrl };
