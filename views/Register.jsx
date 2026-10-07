"use client";
import React from "react";
import "../styles/Register.css";
import { useTranslation } from 'react-i18next';
import PageHeaderWithOutColorPicker from '../components/PageHeaderWithOutColorPicker';
import useRegisterForm from "../hooks/useRegisterForm";
import RegisterStepOne from "../components/organisms/RegisterStepOne";
import RegisterStepTwo from "../components/organisms/RegisterStepTwo";
import ContractModal from "../components/ContractModal";


export default function RegisterPage() {
  const { t } = useTranslation();
  const {
    color,
    handleChangeColor,
    countries,
    selectedCountry,
    setSelectedCountry,
    validationErrors,
    page,
    isVerifying,
    formData,
    handleInputChange,
    isFormValid,
    handleContractDownload,
    handleRegister,
    handleNextClick,
    isReadContract,
    banks,
    isContractModalOpen,
    contractFiles,
    contractActiveIndex,
    setContractActiveIndex,
    isContractLoading,
    contractError,
    handleCloseContractModal,
    handleBankNumberBlur,
    isFetchingAccountName,
    accountNameError,
  } = useRegisterForm(t);

  return (
    <div className="flex justify-center items-start min-h-screen pt-2">
      <div className="bg-transparent backdrop-blur-md px-6 py-2 rounded-lg w-full max-w-4xl mx-auto">
        <PageHeaderWithOutColorPicker
          color={color}
          onColorChange={handleChangeColor}
          titlePrefix="1"
          title={t('register.registerTitle', 'ĐĂNG KÝ')}
          titleClassName="text-3xl"
          compact
          rightButtonClassName="right-4"
          rightButton={page === 2 ? undefined : (
            <button
              type="button"
              onClick={handleContractDownload}
              className="text-[13px] border border-blue-600 text-blue-600 px-3 py-1 rounded hover:bg-blue-50"
            >
              {t("register.viewContract", "Xem hợp đồng")}
            </button>
          )}
        />
        {page === 1 && (
          <RegisterStepOne
            t={t}
            countries={countries}
            banks={banks}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            validationErrors={validationErrors}
            formData={formData}
            handleInputChange={handleInputChange}
            isFormValid={isFormValid}
            isVerifying={isVerifying}
            handleNextClick={handleNextClick}
            handleBankNumberBlur={handleBankNumberBlur}
            isFetchingAccountName={isFetchingAccountName}
            accountNameError={accountNameError}
          />
        )}
        {page === 2 && (
          <RegisterStepTwo
            t={t}
            handleContractDownload={handleContractDownload}
            isReadContract={isReadContract}
            handleRegister={handleRegister}
          />
        )}
      </div>

      <ContractModal
        isOpen={isContractModalOpen}
        isLoading={isContractLoading}
        contractFiles={contractFiles}
        contractActiveIndex={contractActiveIndex}
        setContractActiveIndex={setContractActiveIndex}
        contractError={contractError}
        onClose={handleCloseContractModal}
      />
    </div>
  );
}
