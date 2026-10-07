"use client";
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/lib/router-compat';

const FooterComponent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <>
            {/* Reward List + Restricted Transactions Links */}
            <div
                style={{
                    display: "flex",
                    borderBottom: '1px solid',
                    fontWeight: 'bold',
                }}
            >
                <div
                    onClick={() => navigate("/reward-list")}
                    style={{
                        flex: 1,
                        display: "flex",
                        cursor: "pointer",
                        justifyContent: "center",
                        alignItems: "center",
                        height: 50,
                        borderRight: '1px solid',
                    }}
                >
                    <p>{t('common.updateNotice', 'DANH SÁCH NHẬN THƯỞNG')}</p>
                </div>
                <div
                    onClick={() => navigate("/restricted-transactions")}
                    style={{
                        flex: 1,
                        display: "flex",
                        cursor: "pointer",
                        justifyContent: "center",
                        alignItems: "center",
                        height: 50,
                    }}
                >
                    <p>DANH SÁCH HẠN CHẾ GIAO DỊCH</p>
                </div>
            </div>

            {/* Company Information */}
            <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "center", 
                alignItems: "center", 
                height: 50, 
                fontSize: 10 
            }}>
                <div>{t('common.companyName', '© CÔNG TY TNHH ĐẠI NGHĨA TÍN')}</div>
                <div>{t('common.taxCode', 'MST: 3702678200')}</div>
            </div>
        </>
    );
};

export default FooterComponent;