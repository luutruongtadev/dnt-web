"use client";
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import NumberInput from "./atoms/NumberInput";
import { getAvatarUrl } from "../utils/user";
import { convertD, currencyLabel, formatMoney, getUserCurrency } from "../utils/currency";
import { SCRAP_DURATION, INVOICE_LABEL, emptyScrapItem, estimatedTotal, invoiceTypeForAccount, remainingPayment } from "../utils/scrapSalePost";

// Bảng mục 2 của mẫu đăng bài HÀNG BÁN - HÀNG HÓA - PHẾ LIỆU.
// Sheet "...PHẾ LIỆU 1"  -> THỜI LƯỢNG THỰC HIỆN = 1 LẦN (bán một lần, có tổng thành tiền ước tính)
// Sheet "...PHẾ LI (2)"  -> THỜI LƯỢNG THỰC HIỆN = 1 NĂM (cung cấp hàng tháng theo hợp đồng)

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") || {};
  } catch {
    return {};
  }
};

const pad = (n) => String(n).padStart(2, "0");
const formatStamp = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const cellCls = "border-r border-b border-gray-300";
const inputCls = `w-full ${cellCls} p-2`;

// Ô nhập số D + dòng quy đổi tự động
function MoneyCell({ value, onChange, currency, children }) {
  const code = currency || getUserCurrency().code;
  return (
    <div className={`${cellCls} p-2 flex flex-col justify-center gap-1`}>
      <div className="flex items-center gap-1">
        <NumberInput name="money" value={value} onChange={onChange} className="flex-1 min-w-0 border border-gray-300 p-1 text-right" placeholder="(nhập)" />
        <span className="font-bold">D</span>
      </div>
      {children}
      <div className="text-xs text-gray-600 text-right">
        {currencyLabel(code)} {formatMoney(convertD(value, code), code) || "………"} <span className="italic">(tự động quy đổi)</span>
      </div>
    </div>
  );
}

MoneyCell.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  currency: PropTypes.string,
  children: PropTypes.node,
};

function ComputedMoneyCell({ value }) {
  return (
    <div className={`${cellCls} p-2 flex flex-col justify-center items-end gap-1 bg-gray-50`}>
      <div className="font-bold">{formatMoney(value)} D</div>
      <div className="text-xs text-gray-600">{currencyLabel(getUserCurrency().code)} {formatMoney(convertD(value))}</div>
    </div>
  );
}

ComputedMoneyCell.propTypes = { value: PropTypes.number };

