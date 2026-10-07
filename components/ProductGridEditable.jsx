"use client";
import React, { useEffect, useState, useRef } from "react";
import { Eye as EyeIcon, Forward as ForwardIcon, X as XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import useHorizontalScrollbar from "../custom-hooks/useHorizontalScrollbar";
import NumberInput from "./atoms/NumberInput";
import TwoLineUnitInput from "./atoms/TwoLineUnitInput";
import { getUserCountry } from "../utils/user";

const stripHtml = (str) => String(str || "").replace(/<br\s*\/?>/gi, " ");

export default function ProductGridEditable({ products = [], category, onItemsChange }) {
  const { t } = useTranslation();
  const [items, setItems] = useState(products || []);
  const [isFollowing, setIsFollowing] = useState(false);
  const { containerRef, trackRef, thumbRef } = useHorizontalScrollbar();
  const [lowestHighestAskingPrice, setLowestHighestAskingPrice] = useState(true);
  const [lowestAmount, setLowestAmount] = useState(true);

  // Camera capture state
  const [cameraModal, setCameraModal] = useState({ open: false, mode: null, itemId: null });
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    setItems(products || []);
  }, [products]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const openCamera = async (mode, itemId) => {
    try {
      // Create a timeout for getUserMedia to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Camera timeout")), 5000)
      );

      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: mode === "video" ? true : false
        }),
        timeoutPromise
      ]);

      mediaStreamRef.current = stream;
      setCameraModal({ open: true, mode, itemId });

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      // In preview/dev mode without camera access, still open modal to show UI
      // Video stream won't work but capture buttons will still function for testing
      setCameraModal({ open: true, mode, itemId });
    }
  };

  // #11: Lúc chụp/quay mới lấy địa chỉ + thời gian để đặt tên file
  const sanitizeForFilename = (s) =>
    (s || "")
      .normalize("NFC")
      .replace(/[/\\?%*:|"<>]/g, " ")
      .replace(/\s+/g, "_")
      .slice(0, 80);

  const getGeoAddress = () =>
    new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=vi`,
              { headers: { Accept: "application/json" } }
            );
            const data = await res.json();
            resolve(data?.display_name || `${latitude},${longitude}`);
          } catch {
            resolve(`${latitude},${longitude}`);
          }
        },
        () => resolve(null),
        { timeout: 8000, enableHighAccuracy: true }
      );
    });

  // Tên file = <địa chỉ>_<thời gian chụp>.<ext>; nếu không lấy được vị trí thì chỉ dùng thời gian
  const buildCaptureFilename = async (ext) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const addr = await getGeoAddress();
    const base = addr ? `${sanitizeForFilename(addr)}_${ts}` : ts;
    return `${base}.${ext}`;
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob(async (blob) => {
        const filename = await buildCaptureFilename("jpg");
        const file = new File([blob], filename, { type: "image/jpeg" });
        handleItemChange(cameraModal.itemId, "image", file);
        closeCamera();
      }, "image/jpeg", 0.95);
    }
  };

  const startRecording = () => {
    if (mediaStreamRef.current) {
      const options = { mimeType: "video/webm;codecs=vp9" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";
      }

      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const filename = await buildCaptureFilename("webm");
        const file = new File([blob], filename, { type: "video/webm" });
        handleItemChange(cameraModal.itemId, "videoFile", file);
        closeCamera();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const closeCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    setCameraModal({ open: false, mode: null, itemId: null });
    setIsRecording(false);
  };

  const handleItemChange = (id, field, value) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(updated);
    if (onItemsChange) onItemsChange(updated);
  };

  const handleAddItem = () => {
    const newItem = {
      id: items.length + 1,
      name: "",
      model: "",
      shape: "",
      size: "",
      color: "",
      image: null,
      videoFile: null,
      qualityInfoFile: null,
      warrantyPolicyFile: null,
      warrantyChangeDays: "",
      warrantyRepairDays: "",
      repairWarrantyRetentionPercent: "",
      maxDeliveryDaysAfterAcceptance: "",
      handoverLocation: "",
      contractDurationMultiplicity: "",
      contractDurationUnit: "",
      invoiceType: "",
      paymentViaPlatform: "",
      timeUserMustPayAfterDelivery: "",
      depositRequirement: "",
      quantityMinimum: "",
      quantityMinRequire: "",
      unit: "",
      unitMarketPrice: "",
      unitAskingPrice: "",
      amountDesired: "",
      autoAcceptPrice: "",
      autoRejectPrice: "",
      autoAcceptPriceLow: "",
      autoRejectPriceLow: "",
    };
    const updated = [...items, newItem];
    setItems(updated);
    if (onItemsChange) onItemsChange(updated);
  };

  return (
    <>
      <div className="overflow-x-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e0 transparent' }}>
        {/* Header columns with horizontal scroll */}
        <div className="grid grid-flow-col auto-cols-[300px] border-gray-300 items-stretch" style={{ gridTemplateColumns: '50px repeat(auto-fit, 300px)' }}>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            {t("productGrid.sequenceNumber")}
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (1) {t("productGrid.nameOfGoods")} <span className="text-red-500">*</span></div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (2) {t("productGrid.model")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (3) {t("productGrid.shape", "HÌNH DẠNG")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (4) {t("productGrid.size")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (5) {t("productGrid.color")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (6) <span dangerouslySetInnerHTML={{ __html: t("productGrid.image") }} /> <span className="text-red-500">*</span>
            </div>
          </div>
          {/* New columns */}
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (7) {t("productGrid.recordingVideo", "QUAY PHIM")} <span className="text-red-500">*</span></div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (8) <span dangerouslySetInnerHTML={{ __html: t("productGrid.qualityInfo") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (9) {t("productGrid.poster_info", "THÔNG TIN NGƯỜI ĐĂNG BÀI")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (10) <span dangerouslySetInnerHTML={{ __html: t("productGrid.warrantyChangeDays") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (11) <span dangerouslySetInnerHTML={{ __html: t("productGrid.warrantyPolicy") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (12) <span dangerouslySetInnerHTML={{ __html: t("productGrid.warrantyRepairDays") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (13) <span dangerouslySetInnerHTML={{ __html: t("productGrid.repairWarrantyPercent") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (14) <span dangerouslySetInnerHTML={{ __html: t("productGrid.maxDeliveryDays") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (15) {t("productGrid.handoverLocation")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          {/* THỜI LƯỢNG THỰC HIỆN split into 2 columns */}
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (16) <span dangerouslySetInnerHTML={{ __html: t("productGrid.contractDuration") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          {/* <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (16) {t("productGrid.timeUnit")}</div>
          </div> */}
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (17) {t("productGrid.invoiceType")} <span className="text-red-500">*</span></div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (18) <span dangerouslySetInnerHTML={{ __html: t("productGrid.paymentViaPlatform") }} />
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (19) <span dangerouslySetInnerHTML={{ __html: t("productGrid.timeUserMustPayAfterDelivery") }} />
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (20) {t("productGrid.depositRequirement")} <span className="text-red-500">*</span></div>
            <div className="text-[10px] text-gray-600 mt-1">Theo Bộ luật Dân sự Điều 328, 329, 330</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            {(category === "SALE" || category === "FOR RENT") && (
              <div> (21) {t("productGrid.quantityMinimum")}{" "}<span className="text-red-500">*</span></div>
            )}
            {(category === "BUY" || category === "RENT") && (
              <div> (21) {t("productGrid.quantitymax")}{" "}<span className="text-red-500">*</span></div>
            )}
            {(category === "PROVIDE SERVICES" || category === "USE SERVICES" || !category) && (
              <>
                <select className="w-full border-r border-b border-gray-300 p-1 text-sm">
                  <option value="1">(21) Số lượng tối đa</option>
                  <option value="2">(21) Số lượng tối thiểu</option>
                </select>
              </>
            )}


          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (22) <span dangerouslySetInnerHTML={{ __html: t("productGrid.quantityMinRequire") }} />
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (23)
              <span>{t("productGrid.unit")}</span>   <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div> (24) <span dangerouslySetInnerHTML={{ __html: t("productGrid.unitMarketPrice") }} />
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            {(category === "SALE" || category === "FOR RENT") && (
              <div> (25) <span dangerouslySetInnerHTML={{ __html: t("productGrid.desiredUnitPriceLow") }} />{" "}<span className="text-red-500">*</span></div>
            )}
            {(category === "BUY" || category === "RENT") && (
              <div> (25) <span dangerouslySetInnerHTML={{ __html: t("productGrid.desiredUnitPriceHigh") }} />{" "}<span className="text-red-500">*</span></div>
            )}
            {(category === "PROVIDE SERVICES" || category === "USE SERVICES" || !category) && (
              <>
                <select className="w-full border-r border-b border-gray-300 p-1 text-sm">
                  <option value="1">(25) Đơn giá thấp nhất</option>
                  <option value="2">(25) Đơn giá cao nhất</option>
                </select>
              </>
            )}
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
          {(category === "SALE" || category === "FOR RENT") && (
              <div> (26) <span dangerouslySetInnerHTML={{ __html: t("productGrid.lowestAmount") }} />{" "}<span className="text-red-500">*</span></div>
            )}
            {(category === "BUY" || category === "RENT") && (
              <div> (26) <span dangerouslySetInnerHTML={{ __html: t("productGrid.highestAmount") }} />{" "}<span className="text-red-500">*</span></div>
            )}
            {(category === "PROVIDE SERVICES" || category === "USE SERVICES" || !category) && (
              <>
                <select className="w-full border-r border-b border-gray-300 p-1 text-sm">
                  <option value="1">(26) Thành tiền thấp nhất</option>
                  <option value="2">(26) Thành tiền cao nhất</option>
                </select>
              </>
            )}
          </div>

          <div className="p-2 text-center border-r border-b border-gray-300 flex flex-col items-center justify-center">
            <div> (27) <span dangerouslySetInnerHTML={{ __html: t("productGrid.totalAmountandvat") }} /></div>
          </div>

          <div className="p-2 text-center border-r border-b border-gray-300 flex flex-col items-center justify-center">
            <div> (30) {t("productGrid.autoAcceptPriceLow", "ĐƠN GIÁ THẤP NHẤT TỰ ĐỘNG DUYỆT CHO SL YÊU CẦU ÍT NHẤT")} <span className="text-red-500">*</span></div>
          </div>

          <div className="p-2 text-center border-r border-b border-gray-300 flex flex-col items-center justify-center">
            <div> (31) {t("productGrid.autoRejectPriceLow", "ĐƠN GIÁ THẤP NHẤT TỰ ĐỘNG TỪ CHỐI CHO SL YÊU CẦU ÍT NHẤT")} <span className="text-red-500">*</span></div>
          </div>
        </div>

        {/* Rows */}
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-flow-col auto-cols-[300px] border-gray-300" style={{ gridTemplateColumns: '50px repeat(auto-fit, 300px)' }}
          >
            <div className="border-r border-b border-gray-300 text-center flex items-center justify-center">
              <div>{item.id}</div>
            </div>
            <input
              type="text"
              value={item.name}
              onChange={(e) =>
                handleItemChange(item.id, "name", e.target.value)
              }
              className="w-full border-r border-b border-gray-300"
            />
            <input
              type="text"
              value={item.model}
              onChange={(e) =>
                handleItemChange(item.id, "model", e.target.value)
              }
              className="w-full border-r border-b border-gray-300"
            />
            <input
              type="text"
              value={item.shape}
              onChange={(e) =>
                handleItemChange(item.id, "shape", e.target.value)
              }
              className="w-full border-r border-b border-gray-300"
            />
            <input
              type="text"
              value={item.size}
              onChange={(e) =>
                handleItemChange(item.id, "size", e.target.value)
              }
              className="w-full border-r border-b border-gray-300"
            />
            <input
              type="text"
              value={item.color}
              onChange={(e) =>
                handleItemChange(item.id, "color", e.target.value)
              }
              className="w-full border-r border-b border-gray-300"
            />
            {/* Col 6: HÌNH ẢNH - Camera capture button */}
            <div className="border-r border-t border-b border-gray-300 p-2 flex items-center justify-center">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => openCamera("photo", item.id)}
                  className="inline-block bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer whitespace-nowrap text-sm"
                >
                  Chụp hình
                </button>
                {item.image && (
                  <div className="text-xs truncate max-w-[120px]" title={item.image.name}>{item.image.name}</div>
                )}
              </div>
            </div>

            {/* Col 7: QUAY PHIM - Video recording button */}
            <div className="border-r border-t border-b border-gray-300 p-2 flex items-center justify-center">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => openCamera("video", item.id)}
                  className="inline-block bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer whitespace-nowrap text-sm"
                >
                  Quay phim
                </button>
                {item.videoFile && (
                  <div className="text-xs truncate max-w-[120px]" title={item.videoFile.name}>{item.videoFile.name}</div>
                )}
              </div>
            </div>
            {/* Col 8: CHẤT LƯỢNG THÔNG TIN */}
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <button
                type="button"
                className="mt-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                {t("productGrid.uploadFile")}
              </button>
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 flex items-center justify-center">
              <div className="flex items-center justify-center gap-2">
                {/* Hide native file input to remove default "No file chosen" text */}
                <input
                  type="file"
                  id={`qualityInfoFile-${item.id}`}
                  onChange={(e) =>
                    handleItemChange(item.id, "qualityInfoFile", e.target.files?.[0] || null)
                  }
                  className="sr-only"
                />
                <label
                  htmlFor={`qualityInfoFile-${item.id}`}
                  className="inline-block bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                >
                  {t("productGrid.uploadFile")}
                </label>
                {item.qualityInfoFile && (
                  <div className="text-xs truncate max-w-[150px]" title={item.qualityInfoFile.name}>{item.qualityInfoFile.name}</div>
                )}
              </div>
            </div>
            {/* <input
              type="number"
              min="0"
              value={item.warrantyChangeDays}
              onChange={(e) =>
                handleItemChange(
                  item.id,
                  "warrantyChangeDays",
                  e.target.value
                )
              }
              className="w-full border-t border-b border-r border-gray-300 text-right"
            /> */}
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="warrantyChangeDays"
                type="number"
                value={item.warrantyChangeDays}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "warrantyChangeDays",
                    e.target.value
                  )
                }
                placeholder={t("goods.enter")}
                unit="ngày"
                isInput={true}
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 flex items-center justify-center">
              <div className="flex items-center justify-center gap-2">
                {/* Hide native file input to remove default "No file chosen" text */}
                <input
                  type="file"
                  id={`warrantyPolicyFile-${item.id}`}
                  onChange={(e) =>
                    handleItemChange(item.id, "warrantyPolicyFile", e.target.files?.[0] || null)
                  }
                  className="sr-only"
                />
                <label
                  htmlFor={`warrantyPolicyFile-${item.id}`}
                  className="inline-block bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                >
                  {t("productGrid.uploadFile")}
                </label>
                {item.warrantyPolicyFile && (
                  <div className="text-xs truncate max-w-[150px]" title={item.warrantyPolicyFile.name}>{item.warrantyPolicyFile.name}</div>
                )}
              </div>
            </div>
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="warrantyRepairDays"
                type="number"
                value={item.warrantyRepairDays}
                onChange={(e) =>
                  handleItemChange(item.id, "warrantyRepairDays", e.target.value)
                }
                placeholder={t("goods.enter")}
                unit="ngày"
                isInput={true}
              />
            </div>
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="repairWarrantyRetentionPercent"
                type="number"
                value={item.repairWarrantyRetentionPercent}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "repairWarrantyRetentionPercent",
                    e.target.value
                  )
                }
                placeholder={t("goods.enter")}
                country={getUserCountry()}
              />
            </div>
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="maxDeliveryDaysAfterAcceptance"
                type="number"
                value={item.maxDeliveryDaysAfterAcceptance}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "maxDeliveryDaysAfterAcceptance",
                    e.target.value
                  )
                }
                placeholder={t("goods.enter")}
                unit="ngày"
                isInput={true}
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <select
                value={item.handoverLocation}
                onChange={(e) =>
                  handleItemChange(item.id, "handoverLocation", e.target.value)
                }
                className="w-full border-gray-300 p-1 mt-1 text-center"
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="Kho bên bán">
                  {t("productGrid.sellerWarehouse")}
                </option>
                <option value="Kho bên mua">
                  {t("productGrid.buyerWarehouse")}
                </option>
              </select>
            </div>
            <select
              value={item.contractDurationMultiplicity}
              onChange={(e) =>
                handleItemChange(
                  item.id,
                  "contractDurationMultiplicity",
                  e.target.value
                )
              }
              className="w-full border-t border-b border-r border-gray-300 text-center"
            >
              <option value="">{t("productGrid.choose")}</option>
              <option value="one-year">{t("productGrid.oneYear")}</option>
              <option value="many-year">{t("productGrid.manyYear")}</option>
              <option value="one-time">{t("productGrid.oneTime")}</option>
              <option value="many-time">{t("productGrid.manyTime")}</option>
            </select>
            {/* <select
              value={item.contractDurationUnit}
              onChange={(e) =>
                handleItemChange(
                  item.id,
                  "contractDurationUnit",
                  e.target.value
                )
              }
              className="w-full border-t border-b border-r border-gray-300 text-center"
            >
              <option value="">{t("productGrid.choose")}</option>
              <option value="time">{t("productGrid.time")}</option>
              <option value="year">{t("productGrid.year")}</option>
            </select> */}

            {/* (17) XUẤT HÓA ĐƠN — chọn 1 mục: VAT hoặc hóa đơn bán hàng (không VAT) */}
            <select
              value={item.invoiceType}
              onChange={(e) =>
                handleItemChange(item.id, "invoiceType", e.target.value)
              }
              className="w-full border-t border-b border-r border-gray-300 text-center"
            >
              <option value="">{t("productGrid.choose")}</option>
              <option value="vat">{t("productGrid.invoiceVat")}</option>
              <option value="no_vat">{t("productGrid.invoiceNoVat")}</option>
            </select>

            {/* (18) THANH TOÁN QUA NỀN TẢNG (Trước khi giao hàng) — nội dung cố định */}
            <div className="w-full border-t border-b border-r border-gray-300 p-2 flex items-center justify-center text-center text-red-600 text-sm">
              Theo điểm b, khoản 6, Điều 14 Luật Thương mại điện tử
            </div>

            {/* (19) THỜI GIAN THANH TOÁN CHÍNH THỨC CHO CHỦ HÀNG SAU KHI NHẬN ĐƯỢC HÀNG */}
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="timeUserMustPayAfterDelivery"
                type="number"
                value={item.timeUserMustPayAfterDelivery}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "timeUserMustPayAfterDelivery",
                    e.target.value
                  )
                }
                placeholder={t("goods.enter")}
                unit="ngày"
                isInput={true}
              />
            </div>

            {/* (20) YÊU CẦU ĐẶT CỌC, KÝ QUỸ (%) */}
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="depositRequirement"
                type="number"
                value={item.depositRequirement}
                onChange={(e) =>
                  handleItemChange(item.id, "depositRequirement", e.target.value)
                }
                placeholder={t("goods.enter")}
                unit="%"
                isInput={true}
              />
            </div>
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <NumberInput
                name="quantityMinimum"
                value={item.quantityMinimum}
                onChange={(e) => handleItemChange(item.id, "quantityMinimum", e.target.value)}
                className="w-full p-3 border-gray-300 text-right"
              />
            </div>
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <NumberInput
                name="quantityMinRequire"
                value={item.quantityMinRequire}
                onChange={(e) => handleItemChange(item.id, "quantityMinRequire", e.target.value)}
                className="w-full p-3 border-gray-300 text-right"
              />
            </div>
            <input
              type="text"
              value={item.unit}
              onChange={(e) =>
                handleItemChange(item.id, "unit", e.target.value)
              }
              className="w-full border-t border-b border-r border-gray-300"
            />

            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="repairWarrantyRetentionPercent"
                type="number"
                value={item.unitMarketPrice}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "unitMarketPrice",
                    e.target.value
                  )
                }
                placeholder={t("goods.enter")}
                country={getUserCountry()}
              />
            </div>

            {/* Col 29: unitAskingPrice */}
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="unitAskingPrice"
                type="number"
                value={item.unitAskingPrice}
                onChange={(e) => handleItemChange(item.id, "unitAskingPrice", e.target.value)}
                placeholder={t("goods.enter")}
                country={getUserCountry()}
              />
            </div>

            {/* Col 30: amountDesired */}
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="amountDesired"
                type="number"
                value={item.amountDesired}
                onChange={(e) => handleItemChange(item.id, "amountDesired", e.target.value)}
                placeholder={t("goods.enter")}
                country={getUserCountry()}
              />
            </div>

            {/* Col 31: totalAmountAndVat — auto-calc, read-only */}
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                type="number"
                value=""
                country={getUserCountry()}
              />
            </div>

            {/* Col 30: autoAcceptPriceLow */}
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="autoAcceptPriceLow"
                type="number"
                value={item.autoAcceptPriceLow}
                onChange={(e) => handleItemChange(item.id, "autoAcceptPriceLow", e.target.value)}
                placeholder={t("goods.enter")}
                country={getUserCountry()}
                isInput={true}
              />
            </div>

            {/* Col 31: autoRejectPriceLow */}
            <div className="w-full border-t border-b border-r border-gray-300 text-right flex items-center">
              <TwoLineUnitInput
                name="autoRejectPriceLow"
                type="number"
                value={item.autoRejectPriceLow}
                onChange={(e) => handleItemChange(item.id, "autoRejectPriceLow", e.target.value)}
                placeholder={t("goods.enter")}
                country={getUserCountry()}
                isInput={true}
              />
            </div>
          </div>
        ))}

        <div className="grid grid-flow-col auto-cols-[300px] border-gray-300" style={{ gridTemplateColumns: '50px repeat(auto-fit, 300px)' }}>
          <div className="border-r border-gray-300 p-2 text-center">
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full text-center font-bold text-blue-500 hover:text-blue-700"
            >
              +
            </button>
          </div>



        </div>
        {/* Always-visible horizontal scrollbar track + moving thumb */}
        {/*<div className="scrollbar-track" aria-hidden="true" ref={trackRef}>*/}
        {/*  <div className="scrollbar-thumb" ref={thumbRef}></div>*/}
        {/*</div>*/}
      </div>

      {/* Camera Modal */}
      {cameraModal.open && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                {cameraModal.mode === "photo" ? "Chụp ảnh" : "Quay video"}
              </h2>
              <button
                type="button"
                onClick={closeCamera}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Video preview */}
            <div className="relative bg-black rounded mb-4 overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Buttons */}
            <div className="flex gap-2">
              {cameraModal.mode === "photo" ? (
                <button
                  type="button"
                  onClick={captureImage}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-medium"
                >
                  Chụp ảnh
                </button>
              ) : (
                <>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-medium"
                    >
                      Bắt đầu quay
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
                    >
                      Dừng quay
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={closeCamera}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-medium"
              >
                Đóng
              </button>
            </div>

            {isRecording && (
              <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Đang quay phim...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
