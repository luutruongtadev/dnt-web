const DRAFT_FILE_TYPE = "goods-post-draft-file"

export const GOODS_POST_DRAFT_KEY = "goodsPostDraft"
const GOODS_DRAFT_DB_NAME = "dntGoodsDrafts"
const GOODS_DRAFT_DB_VERSION = 1
const GOODS_DRAFT_STORE = "drafts"

export const PRODUCT_DRAFT_FILE_FIELDS = [
  "videoFile",
  "livestreamVideoFile",
  "livestreamCertFile",
  "advertisingVideoFile",
  "advertisingCertFile",
  "regLivestreamProductProfile",
  "regLivestreamCertFile",
  "regProductAdCompanyProfile",
  "regProductAdCertFile",
  "regPersonalBrandProductProfile",
  "regPersonalBrandCertFile",
]

export const ITEM_DRAFT_FILE_FIELDS = [
  "image",
  "videoFile",
  "qualityInfoFile",
  "warrantyPolicyFile",
]

const openGoodsDraftDb = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"))
      return
    }

    const request = indexedDB.open(GOODS_DRAFT_DB_NAME, GOODS_DRAFT_DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(GOODS_DRAFT_STORE)) {
        db.createObjectStore(GOODS_DRAFT_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const runDraftStoreRequest = async (mode, callback) => {
  const db = await openGoodsDraftDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GOODS_DRAFT_STORE, mode)
    const store = transaction.objectStore(GOODS_DRAFT_STORE)
    const request = callback(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
    transaction.onabort = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

const dataUrlToFile = (draftFile) => {
  if (!draftFile?.dataUrl || typeof File === "undefined") return null
  const [header, base64 = ""] = draftFile.dataUrl.split(",")
  const mime = draftFile.type || header.match(/data:(.*?);base64/)?.[1] || ""
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], draftFile.name || "draft-file", {
    type: mime,
    lastModified: draftFile.lastModified || Date.now(),
  })
}

const hydrateRootFiles = (goodsInfo) => {
  const next = { ...(goodsInfo || {}) }
  for (const field of PRODUCT_DRAFT_FILE_FIELDS) {
    if (next[field]?.__type === DRAFT_FILE_TYPE) {
      next[field] = dataUrlToFile(next[field])
    }
  }
  return next
}

const hydrateItemFiles = (items) =>
  (items || []).map((item) => {
    const next = { ...item }
    for (const field of ITEM_DRAFT_FILE_FIELDS) {
      if (next[field]?.__type === DRAFT_FILE_TYPE) {
        next[field] = dataUrlToFile(next[field])
      }
    }
    return next
  })

export const buildGoodsDraft = async ({
  selectedType,
  selectedCategory,
  selectedCondition,
  selectedCountry,
  selectedProvince,
  selectedDistrict,
  goodsInfo,
  goodsItems,
}) => ({
  version: 1,
  savedAt: new Date().toISOString(),
  selectedType,
  selectedCategory,
  selectedCondition,
  selectedCountry,
  selectedProvince,
  selectedDistrict,
  goodsInfo,
  goodsItems,
})

export const parseGoodsDraft = (rawDraft) => {
  if (!rawDraft) return null
  const draft = JSON.parse(rawDraft)
  return {
    ...draft,
    goodsInfo: hydrateRootFiles(draft.goodsInfo),
    goodsItems: hydrateItemFiles(draft.goodsItems),
  }
}

export const saveGoodsDraft = async (draft) => {
  await runDraftStoreRequest("readwrite", (store) => store.put(draft, GOODS_POST_DRAFT_KEY))
  localStorage.removeItem(GOODS_POST_DRAFT_KEY)
}

export const loadGoodsDraft = async () => {
  const draft = await runDraftStoreRequest("readonly", (store) => store.get(GOODS_POST_DRAFT_KEY))
  if (draft) return draft

  const legacyDraft = parseGoodsDraft(localStorage.getItem(GOODS_POST_DRAFT_KEY))
  if (legacyDraft) {
    await saveGoodsDraft(legacyDraft)
  }
  return legacyDraft
}

export const deleteGoodsDraft = async () => {
  localStorage.removeItem(GOODS_POST_DRAFT_KEY)
  await runDraftStoreRequest("readwrite", (store) => store.delete(GOODS_POST_DRAFT_KEY))
}