export default function ScrapSaleProductGrid({ products = [], onItemsChange, accountType = "ca_nhan" }) {
  const items = products.length ? products : [emptyScrapItem(1)];
  const duration = items[0]?.contractDurationMultiplicity || SCRAP_DURATION.ONE_TIME;
  const isYearly = duration === SCRAP_DURATION.ONE_YEAR;
  const invoiceType = invoiceTypeForAccount(accountType);
  // ĐƠN GIÁ MONG MUỐN: chọn 1 trong 2 đồng tiền — tiền tệ của quốc gia đăng ký hoặc USD (cố định)
  const userCurrency = getUserCurrency().code;
  const askingCurrencies = userCurrency === "USD" ? ["USD"] : [userCurrency, "USD"];

  const [cameraModal, setCameraModal] = useState({ open: false, mode: null, itemId: null });
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const drawLoopRef = useRef(null);
  const overlayRef = useRef({ address: "", avatar: null, name: "", withIdentity: true });

  // Hóa đơn luôn đồng bộ theo loại tài khoản
  useEffect(() => {
    if (items.some((it) => it.invoiceType !== invoiceType)) {
      onItemsChange(items.map((it) => ({ ...it, invoiceType })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceType, items.length]);

  useEffect(() => () => stopStream(), []);

  const updateItem = (id, field, value) => {
    onItemsChange(items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  // Thời lượng thực hiện quyết định bố cục bảng nên áp dụng cho mọi dòng
  const changeDuration = (value) => {
    onItemsChange(items.map((it) => ({ ...it, contractDurationMultiplicity: value })));
  };

  const addItem = () => {
    onItemsChange([...items, { ...emptyScrapItem(items.length + 1, duration), invoiceType }]);
  };

  // ---------- Chụp hình / quay phim trực tiếp, đóng dấu thông tin lên khung hình ----------
  const getGeoAddress = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve("");
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=vi`,
              { headers: { Accept: "application/json" } }
            );
            const data = await res.json();
            resolve(data?.display_name || `${coords.latitude}, ${coords.longitude}`);
          } catch {
            resolve(`${coords.latitude}, ${coords.longitude}`);
          }
        },
        () => resolve(""),
        { timeout: 8000, enableHighAccuracy: true }
      );
    });

  const loadAvatar = () =>
    new Promise((resolve) => {
      const url = getAvatarUrl(readUser().avt);
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const openCamera = async (mode, itemId) => {
    const item = items.find((it) => it.id === itemId);
    // Mẫu 1 LẦN: hiện Avatar người đăng + tên hàng hóa (1) + thời gian + địa điểm; mẫu 1 NĂM: chỉ thời gian + địa điểm
    overlayRef.current = { address: "", avatar: null, name: item?.name || "", withIdentity: !isYearly };
    getGeoAddress().then((address) => { overlayRef.current.address = address; });
    if (!isYearly) loadAvatar().then((avatar) => { overlayRef.current.avatar = avatar; });

    setCameraModal({ open: true, mode, itemId });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: mode === "video" });
      mediaStreamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const drawFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return false;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    const { address, avatar, name, withIdentity } = overlayRef.current;
    const font = Math.max(14, Math.round(h / 28));
    const lines = [withIdentity && name ? name : null, formatStamp(new Date()), address || null].filter(Boolean);
    const bandH = lines.length * font * 1.3 + font;
    const avatarSize = withIdentity && avatar ? bandH - font * 0.6 : 0;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, h - bandH, w, bandH);
    if (avatarSize) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(font * 0.5 + avatarSize / 2, h - bandH / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, font * 0.5, h - bandH / 2 - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
    }
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${font}px sans-serif`;
    ctx.textBaseline = "top";
    const textX = font * 0.5 + (avatarSize ? avatarSize + font * 0.5 : 0);
    lines.forEach((line, i) => ctx.fillText(line, textX, h - bandH + font * 0.5 + i * font * 1.3, w - textX - font * 0.5));
    return true;
  };

  const buildFilename = (ext) => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}.${ext}`;
  };

  const captureImage = () => {
    if (!drawFrame()) return;
    const { itemId } = cameraModal;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      updateItem(itemId, "image", new File([blob], buildFilename("jpg"), { type: "image/jpeg" }));
      closeCamera();
    }, "image/jpeg", 0.95);
  };

  const startRecording = () => {
    if (!mediaStreamRef.current || !canvasRef.current) return;
    const loop = () => {
      drawFrame();
      drawLoopRef.current = requestAnimationFrame(loop);
    };
    loop();
    // Ghi lại khung hình đã đóng dấu + âm thanh gốc
    const stream = canvasRef.current.captureStream(30);
    mediaStreamRef.current.getAudioTracks().forEach((track) => stream.addTrack(track));
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    const { itemId } = cameraModal;
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      cancelAnimationFrame(drawLoopRef.current);
      const blob = new Blob(chunks, { type: "video/webm" });
      updateItem(itemId, "videoFile", new File([blob], buildFilename("webm"), { type: "video/webm" }));
      closeCamera();
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  function stopStream() {
    cancelAnimationFrame(drawLoopRef.current);
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  const closeCamera = () => {
    stopStream();
    mediaRecorderRef.current = null;
    setCameraModal({ open: false, mode: null, itemId: null });
    setIsRecording(false);
  };

  // ---------- Cột của bảng ----------
  const textCell = (field) => function TextCell(item) {
    return (
    <input type="text" value={item[field] || ""} onChange={(e) => updateItem(item.id, field, e.target.value)} className={inputCls} placeholder="(nhập)" />
    );
  };
  const numberCell = (field) => function NumberCell(item) {
    return (
    <div className={`${cellCls} flex items-center`}>
      <NumberInput name={field} value={item[field]} onChange={(e) => updateItem(item.id, field, e.target.value)} className="w-full p-2 text-right" placeholder="(nhập)" />
    </div>
    );
  };
  const moneyCell = (field) => function MoneyField(item) {
    return <MoneyCell value={item[field]} onChange={(e) => updateItem(item.id, field, e.target.value)} />;
  };
  const captureCell = (mode, field, label) => function CaptureCell(item) {
    return (
    <div className={`${cellCls} p-2 flex flex-col items-center justify-center gap-1`}>
      <button type="button" onClick={() => openCamera(mode, item.id)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm whitespace-nowrap">
        {label}
      </button>
      {item[field] && <div className="text-xs truncate max-w-[260px]" title={item[field].name}>{item[field].name}</div>}
    </div>
    );
  };

  const columns = [
    { header: "TÊN PHẾ LIỆU", required: true, render: textCell("name") },
    { header: "MÃ SỐ", render: textCell("model") },
    { header: "HÌNH DẠNG", render: textCell("shape") },
    { header: "KÍCH THƯỚC", render: textCell("size") },
    { header: "MÀU SẮC", render: textCell("color") },
    {
      header: "HÌNH ẢNH",
      required: true,
      note: isYearly ? "Chụp trực tiếp trên Nền tảng, hiển thị thời gian, địa điểm" : "Chụp trực tiếp trên Nền tảng, hiển thị Avatar người đăng, tên hàng hóa (1), thời gian, địa điểm",
      render: captureCell("photo", "image", "Chụp hình"),
    },
    {
      header: "QUAY PHIM",
      required: true,
      note: isYearly ? "Quay trực tiếp trên Nền tảng, hiển thị thời gian, địa điểm" : "Quay trực tiếp trên Nền tảng, hiển thị Avatar người đăng, tên hàng hóa (1), thời gian, địa điểm",
      render: captureCell("video", "videoFile", "Quay phim"),
    },
    {
      header: "CHẤT LƯỢNG, THÔNG TIN HÀNG HÓA",
      required: true,
      render: (item) => (
        <div className={`${cellCls} p-2 flex flex-col gap-1`}>
          <textarea value={item.qualityInfoText || ""} onChange={(e) => updateItem(item.id, "qualityInfoText", e.target.value)} rows={2} className="w-full border border-gray-300 p-1 text-sm" placeholder="(nhập)" />
          <div className="flex items-center gap-2">
            <input type="file" id={`scrapQualityFile-${item.id}`} className="sr-only" onChange={(e) => updateItem(item.id, "qualityInfoFile", e.target.files?.[0] || null)} />
            <label htmlFor={`scrapQualityFile-${item.id}`} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer text-sm whitespace-nowrap">Tải lên</label>
            {item.qualityInfoFile && <span className="text-xs truncate" title={item.qualityInfoFile.name}>{item.qualityInfoFile.name}</span>}
          </div>
        </div>
      ),
    },
    {
      header: "THỜI LƯỢNG THỰC HIỆN",
      required: true,
      render: () => (
        <select value={duration} onChange={(e) => changeDuration(e.target.value)} className={`${inputCls} text-center font-bold`}>
          <option value={SCRAP_DURATION.ONE_TIME}>1 LẦN</option>
          <option value={SCRAP_DURATION.ONE_YEAR}>1 NĂM</option>
        </select>
      ),
    },
    {
      header: isYearly ? "THỜI GIAN NHIỀU NHẤT ĐỂ GIAO NHẬN HÀNG LẦN ĐẦU SAU KHI CHẤP NHẬN" : "THỜI GIAN NHIỀU NHẤT ĐỂ GIAO NHẬN HÀNG SAU KHI CHẤP NHẬN",
      required: true,
      render: (item) => (
        <div className={`${cellCls} flex items-center`}>
          <NumberInput name="maxDeliveryDaysAfterAcceptance" value={item.maxDeliveryDaysAfterAcceptance} onChange={(e) => updateItem(item.id, "maxDeliveryDaysAfterAcceptance", e.target.value)} className="w-full p-2 text-right" placeholder="(nhập)" />
          <span className="px-2 font-bold">NGÀY</span>
        </div>
      ),
    },
    { header: "ĐỊA ĐIỂM GIAO HÀNG", required: true, render: () => <div className={`${cellCls} p-2 flex items-center justify-center font-bold`}>KHO NGƯỜI BÁN</div> },
    { header: "XUẤT HÓA ĐƠN", required: true, render: () => <div className={`${cellCls} p-2 flex items-center justify-center font-bold`}>{INVOICE_LABEL[invoiceType]}</div> },
    ...(isYearly
      ? [
          { header: "SỐ LƯỢNG TỒN KHO", required: true, render: numberCell("quantityStock") },
          { header: "SỐ LƯỢNG HÀNG THÁNG", required: true, render: numberCell("quantityMonthly") },
        ]
      : [{ header: "SỐ LƯỢNG ƯỚC LƯỢNG", required: true, render: numberCell("quantityEstimated") }]),
    { header: "ĐƠN VỊ TÍNH", required: true, render: textCell("unit") },
    { header: "ĐƠN GIÁ THỊ TRƯỜNG ĐÃ BAO GỒM TIỀN THUẾ", render: moneyCell("unitMarketPrice") },
    {
      header: "ĐƠN GIÁ MONG MUỐN ĐÃ BAO GỒM TIỀN THUẾ",
      required: true,
      render: (item) => (
        <MoneyCell value={item.unitAskingPrice} onChange={(e) => updateItem(item.id, "unitAskingPrice", e.target.value)} currency={item.askingCurrency || userCurrency}>
          <div className="flex items-center justify-end gap-3 text-xs">
            {askingCurrencies.map((cur) => (
              <label key={cur} className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name={`askingCurrency-${item.id}`} checked={(item.askingCurrency || userCurrency) === cur} onChange={() => updateItem(item.id, "askingCurrency", cur)} />
                {currencyLabel(cur)}
              </label>
            ))}
          </div>
        </MoneyCell>
      ),
    },
    ...(isYearly
      ? [{ header: "YÊU CẦU ĐẶT CỌC, KÝ QUỸ CHO HỢP ĐỒNG", required: true, render: moneyCell("depositRequirement") }]
      : [
          { header: "TỔNG THÀNH TIỀN ƯỚC TÍNH", render: (item) => <ComputedMoneyCell value={estimatedTotal(item)} /> },
          { header: "YÊU CẦU ĐẶT CỌC, KÝ QUỸ", required: true, render: moneyCell("depositRequirement") },
          { header: "TỔNG THÀNH TIỀN ƯỚC TÍNH CÒN LẠI CẦN THANH TOÁN", required: true, render: (item) => <ComputedMoneyCell value={remainingPayment(item)} /> },
        ]),
    {
      header: "GHI CHÚ VỀ HÀNG HÓA, GIAO NHẬN, PHƯƠNG TIỆN VẬN CHUYỂN, VÀ KHÁC",
      render: (item) => (
        <textarea value={item.note || ""} onChange={(e) => updateItem(item.id, "note", e.target.value)} className={`${inputCls} text-sm`} placeholder="(nhập)" />
      ),
    },
    { header: "TỪ ĐƠN GIÁ NÀY TRỞ LÊN SẼ TỰ ĐỘNG DUYỆT ĐỒNG Ý", render: moneyCell("autoAcceptPrice") },
    { header: "TỪ ĐƠN GIÁ NÀY TRỞ XUỐNG SẼ TỰ ĐỘNG TỪ CHỐI", render: moneyCell("autoRejectPrice") },
  ];

  const gridStyle = { gridTemplateColumns: `50px repeat(${columns.length}, 260px)` };

  return (
    <>
      <div className="overflow-x-scroll" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e0 transparent" }}>
        <div className="grid items-stretch" style={gridStyle}>
          <div className={`${cellCls} p-2 text-center flex items-center justify-center font-bold`}>STT</div>
          {columns.map((col, idx) => (
            <div key={col.header} className={`${cellCls} p-2 text-center flex flex-col items-center justify-center font-bold text-sm`}>
              <div>
                ({idx + 1}) {col.header} {col.required && <span className="text-red-500">*</span>}
              </div>
              {col.note && <div className="text-[10px] font-normal text-gray-600 mt-1">({col.note})</div>}
            </div>
          ))}
        </div>

        {items.map((item) => (
          <div key={item.id} className="grid items-stretch" style={gridStyle}>
            <div className={`${cellCls} flex items-center justify-center`}>{item.id}</div>
            {columns.map((col) => (
              <React.Fragment key={col.header}>{col.render(item)}</React.Fragment>
            ))}
          </div>
        ))}

        <div className="grid" style={gridStyle}>
          <button type="button" onClick={addItem} className={`${cellCls} p-2 font-bold text-blue-500 hover:text-blue-700`}>+</button>
        </div>
      </div>

      {cameraModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{cameraModal.mode === "photo" ? "Chụp ảnh" : "Quay video"}</h2>
              <button type="button" onClick={closeCamera} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="relative bg-black rounded mb-4 overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-2">
                {!isYearly && <div className="font-bold">{items.find((it) => it.id === cameraModal.itemId)?.name || "(tên hàng hóa)"}</div>}
                <div>Thời gian, địa điểm sẽ được đóng dấu lên {cameraModal.mode === "photo" ? "ảnh" : "video"}</div>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              {cameraModal.mode === "photo" ? (
                <button type="button" onClick={captureImage} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-medium">Chụp ảnh</button>
              ) : !isRecording ? (
                <button type="button" onClick={startRecording} className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-medium">Bắt đầu quay</button>
              ) : (
                <button type="button" onClick={stopRecording} className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium">Dừng quay</button>
              )}
              <button type="button" onClick={closeCamera} className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-medium">Đóng</button>
            </div>
            {isRecording && (
              <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Đang quay phim...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

ScrapSaleProductGrid.propTypes = {
  products: PropTypes.array,
  onItemsChange: PropTypes.func.isRequired,
  accountType: PropTypes.string,
};
