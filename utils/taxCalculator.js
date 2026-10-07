/**
 * Tính % thuế VAT + TNCN dựa trên loại tài khoản + loại giao dịch
 * Theo PHẦN 1 mục 14 của yêu cầu
 */

export const calculateTaxPercent = (accountType, transactionType, categoryType) => {
  // Tài khoản doanh nghiệp (tự xuất HĐ VAT) → 0%
  if (accountType === "doanh_nghiep") {
    return 0;
  }

  // Tài khoản cá nhân / hộ kinh doanh (nền tảng xuất HĐ bán hàng, không VAT)
  if (accountType === "ca_nhan" || accountType === "ho_kinh_doanh") {
    // 1.5% → HÀNG BÁN (SALE), CẦN MUA (BUY)
    if (transactionType === "SALE" || transactionType === "BUY") {
      return 1.5;
    }

    // 7% → CẦN THUÊ / CHO THUÊ / CUNG CẤP DỊCH VỤ / CẦN DỊCH VỤ + hàng hóa / phương tiện / nhân lực / xuất nhập khẩu
    if (
      (transactionType === "RENT" || transactionType === "FOR RENT" || transactionType === "PROVIDE SERVICES" || transactionType === "USE SERVICES") &&
      (categoryType === "GOODS" || categoryType === "VEHICLE" || categoryType === "MANPOWER" || categoryType === "IMPORT - EXPORT")
    ) {
      return 7;
    }

    // 7% → CẦN THUÊ / CHO THUÊ + BĐS (tính theo ngày): khách sạn…
    // Note: Không thể xác định "ngày" vs "tháng/năm" từ code hiện tại
    // Mặc định 7% cho BĐS (LAND AND HOUSE) nếu là RENT/FOR RENT và không phải dịch vụ
    if ((transactionType === "RENT" || transactionType === "FOR RENT") && categoryType === "LAND AND HOUSE") {
      // Cần thêm logic phân biệt ngày vs tháng/năm từ contractDurationUnit
      // Tạm default 7% cho "ngày"
      return 7;
    }

    // 10% → CẦN THUÊ / CHO THUÊ + BĐS (tính theo tháng/năm): căn hộ, nhà cửa
    // Có thể set này khi contractDurationUnit = "month" hoặc "year"
    // Tạm implement: nếu muốn 10%, phải update từ 7% khi duration = month/year
  }

  // Default 0% nếu không rõ
  return 0;
};

/**
 * Utility để kiểm tra xem tax % có cần nhập bắt buộc không
 * (khi là cá nhân/hộ KD)
 */
export const isTaxRequired = (accountType) => {
  return accountType === "ca_nhan" || accountType === "ho_kinh_doanh";
};
