"use client";
import { useEffect, useRef } from "react"
import PropTypes from "prop-types"
import QRCode from "qrcode"
import { Download } from "lucide-react"

// Component QR dùng chung cho toàn app (QR đăng nhập ở header, QR kết bạn/nhóm...).
// Nhận `dataUrl` (ảnh QR đã có sẵn, vd server trả về data:image/png;base64 cho QR
// đăng nhập) HOẶC `payload` (object sẽ được encode thành QR ngay trên client, vd QR
// kết bạn). Dữ liệu mã hoá của mỗi luồng vẫn tách biệt — chỉ dùng chung UI hiển thị/tải ảnh.
export default function QrCodeDisplay({ dataUrl, payload, size, label, downloadFileName, showDownload, className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (dataUrl || !payload || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, JSON.stringify(payload), { width: size, margin: 1 }, (err) => {
      if (err) console.error("Error rendering QR code:", err)
    })
  }, [dataUrl, payload, size])

  const hasQr = Boolean(dataUrl || payload)

  const handleDownload = () => {
    const href = dataUrl || canvasRef.current?.toDataURL("image/png")
    if (!href) return
    const link = document.createElement("a")
    link.download = downloadFileName
    link.href = href
    link.click()
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {label && <p className="text-sm text-gray-600 mb-3 text-center">{label}</p>}
      {!hasQr ? (
        <p className="text-sm text-red-500 py-8">Không thể tạo mã QR — thiếu thông tin.</p>
      ) : dataUrl ? (
        <img src={dataUrl} alt="QR Code" width={size} height={size} className="object-contain border rounded" />
      ) : (
        <canvas ref={canvasRef} width={size} height={size} className="border rounded" />
      )}
      {showDownload && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={!hasQr}
          className="flex items-center gap-2 px-4 py-2 mt-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Tải ảnh QR
        </button>
      )}
    </div>
  )
}

QrCodeDisplay.propTypes = {
  dataUrl: PropTypes.string,
  payload: PropTypes.object,
  size: PropTypes.number,
  label: PropTypes.string,
  downloadFileName: PropTypes.string,
  showDownload: PropTypes.bool,
  className: PropTypes.string,
}

QrCodeDisplay.defaultProps = {
  dataUrl: null,
  payload: null,
  size: 220,
  label: "",
  downloadFileName: "my-qr.png",
  showDownload: true,
  className: "",
}
