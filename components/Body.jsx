"use client";
import React, {useState, useEffect, useRef} from "react";
import {Link, useNavigate} from '@/lib/router-compat';
import {useDispatch, useSelector} from "react-redux";
import {getMetric} from "../services/metricService";
import EventFilterComponent from "./EventFilterComponent";

import {logoutAction} from "../context/action/authActions";

import Select from "react-select";
import {
    getCountries,
    getCountryByCode,
    getDistrictByCode,
} from "../services/countries";
import {useTranslation} from "react-i18next";
import {KeyboardIcon} from "lucide-react";
import {uploadImageToCloudinary} from "../services/cloudinary";
import {updateAvatar} from "../services/authService";
import AdaptiveText from "./AdaptiveText";

function HeroHeader({
                        selectedLang,
                        isCompact = false,
                        ismobile = false,
                        userCountry,
                    }) {
    const {t} = useTranslation();
    const nation = useSelector((state) => state.filter.nation);
    const isLoggedIn =
        localStorage.getItem("authToken") !== null &&
        localStorage.getItem("authToken") !== "";

    // Adjust font sizes based on compact mode
    let titleFontSize = isCompact ? "1.6vw" : "3.2vw";
    if (ismobile) {
        titleFontSize = "2.8vw";
    }
    let subtitleFontSize = isCompact ? "1.5vw" : "2.2vw";
    if (ismobile) {
        subtitleFontSize = "2.5vw";
    }

    let secondaryFontSize = isCompact ? "1.3vw" : "2vw";
    if (ismobile) {
        secondaryFontSize = "2.5vw";
    }
    const marginBottom = isCompact ? "2vw" : "-1.5vw";
    const marginTop = isCompact ? "1vw" : "-6vh";

    const text = t("navigation.freelancer", "CÔNG VIỆC TỰ DO");
    const charCount = text.length;

    const baseFontSize = Math.max(10, Math.min(30, 33.5 - charCount));

    const textPayment = t("navigation.paymentTransaction", "THANH TOÁN");
    const charCountPayment = textPayment.length;

    const baseFontSizePayment = Math.max(10, Math.min(50, 49 - (8 / 3.2) * charCountPayment));

    return (
        <>
            <div style={{position: "relative", marginBottom: "5px"}}>
                <div
                    className="hero-title flex"
                    style={{
                        fontWeight: "bold",
                        flexDirection: "row",
                        alignContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div
                        className="flex-1 flex items-center justify-end"
                        style={{marginTop: "clamp(18px,2.7vw, 45px)"}}
                    >
                        <Link
                            to={"new-post"}
                            className="main-aside-2-1 border w-[15vw] sm:w-[9vw] flex justify-center items-center"
                            style={{
                                fontSize: "clamp(7px, 1.7vw, 22px)",
                                marginLeft: "auto",
                            }}
                        >
                            <div
                                className="flex items-center justify-center w-full"
                                style={{
                                    color: "black",
                                    textAlign: "center",
                                    height: "clamp(18px,3vw, 45px)",
                                }}
                            >
                                <AdaptiveText text={t("navigation.newPost", "ĐĂNG BÀI MỚI")} />
                            </div>
                        </Link>
                    </div>
                    <div
                        className="flex-2 flex"
                        style={{
                            justifyContent: "flex-start",
                            alignContent: "center",
                            alignItems: "center",
                            flexDirection: "column",
                        }}
                    >
                        <h3
                            style={{
                                color: "blue",
                                fontSize: titleFontSize,
                                width: "100%",
                                textAlign: "center",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {t("hero.mainTitle", "CÔNG BẰNG LỚN - UY TÍN LỚN")}
                        </h3>
                    </div>
                    <div
                        className="flex-1"
                        style={{marginTop: "clamp(18px,2.7vw, 45px)"}}
                    >
                        <Link
                            to={"ai-live"}
                            className="main-aside-2-1 border w-[15vw] sm:w-[9vw] flex items-center justify-center hove"
                            style={{fontSize: "clamp(7px, 2.9vw, 40px)"}}
                        >
                            <div
                                className="flex items-center justify-center w-full"
                                style={{
                                    color: "black",
                                    textAlign: "center",
                                    height: "clamp(18px,3vw, 45px)",
                                }}
                            >
                                <AdaptiveText text={t("navigation.aiLive", "Ai LIVE")} add={0.2} />
                            </div>
                        </Link>
                    </div>
                </div>
                <div
                    className="hero-subtitle"
                    style={{
                        border: 0,
                        marginTop: "-1vh",
                        alignSelf: "center",
                        fontWeight: "bold",
                        position: "relative",
                        fontSize: secondaryFontSize,
                        width: "100%",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                    }}
                >
                    <h3 style={{color: "blue"}}>
                        {t(
                            "hero.subtitle",
                            "MỤC TIÊU: CÔNG CỤ THƯƠNG MẠI CỦA MỖI QUỐC GIA"
                        )}
                    </h3>
                    {/* Buttons positioned relative to the subtitle */}
                </div>
                <aside className="main-aside-2">
                    <Link
                        to={"freelancer"}
                        className="border-1 main-aside-2-2 border w-[18vw] sm:w-[12vw] right-[1vw] sm:right-[2vw] cursor-pointer border"
                        style={{
                            right: "66%",
                            position: "absolute",
                            bottom: "-2vw",
                            height: "clamp(18px, 3.2vw, 45px)",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "black",
                            }}
                        >
                            <AdaptiveText text={text} />
                        </div>
                    </Link>

          <Link
            to={"payment"}
            className=" cursor-pointer main-aside-2-2 border w-[18vw] sm:w-[12vw] right-[1vw] sm:right-[2vw] flex items-center justify-center"
            style={{
              position: "absolute",
              bottom: "-2vw",
              left: "66%",
              height: "clamp(18px,3.2vw, 45px)",
            }}
          >
            <div
              className="flex items-center justify-center w-full"
              style={{
                color: "black",
                textAlign: "center",
                height: "clamp(20px,4vw, 60px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <AdaptiveText text={textPayment} />
            </div>
          </Link>
        </aside>
      </div>
    </>
  );
}

const DropdownAuth = () => {
    const [isShow, setIsShow] = useState(false);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const dispatch = useDispatch();
    const auth = useSelector((state) => state.auth);

    const [previewImage, setPreviewImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const {t} = useTranslation();

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Image size should be less than 5MB");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload to server
        await uploadAvatar(file);
    };

    const uploadAvatar = async (file) => {
        try {
            setUploading(true);
            const token = localStorage.getItem("authToken");

            const formData = new FormData();
            formData.append("avatar", file);
            const rs = await uploadImageToCloudinary(file);
            console.log(rs);

            const response = await updateAvatar(rs);
            console.log(response, response.data);
            // const response = await axios.post(
            //     `${API_URL}/auth/upload-avatar`,
            //     formData,
            //     {
            //         headers: {
            //             Authorization: `Bearer ${token}`,
            //             'Content-Type': 'multipart/form-data',
            //         },
            //     }
            // );

            // Update auth context with new avatar
            // auth.updateUser({ avt: response.data.avatar });

            alert("Avatar updated successfully!");
        } catch (error) {
            console.error("Avatar upload error:", error);
            alert(error.response?.data?.message || "Failed to upload avatar");
        } finally {
            setUploading(false);
        }
    };

    const DEFAULT_AVT =
        "https://th.bing.com/th/id/OIP.aqzvZTh44zgk38UdpdE1KQHaHa?rs=1&pid=ImgDetMain";
    // const [password, setPassword] = useState(null);
    useEffect(() => {
        const storedUser = localStorage.getItem("authToken");
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    return (
        <div className="auth-dropdown"
            style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "18vw",
                position: "absolute",
                top: "clamp(11rem, 14vw, 50rem)",
                left: "0",
                zIndex: 1000,
                marginTop: !user
                    ? "clamp(0rem, -5rem + 5vw, 0rem)" // khi chưa login
                    : "clamp(-1vw, 21vw, -50rem)", // khi đã login
            }}
        >
            {!user ? (
                <button
                    className="cursor-pointer"
                    onClick={() => {
                        navigate("login");
                    }}
                    style={{
                        fontSize: "clamp(10px, 1.2vw, 20px)",
                        fontWeight: "bold",
                        cursor: "pointer",
                        border: "1px solid black",
                        padding: "0.4vw",
                        marginBottom: "1vw",
                        width: "100%",
                        height: "clamp(30px, 4vw, 50px)",
                        boxSizing: "border-box",
                    }}
                >
                    {t("navigation.login", "ĐĂNG NHẬP")}
                </button>
            ) : null}
            {user ? (
                <div
                    className="flex items-center justify-center"
                    style={{
                        cursor: "pointer",
                        border: "1px solid black",
                        padding: "2px",
                        marginBottom: "0.4vw",
                        width: "100%",
                        height: "clamp(30px, 4vw, 50px)",
                        boxSizing: "border-box",
                    }}
                    onClick={() => navigate("/admin-control")}
                >
                    <button className="text-red-600 hover:text-red-800 flex items-center justify-center w-full h-full">
                        <KeyboardIcon
                            style={{cursor: "pointer"}}
                            className="h-full w-auto"
                        />
                    </button>
                </div>
            ) : (
                ""
            )}
            {!user ? (
                <button
                    className="cursor-pointer"
                    onClick={() => {
                        navigate("register");
                    }}
                    style={{
                        fontSize: "clamp(10px, 1.2vw, 20px)",
                        fontWeight: "bold",
                        cursor: "pointer",
                        border: "1px solid black",
                        padding: "0.4vw",
                        width: "100%",
                        height: "clamp(30px, 4vw, 50px)",
                        boxSizing: "border-box",
                    }}
                >
                    {t("navigation.register", "ĐĂNG KÝ")}
                </button>
            ) : (
                <button
                    onClick={() => {
                        localStorage.removeItem("authToken"); // Xóa token khỏi localStorage
                        localStorage.removeItem("user"); // Xóa user data khỏi localStorage
                        setUser(null); // Đặt lại trạng thái người dùng
                        dispatch(logoutAction());
                        window.location.reload();
                    }}
                    style={{
                        fontSize: "clamp(10px, 1.2vw, 20px)",
                        fontWeight: "bold",
                        background: "none",
                        cursor: "pointer",
                        border: "1px solid black",
                        padding: "0.4vw",
                        width: "100%",
                        height: "clamp(30px, 4vw, 50px)",
                        boxSizing: "border-box",
                    }}
                >
                    {t("navigation.logout", "THOÁT")}
                </button>
            )}
        </div>
    );
};

const Body = () => {
    return (
        <>
            <main className="main-grid-container" style={{marginBottom: 50}}>
                {/* <aside className="main-aside-1"> */}
                {/* <div>
                        <div>
                            <p><strong>DANG KY</strong><em>(REGISTER)</em></p> <p><strong>ID</strong></p>
                        </div>
                        <div>
                            <p><strong>DANG NHAP</strong><em>(LOGIN)</em></p> <p><strong>THOAT</strong><em>(LOGOUT)</em></p>
                        </div> 
                    </div>
                    <div>
                        <div>
                            <p><strong>DANG BAI MOI</strong><em>(NEW POST)</em></p> 
                        </div>
                        <div>
                            <p><strong>CHAT</strong></p><p><strong>19002139</strong></p> 
                        </div> 
                    </div> */}
                {/* </aside> */}

                <section
                    className="main-section-2"
                    // style={{
                    //     maxWidth: 800
                    // }}
                >
                    <div className="main-section-info-1">
                        <div style={{width: "100%"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>
                                    {t("metrics.listedValue", "TỔNG GIÁ TRỊ TÀI SẢN ĐÃ LÊN SÀN")}
                                </strong>
                            </p>
                        </div>
                        <div>
                            <p>123456789</p>
                            <p>
                                <strong>({t("payment.command", "LỆNH")})</strong>
                            </p>
                        </div>
                    </div>
                    <div className="main-section-info-1">
                        <div style={{width: "100%"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>
                                    {t(
                                        "metrics.transactions",
                                        "TỔNG GIÁ TRỊ TÀI SẢN ĐÃ GIAO DỊCH THÀNH CÔNG"
                                    )}
                                </strong>
                            </p>
                        </div>
                        <div>
                            <p style={{textAlign: "center"}}>123456789</p>
                            <p>
                                <strong>({t("payment.command", "LỆNH")})</strong>
                            </p>
                        </div>
                    </div>
                    <div className="main-section-info-1">
                        <div style={{width: "100%", padding: "14px"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>
                                    {t("metrics.bankUpdate", "NGÂN HÀNG TỰ ĐỘNG CẬP NHẬT SỐ DƯ")}
                                </strong>
                            </p>
                        </div>
                    </div>
                    <div className="main-section-info-1">
                        <div style={{minWidth: "30%"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>{t("metrics.withTerm", "GỬI CÓ KỲ HẠN")}</strong>
                            </p>
                        </div>
                        <div>
                            <p style={{textAlign: "center"}}>
                                <strong>
                                    (
                                    {t(
                                        "metrics.bankUpdateEn",
                                        "HIỆN SỐ, FILE NGÂN HÀNG CẬP NHẬT, HOẶC SÀN TRA CỨU GỬI LÊN"
                                    )}
                                    )
                                </strong>
                            </p>
                        </div>
                    </div>
                    <div className="main-section-info-1">
                        <div style={{minWidth: "30%"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>{t("metrics.withoutTerm", "GỬI KHÔNG KỲ HẠN")}</strong>
                            </p>
                        </div>
                        <div>
                            <p style={{textAlign: "center"}}>
                                <strong>
                                    (
                                    {t(
                                        "metrics.bankUpdateEn",
                                        "HIỆN SỐ, FILE NGÂN HÀNG CẬP NHẬT, HOẶC SÀN TRA CỨU GỬI LÊN"
                                    )}
                                    )
                                </strong>
                            </p>
                        </div>
                    </div>
                </section>
                {/* <section className="main-section-2"
                    style={{ maxWidth: 400 }}>
                    <div className="main-section-info-1" >
                        <div style={{width: "100%"}}>
                            <p style={{textAlign:"center"}}><strong>TỔNG GIÁ TRỊ TÀI SẢN ĐÃ LÊN SÀN:</strong></p> 
                            <p><em>(TOTAL LISTED ASSETS VALUE)</em></p>
                        </div>
                        <div  >
                            <p >123456789</p><p><strong>(LỆNH)</strong></p>
                        </div> 
                    </div>
                    <div className="main-section-info-1">
                        <div style={{width: "100%"}}>
                            <p style={{textAlign:"center"}}><strong>TỔNG GIÁ TRỊ TÀI SẢN ĐÃ GIAO DỊCH THÀNH CÔNG:</strong></p>
                            <p><em>(TOTAL SUCCESSFULLY TRANSED VALUE)</em></p>
                        </div>
                        <div>
                            <p style={{textAlign:"center"}}>123456789</p><p><strong>(LỆNH)</strong></p> 
                        </div> 
                    </div>
                    <div className="main-section-info-1">
                        <div style={{ width: "100%" }}>
                            <p style={{ textAlign: "center" }}><strong>NGÂN HÀNG TỰ ĐỘNG CẬP NHẬT SỐ DƯ</strong></p>

                        </div>
                    </div>
                    <div className="main-section-info-1">
                        <div style={{ minWidth: "30%" }}>
                            <p style={{ textAlign: "center" }}><strong>{t('metrics.withTerm', 'GỬI CÓ KỲ HẠN')}</strong></p>
                        </div>
                        <div>
                            <p style={{ textAlign: "center" }}><strong>({t('metrics.bankUpdateEn', 'HIỆN SỐ, FILE NGÂN HÀNG CẬP NHẬT, HOẶC SÀN TRA CỨU GỬI LÊN')})</strong></p>
                        </div>
                    </div>
                    <div className="main-section-info-1">
                        <div style={{ minWidth: "30%" }}>
                            <p style={{ textAlign: "center" }}><strong>{t('metrics.withoutTerm', 'GỬI KHÔNG KỲ HẠN')}</strong></p>
                        </div>
                        <div >
                            <p style={{ textAlign: "center" }}><strong>({t('metrics.bankUpdateEn', 'HIỆN SỐ, FILE NGÂN HÀNG CẬP NHẬT, HOẶC SÀN TRA CỨU GỬI LÊN')})</strong></p>
                        </div>
                    </div>
                </section> */}
                <section
                    className="main-section-2"
                    // style={{ maxWidth: 800 }}
                >
                    <div className="main-section-info-2" style={{height: "32%"}}>
                        <div style={{width: "70%"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>
                                    {t("metrics.transactions", "TỔNG SỐ LẦN ĐÃ GIAO DỊCH")}
                                </strong>
                            </p>
                        </div>
                        <div style={{width: "30%"}}>
                            <p>
                                <strong>({t("payment.command", "LỆNH")})</strong>
                            </p>
                        </div>
                    </div>
                    <div className="main-section-info-2" style={{height: "32%"}}>
                        <div style={{width: "70%"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>
                                    {t("metrics.amount", "TỔNG SỐ TIỀN ĐÃ GIAO DỊCH")}
                                </strong>
                            </p>
                        </div>
                        <div style={{width: "30%"}}>
                            <p>
                                <strong>({t("payment.command", "LỆNH")})</strong>
                            </p>
                        </div>
                    </div>
                    <div className="main-section-info-2" style={{height: "32%"}}>
                        <div style={{width: "70%"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>{t("metrics.deposited", "TỔNG SỐ TIỀN ĐÃ GỬI")}</strong>
                            </p>
                        </div>
                        <div style={{width: "30%"}}>
                            <p>
                                <strong>({t("payment.command", "LỆNH")})</strong>
                            </p>
                        </div>
                    </div>
                    <div className="main-section-info-2" style={{height: "20%"}}>
                        <div style={{width: "70%"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>{t("metrics.withdrawn", "TỔNG SỐ TIỀN ĐÃ RÚT")}</strong>
                            </p>
                        </div>
                        <div style={{width: "30%"}}>
                            <p>
                                <strong>({t("payment.command", "LỆNH")})</strong>
                            </p>
                        </div>
                    </div>
                    <div className="main-section-info-2" style={{height: "20%"}}>
                        <div style={{width: "70%"}}>
                            <p style={{textAlign: "center"}}>
                                <strong>
                                    {t("metrics.remaining", "TỔNG SỐ TIỀN TRÊN HỆ THỐNG")}
                                </strong>
                            </p>
                        </div>
                        <div style={{width: "30%"}}>
                            <p>
                                <strong>({t("payment.command", "LỆNH")})</strong>
                            </p>
                        </div>
                    </div>
                </section>
                {/* <section className="main-section-2"
                    style={{ maxWidth: 400 }}
                >
                    <div className="main-section-info-2" style={{ height: "20%" }} >
                        <div style={{ width: "40%" }}>
                            <p style={{ textAlign: "center" }}><strong>TỔNG SỐ LẦN ĐÃ GIAO DỊCH:</strong></p><p style={{ textAlign: "center" }}><em>(TOTAL NUMBER OF TIMES FOR TRANSACTION)</em></p>
                        </div>
                        <div style={{ width: "60%" }}>
                            <p><strong>({t('payment.command', 'LỆNH')})</strong></p>
                        </div>
                    </div>
                    <div className="main-section-info-2" style={{ height: "20%" }}>
                        <div style={{ width: "40%" }}>
                            <p style={{ textAlign: "center" }}><strong>TỔNG SỐ TIỀN ĐÃ GIAO DỊCH:</strong></p><p style={{ textAlign: "center" }}><em>(TOTAL AMOUNT FOR TRANSACTION)</em></p>
                        </div>
                        <div style={{ width: "60%" }}>
                            <p><strong>({t('payment.command', 'LỆNH')})</strong></p>
                        </div>
                    </div>
                    <div className="main-section-info-2" style={{ height: "20%" }} >
                        <div style={{ width: "40%" }}>
                            <p style={{ textAlign: "center" }}><strong>TỔNG SỐ TIỀN ĐÃ GỬI:</strong></p><p style={{ textAlign: "center" }}><em>(TOTAL AMOUNT FOR DEPOSIT)</em></p>
                        </div>
                        <div style={{ width: "60%" }}>
                            <p><strong>({t('payment.command', 'LỆNH')})</strong></p>
                        </div>
                    </div>
                    <div className="main-section-info-2" style={{ height: "48%" }} >
                        <div style={{ width: "40%" }}>
                            <p style={{ textAlign: "center" }}><strong>TỔNG SỐ TIỀN ĐÃ RÚT:</strong></p><p style={{ textAlign: "center" }}><em>(TOTAL AMOUNT FOR WITHDRAW)</em></p>
                        </div>
                        <div style={{ width: "60%" }}>
                            <p><strong>({t('payment.command', 'LỆNH')})</strong></p>
                        </div>
                    </div>
                    <div className="main-section-info-2" style={{ height: "48%" }} >
                        <div style={{ width: "40%" }}>
                            <p style={{ textAlign: "center" }}><strong>TỔNG SỐ TIỀN TRÊN HỆ THỐNG:</strong></p><p style={{ textAlign: "center" }}><em>(TOTAL AMOUNT FOR REMAIN)</em></p>
                        </div>
                        <div style={{ width: "60%" }}>
                            <p><strong>({t('payment.command', 'LỆNH')})</strong></p>
                        </div>
                    </div>
                </section> */}
            </main>
        </>
    );
};

function SearchSection() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    return (
        <section
            className="search-section"
            style={{fontSize: "clamp(1vw, 1.8vw, 2.2vw)", wrap: "nowrap"}}
        >
            <div
                className="search-title cursor-pointer"
                style={{cursor: "pointer"}}
            >
                <button
                    className="cursor-pointer"
                    onClick={() => navigate(`/list-of-goods`)}
                >
                    <h3>
                        <strong>{t("common.search", "TÌM KIẾM")}</strong>
                    </h3>
                </button>
            </div>
            {/* <div>
                <p>SAP XEP BO CUC CHO PHU HOP VOI MAN HINH HIEN THI MAY TINH + DIEN THOI</p>
            </div> */}
        </section>
    );
}

export {HeroHeader, Body, SearchSection, DropdownAuth};
