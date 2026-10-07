"use client";
import React, { useState, useEffect } from "react";
import "../styles/Login.css";
import axios from "axios";
import { getFreelancer } from "../services/freelancerService";
import { useNavigate } from '@/lib/router-compat';
import FreelancerActuallyComponent from "../components/FreelancerActuallyComponent";
import FreelancerOnlineComponent from "../components/FreelancerOnlineComponent";
import FreelancerShippingComponent from "../components/FreelancerShippingComponent";
import { getWalletFromToken } from "../services/walletService";
import { getFreelancerWithNullPic } from "../services/freelancerService";
import { useTranslation } from 'react-i18next';
import {
    Home as HomeIcon,
    KeyboardIcon as KeyboardIcon,
} from "lucide-react";
import PageHeaderWithOutColorPicker from "../components/PageHeaderWithOutColorPicker";
import GoodsAccount from "../components/GoodsAccount";


export default function FreelancerPage() {
    const { t } = useTranslation();
    const [color, setColor] = useState(localStorage.getItem("selectedColor"));
    const [activeTab, setActiveTab] = useState("actual"); // "actual" or "online"
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isLoggedIn = localStorage.getItem("authToken") !== null;


    const [freelancersOffline, setFreelancersOffline] = useState([
        {
            id: 2,
            name: 'OFFLINE job',
            estimate: '1day',
            requirement: 'Java',
            startDate: null,
            endDate: null,
            startLocation: null,
            endLocation: null,
            price: null,
            deposit: null,
            serviceFee: null,
            type: 'offline',
            documentId: null

        }
    ]);
    const [freelancersOnline, setFreelancersOnline] = useState([
        {
            id: 2,
            name: 'ONLINE job',
            estimate: '1day',
            requirement: 'Java',
            startDate: null,
            endDate: null,
            startLocation: null,
            endLocation: null,
            price: null,
            deposit: null,
            serviceFee: null,
            type: 'online',
            documentId: null
        }
    ]);
    const navigate = useNavigate();

    const [wallet, setWallet] = useState({
        total: 0,
        account_of_goods: 0,
        account_of_freelancer: 0,
        account_of_ailive: 0,
        pending_amount: 0
    });


    const handleChangeColor = (e) => {
        const newColor = e.target.value;
        setColor(newColor);
        localStorage.setItem("selectedColor", newColor);
    };

    useEffect(() => {
        document.getElementById("root").style.backgroundColor = color;
    }, [color]);

    useEffect(() => {
        let isMounted = true; // Flag to track if component is still mounted

        const fetchData = async () => {
            try {
                if (isMounted) {
                    setLoading(true);
                    setError(null);
                }

                const token = localStorage.getItem("authToken");
                if (isMounted) {
                    setUser(token);
                }

                // Only try to fetch wallet if token exists
                if (token) {
                    try {
                        const response = await getWalletFromToken();
                        if (isMounted) {
                            setWallet(response.data);
                            console.log(response.data);
                        }
                    } catch (walletError) {
                        if (isMounted) {
                            console.warn("Wallet fetch failed, using default values:", walletError.message);
                            // Keep default wallet values on wallet error
                        }
                    }
                }

                const freelancersOffline = await getFreelancerWithNullPic(1, 10, 'offline');
                if (isMounted) {
                    setFreelancersOffline(freelancersOffline.data.data);
                    console.log(freelancersOffline.data.data);
                }

                const freelancersOnline = await getFreelancerWithNullPic(1, 10, 'online');
                if (isMounted) {
                    setFreelancersOnline(freelancersOnline.data.data);
                    console.log(freelancersOnline.data.data);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Error fetching data:", error);
                    setError(error.message);
                    // Keep default values to prevent white screen
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, []);


    return (
        <>
        
        <div className="flex justify-center items-center">
            <div className="w-full max-w-4xl mx-auto">
                {/* Header with Navigation */}
                <PageHeaderWithOutColorPicker
                    color={color}
                    onColorChange={handleChangeColor}
                    titlePrefix="7"
                    leftButton={
                        <button
                            className="text-red-600 hover:text-red-800 relative"
                            onClick={() => navigate("/")}
                        >
                            <HomeIcon size={28} />
                        </button>
                    }
                    rightButton={
                        <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => navigate("/admin-control")}
                        >
                            <KeyboardIcon size={28} />
                        </button>
                    }
                    title={t("posts.freelancer")}
                />


                {/* Loading state */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="text-lg text-gray-600">{t('common.loading')}</div>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="text-center py-4 mb-4">
                        <div className="text-red-600 bg-red-100 p-3 rounded">
                            {t('common.errorOccurred')}: {error}. {t('common.showingDefaultData')}.
                        </div>
                    </div>
                )}

                {/* Main content - always render to prevent white screen */}
                {!loading && (
                    <>
                        {/* Table layout */}
                        <div className="">
                            <div className="overflow-hidden">
                                {/* Row 1: TÀI KHOẢN CÔNG VIỆC TỰ DO */}
                                <GoodsAccount title={t('freelancer.accountOfFreelancer')} />

                                {/* Row 3: THỰC TẾ / TRỰC TUYẾN */}
                                <div className="flex justify-center">
                                    <div
                                    style={{width: '250px'}}
                                        className={`p-3  border border-gray-300 text-center font-bold cursor-pointer ${activeTab === "actual" ? "bg-orange-100" : ""}`}
                                        onClick={() => setActiveTab("actual")}
                                    >
                                        {t('freelancer.actual')}
                                    </div>
                                    <div
                                    style={{width: '250px'}}
                                        className={`p-3 border border-gray-300 text-center font-bold cursor-pointer ${activeTab === "online" ? "bg-blue-100" : ""}`}
                                        onClick={() => setActiveTab("online")}
                                    >
                                        {t('freelancer.online')}
                                    </div>
                                    <div
                                    style={{width: '250px'}}
                                        className={`p-3 border border-gray-300 text-center font-bold cursor-pointer ${activeTab === "shipping" ? "bg-green-100" : ""}`}
                                        onClick={() => setActiveTab("shipping")}
                                    >
                                        {t('freelancer.shipping')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Render the appropriate component based on the active tab */}

                    </>
                )}
            </div>
            
        </div>
        <div className="max-h-[300px] overflow-auto" style={{ direction: "rtl" }}>
          <div style={{ direction: "ltr", width: "fit-content" }}>
            {activeTab === "actual" ? (
              <FreelancerActuallyComponent freelancers={freelancersOffline} />
            ) : activeTab === "online" ? (
              <FreelancerOnlineComponent freelancers={freelancersOnline} />
            ) : (
              <FreelancerShippingComponent freelancers={freelancersOffline} />
            )}
          </div>
        </div>
        </>
    );
}