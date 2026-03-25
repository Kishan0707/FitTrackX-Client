import React from "react";
import { useTheme } from "../context/themeContext";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import DashboardLayout from "../layout/DashboardLayout";

const TestFeatures = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-white">Feature Test Page</h1>

        {/* Dark Mode Test */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Dark Mode Test</h2>
          <p className="text-slate-300 mb-4">Current Theme: {theme}</p>
          <button
            onClick={toggleTheme}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Toggle Theme
          </button>
        </div>

        {/* Language Selector Test */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Language Selector Test</h2>
          <div className="mb-4">
            <p className="text-slate-300 mb-2">Select Language:</p>
            <LanguageSelector />
          </div>
          <div className="space-y-2 text-slate-300">
            <p>{t('welcome')}</p>
            <p>{t('dashboard')}</p>
            <p>{t('workouts')}</p>
            <p>{t('diet')}</p>
            <p>{t('settings')}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TestFeatures;
