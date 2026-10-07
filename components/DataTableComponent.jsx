"use client";
import { useTranslation } from 'react-i18next'
import { useSystemInfos } from "../custom-hooks/useSystemInfos"


const DataTableComponent = () => {
  const { t } = useTranslation()
  const { infos: metric } = useSystemInfos()

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    <div
      className="flex flex-col text-sm text-left h-full w-full border border-black"
      style={{ fontSize: "clamp(6px, 0.75vw, 14px)" }}
    >
      {/* Row 1 */}
      <div className="flex border-b border-black">
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.listedValue", "GIÁ TRỊ LÊN SÀN")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1 border-r border-black">
          <strong>{formatNumber(metric.listedValue)} <span style={{color:'#1d4ed8'}}>D</span></strong>
        </div>
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.transactions", "LƯỢT GIAO DỊCH")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1 border-r border-black">
          <strong>{formatNumber(metric.transactions)}</strong>
        </div>
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.accesses", "LƯỢT TRUY CẬP")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1">
          <strong>{formatNumber(metric.accesses)}</strong>
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex border-b border-black">
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.successfully", "THÀNH CÔNG")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1 border-r border-black">
          <strong>{formatNumber(metric.successfully)} <span style={{color:'#1d4ed8'}}>D</span></strong>
        </div>
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.amount", "SỐ TIỀN")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1 border-r border-black">
          <strong>{formatNumber(metric.amount)} <span style={{color:'#1d4ed8'}}>D</span></strong>
        </div>
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.duration", "THỜI LƯỢNG")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1">
          <strong><span style={{color:'#1d4ed8'}}>1</span>x<span style={{color:'#dc2626'}}>10</span><sup style={{color:'#1d4ed8'}}>14</sup> S</strong>
        </div>
      </div>

      {/* Row 3 */}
      <div className="flex border-b border-black">
        <div
          className="flex items-center justify-center font-bold py-1 px-1 border-r border-black"
          style={{ flex: "0 0 33.37%" }}
        >
          {t("metrics.bankUpdate", "NGÂN HÀNG CẬP NHẬT")}:
        </div>

        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.deposited", "ĐÃ GỬI")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1 border-r border-black">
          <strong>{formatNumber(metric.deposited)} <span style={{color:'#1d4ed8'}}>D</span></strong>
        </div>
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.videoViews", "LƯỢT XEM VIDEO")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1">
          <strong>{formatNumber(metric.videoViews)}</strong>
        </div>
      </div>

      {/* Row 4 */}
      <div className="flex border-b border-black">
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.withTerm", "CÓ KỲ HẠN")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1 border-r border-black">
          {t("metrics.update", "CẬP NHẬT")}:
        </div>
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.withdrawn", "ĐÃ RÚT")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1 border-r border-black">
          <strong>{formatNumber(metric.withdrawn)} <span style={{color:'#1d4ed8'}}>D</span></strong>
        </div>
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.members", "THÀNH VIÊN")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1">
          <strong>{formatNumber(metric.members)}</strong>
        </div>
      </div>

      {/* Row 5 */}
      <div className="flex">
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.withoutTerm", "KHÔNG KỲ HẠN")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1 border-r border-black">
          {t("metrics.update", "CẬP NHẬT")}:
        </div>
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.remaining", "CÒN LẠI")}:
        </div>
        <div className="flex-2 flex items-center justify-end py-1 px-1 border-r border-black">
          <strong>{formatNumber(metric.remaining)} <span style={{color:'#1d4ed8'}}>D</span></strong>
        </div>
        <div className="table-cell flex items-center font-bold py-1 px-1 border-r border-black">
          {t("metrics.online", "ĐANG TRUY CẬP")}:
        </div>
        <div className="flex-2 flex items-center justify-between py-1 px-1">
          <div className="flex-1 text-right"><strong>{formatNumber(metric.online)}</strong></div>
        </div>
      </div>
    </div>

  );
};

export default DataTableComponent;
