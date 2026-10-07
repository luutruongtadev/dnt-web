"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button
        onClick={() => changeLanguage('vi')}
        className={`lang-btn ${i18n.language === 'vi' ? 'active' : ''}`}
      >
        VI
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;

// CSS styles (add to your CSS file)
/*
.language-switcher {
  display: flex;
  gap: 8px;
  margin: 10px;
}

.lang-btn {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.lang-btn:hover {
  background: #f0f0f0;
}

.lang-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}
*/