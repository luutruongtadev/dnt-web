"use client";
import React from "react";
import { useTranslation } from "react-i18next";

const TermsAgreementCheckbox = ({ isChecked, setIsChecked }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-start my-4">
      <input
        type="checkbox"
        id="terms-agreement"
        className="mt-1 mr-2"
        checked={isChecked}
        onChange={(e) => setIsChecked(e.target.checked)}
      />
      <label htmlFor="terms-agreement" className="text-sm">
        {t("common.agreementText")}
      </label>
    </div>
  );
};

export default TermsAgreementCheckbox;
