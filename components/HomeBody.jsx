"use client";
import {useState, useEffect} from "react";
import { useNavigate } from '@/lib/router-compat'

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
import FooterComponent from "../components/FooterComponent";
import DataTableComponent from "../components/DataTableComponent";
const HomeBody = () => {
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

    const navigate = useNavigate();

    return (
        <>
            <EventComponent/>

            <FooterComponent/>

            <AdBanner/>

            {/* QR Modal */}
           
            <button
                title="Sổ liên lạc"
                aria-label="Sổ liên lạc"
                style={baseStyle}
                onClick={() => navigate('/contact')}

            >
                <BookUserIcon size={26} strokeWidth={2.5}/>
            </button>
        </>
    );
}

export default HomeBody;