"use client";
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import QrCodeDisplay from './molecules/QrCodeDisplay';

const QRModalComponent = ({ 
    isOpen, 
    onClose, 
    isLoading, 
    error, 
    qrDataUrl,
    onScanResult,
    isAuthenticated
}) => {
    const { t } = useTranslation();
    
    // QR Scanner state
    const [isScanning, setIsScanning] = useState(!isAuthenticated);
    const [scanError, setScanError] = useState('');
    const [qrReader, setQrReader] = useState(null);
    const webcamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // Initialize QR Reader
    useEffect(() => {
        if (isOpen && !isAuthenticated) {
            const reader = new BrowserMultiFormatReader();
            setQrReader(reader);
            setScanError('');
            setIsScanning(true);
        }
        
        return () => {
            if (qrReader) {
                qrReader.reset();
            }
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    }, [isOpen, isAuthenticated]);

    // Handle scanning when isScanning state changes
    useEffect(() => {
        if (isScanning && qrReader && webcamRef.current) {
            console.log('Starting continuous scanning...');
            
            // Start continuous scanning
            scanIntervalRef.current = setInterval(async () => {
                try {
                    if (webcamRef.current) {
                        const imageSrc = webcamRef.current.getScreenshot();
                        if (imageSrc) {
                            const result = await qrReader.decodeFromImageUrl(imageSrc);
                            if (result) {
                                console.log('QR Code detected:', result.text);
                                handleScanResult(result.text);
                            }
                        }
                    }
                } catch (err) {
                    // Continue scanning even if individual frame fails
                    console.log('Scanning frame error:', err.message);
                }
            }, 500); // Scan every 500ms
        } else if (!isScanning && scanIntervalRef.current) {
            console.log('Stopping scanning...');
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
            }
        };
    }, [isScanning, qrReader]);

    // Start QR scanning
    const startScanning = async () => {
        if (!qrReader) {
            const reader = new BrowserMultiFormatReader();
            setQrReader(reader);
        }
        setScanError('');
        setIsScanning(true);
    };

    // Stop QR scanning
    const stopScanning = () => {
        setIsScanning(false);
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (qrReader) {
            qrReader.reset();
        }
    };

    // Handle scan result
    const handleScanResult = (result) => {
        stopScanning();
        if (onScanResult) {
            onScanResult(result);
        }
    };

    // Handle modal close
    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100000 flex items-center justify-center bg-black/50 bg-opacity-50 p-4">
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
                {/* Close Button */}
                <button 
                    className="absolute top-1 right-2 text-gray-600 hover:text-black" 
                    onClick={handleClose}
                >
                    ✕
                </button>

                {/* Title */}
                {/* <h3 className="text-xl font-bold mb-4 text-center">
                    {isScanning ? t('qr.scanTitle', 'QUÉT MÃ QR') : t('auth.qrTitle', 'MÃ QR ĐĂNG NHẬP')}
                </h3> */}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <svg 
                            className="animate-spin h-6 w-6 text-blue-500" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                        >
                            <circle 
                                className="opacity-25" 
                                cx="12" 
                                cy="12" 
                                r="10" 
                                stroke="currentColor" 
                                strokeWidth="4"
                            />
                            <path 
                                className="opacity-75" 
                                fill="currentColor" 
                                d="M4 12a8 8 0 018-8v8H4z"
                            />
                        </svg>
                        <span className="ml-3">
                            {t('common.loading', 'Đang tải QR...')}
                        </span>
                    </div>
                )}

                {/* Error State */}
                {!isLoading && error && (
                    <div className="text-center text-red-600 py-4">
                        {error}
                    </div>
                )}

                {/* QR Code Display - Only show when authenticated and not scanning */}
                {!isLoading && !isScanning && isAuthenticated && qrDataUrl && (
                    <QrCodeDisplay dataUrl={qrDataUrl} size={256} downloadFileName="login-qr.png" />
                )}

                {/* Camera Scanner Section */}
                {isScanning && (
                    <div className="mb-4">
                        <div className="relative">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    width: 300,
                                    height: 300,
                                    facingMode: { ideal: "environment" }
                                }}
                                className="w-full h-64 object-cover rounded border"
                            />
                            
                            {/* Scanning overlay */}
                            <div className="absolute inset-0 border-2 border-blue-500 rounded">
                                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                            </div>
                        </div>
                        
                        {/* Scanning status */}
                        <div className="text-center mt-2">
                            <div className="flex items-center justify-center">
                                <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                <span className="text-sm text-blue-600">
                                    {t('qr.scanning', 'Đang quét...')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scan Error */}
                {scanError && (
                    <div className="text-center text-red-600 py-2 mb-4">
                        {scanError}
                    </div>
                )}

                {/* Camera Button - Show only when authenticated and not scanning */}
                {!isScanning && !isLoading && isAuthenticated && (
                    <div className="text-center mb-2">
                        <button
                            onClick={startScanning}
                            className="flex items-center justify-center mx-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            <svg 
                                className="w-5 h-5" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                                />
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                                />
                            </svg>
                            
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRModalComponent;