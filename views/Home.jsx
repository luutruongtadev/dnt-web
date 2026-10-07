"use client";
import {useState, useEffect} from "react";
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {BookUserIcon} from "lucide-react";

// Components
import {HeroHeader, Body, SearchSection, DropdownAuth} from "../components/Body";
import GlobalInfoComponent from '../components/GlobalInfoComponent';
import CountrySpecificComponent from '../components/CountrySpecificComponent';
import CompanyInfoTable from '../components/CompanyInfoTable';
import EventFilterComponent from "../components/EventFilterComponent";
import EventComponent from "../components/EventComponent";
import AdBanner from "../components/AdBaner";
import HeaderComponent from "../components/HeaderComponent";
import QRModalComponent from "../components/QRModalComponent";
import ScanResultModal from "../components/ScanResultModal";
import FooterComponent from "../components/FooterComponent";
import DataTableComponent from "../components/DataTableComponent";
import HomeBody from "../components/HomeBody";


// Services
import {generateQrSessionInfo} from "../services/authService";

function HomePage() {
    const {t, i18n} = useTranslation();
    const {user, isAuthenticated} = useSelector(state => state.auth);
    const lang = localStorage.getItem("selectedLang") || "vi";
    // State management
    const [selectedLang, setSelectedLang] = useState(lang || i18n.language);
    const [color, setColor] = useState("#fcfcfcff");
    const [authToken, setAuthToken] = useState(null);
    const [userCountry, setUserCountry] = useState('Vietnam');

    // QR Modal states
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isQrLoading, setIsQrLoading] = useState(false);
    const [qrError, setQrError] = useState("");
    const [qrDataUrl, setQrDataUrl] = useState(null);
    
    // Scan Result Modal states
    const [scanResult, setScanResult] = useState(null);
    const [isScanResultModalOpen, setIsScanResultModalOpen] = useState(false);

    // Effects
    useEffect(() => {
        if (user?.country) {
            setUserCountry(user.country);
        }
    }, [user]);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        setAuthToken(token);
    }, []);

    useEffect(() => {
        console.log("HomePage useEffect");

        const savedColor = localStorage.getItem("selectedColor");
        if (savedColor) {
            setColor(savedColor);
        }
    }, []);

    useEffect(() => {
        document.getElementById("root").style.backgroundColor = color;
    }, [color]);

    // Ensure i18n uses the stored/selected language
    useEffect(() => {
        if (selectedLang && i18n.language !== selectedLang) {
            i18n.changeLanguage(selectedLang);
        }
    }, [selectedLang]);

    // Computed values
    const isUserLoggedIn = localStorage.getItem("authToken") !== null;

    // Handlers
    const handleChangeColor = (e) => {
        const newColor = e.target.value;
        setColor(newColor);
        localStorage.setItem("selectedColor", newColor);
    };

    const handleLanguageChange = (newLang) => {
        setSelectedLang(newLang);
    };

    const handleOpenQrModal = async () => {
        setIsQrModalOpen(true);

        // Only generate QR code if user is authenticated
        if (isUserLoggedIn) {
            try {
                setIsQrLoading(true);
                setQrError("");
                setQrDataUrl(null);

                const response = await generateQrSessionInfo();
                const qrCode = response.data?.qrCode;
                if (qrCode) {
                    setQrDataUrl(qrCode);
                } else {
                    setQrError(t('auth.qrError', 'Không lấy được mã QR, vui lòng thử lại'));
                }
            } catch (error) {
                setQrError(error.message || t('auth.qrError', 'Không lấy được mã QR, vui lòng thử lại'));
            } finally {
                setIsQrLoading(false);
            }
        }
    };

    const handleCloseQrModal = () => {
        setIsQrModalOpen(false);
        setQrDataUrl(null);
        setQrError("");
        setIsQrLoading(false);
    };

    const handleScanResult = (resultString) => {
        console.log('QR Scan Result:', resultString);
        handleCloseQrModal();
        // Check if resultString is a URL
        if (resultString && (resultString.startsWith('http://') || resultString.startsWith('https://'))) {
            window.location.href = resultString;
            return;
        }

        try {
            const result = JSON.parse(resultString);
            setScanResult(result);
            setIsScanResultModalOpen(true);
        } catch (error) {
            console.error("Failed to parse QR result:", error);
            alert(`QR Code scanned (raw): ${resultString}`);
        }
    };

    const handleCloseScanResultModal = () => {
        setIsScanResultModalOpen(false);
        setScanResult(null);
    };

    const baseStyle = {
        position: 'fixed',
        bottom: "16vh",
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 9999,
        backgroundColor: '#1a56db',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        zIndex: 1000,
        transition: 'background-color 150ms ease, transform 150ms ease'
    };

    return (
        <>
            <header className="grid-container "

            >
                {/* Header Component */}

                <HeaderComponent
                    color={color}
                    onColorChange={handleChangeColor}
                    onQrClick={handleOpenQrModal}
                    selectedLang={selectedLang}
                    onLanguageChange={handleLanguageChange}
                    isUserLoggedIn={isUserLoggedIn}
                />
                <DropdownAuth/>

                {/* Main Content Grid */}
                {!isUserLoggedIn && (
                    <div className="flex-1 avtblock !hidden md:!block w-full h-full flex flex-col avt"
                         style={{maxWidth: "clamp(50px, 123px, 130px) ", margin: "0 2px"}}>
                        <CountrySpecificComponent userCountry={selectedLang}/>
                    </div>)}

                {/* Company/user info panel moved to the top-left, sticky so it stays visible while scrolling */}
                {isUserLoggedIn && (
                    <div className="!hidden md:!block flex-2 self-start sticky top-0 z-20" style={{height: "100%", flex: 3}}>
                        <CompanyInfoTable userCountry={selectedLang}/>
                    </div>
                )}
                {isUserLoggedIn && (
                    <div className="flex-1 avtblock !hidden md:!block w-full h-full flex flex-col avt"
                         style={{maxWidth: "clamp(50px, 130px, 130px) ", margin: "0 2px"}}>
                        <GlobalInfoComponent userCountry={selectedLang}/>
                    </div>)}
                {!isUserLoggedIn && (
                    <div className="!hidden md:!block flex-2" style={{height: "100%", flex: 3}}>
                        <DataTableComponent/>
                    </div>
                )}

                {/* HeroHeader as fourth column when logged in */}
                {isUserLoggedIn && (
                    <div className="!hidden md:!block grid-col-4 w-full " style={{marginTop: "-1vw"}}>
                        <HeroHeader selectedLang={selectedLang} isCompact={true} userCountry={userCountry}/>

                        <EventFilterComponent/>
                    </div>
                )}

                {/* Mobile layout - Show HeroHeader and EventFilterComponent in a separate row */}
                <div className="md:hidden w-full flex flex-col mt-2"

                >
                    <HeroHeader selectedLang={selectedLang} isCompact={true} ismobile={true} userCountry={userCountry}/>
                    <EventFilterComponent/>
                </div>
            </header>

            {/* Body Content */}


            {!isUserLoggedIn && (
                <div className="flex" style={{marginTop: "-20px"}}>
                    <div className="hidden md:block w-full">
                        <HeroHeader isCompact={false}/>
                        <EventFilterComponent/>
                    </div>
                </div>
            )}
 <QRModalComponent
                isOpen={isQrModalOpen}
                onClose={handleCloseQrModal}
                isLoading={isQrLoading}
                error={qrError}
                qrDataUrl={qrDataUrl}
                onScanResult={handleScanResult}
                isAuthenticated={isUserLoggedIn}
            />

            <ScanResultModal
                isOpen={isScanResultModalOpen}
                onClose={handleCloseScanResultModal}
                result={scanResult}
            />

            <HomeBody/>
        </>
    );
}

export default HomePage;