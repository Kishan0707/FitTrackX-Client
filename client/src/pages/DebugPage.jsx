import React, { useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import DashboardLayout from "../layout/DashboardLayout";

const DebugPage = () => {
  const [isDark, setIsDark] = useState(true);
  const [language, setLanguage] = useState("en");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <h1 className="text-3xl font-bold text-white">Debug Page - Feature Test</h1>

        {/* Dark Mode Test */}
        <div className="bg-slate-800 p-8 rounded-lg border-2 border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">🌙 Dark Mode Toggle Test</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-3 text-lg"
            >
              {isDark ? <MdLightMode size={24} /> : <MdDarkMode size={24} />}
              <span>{isDark ? "Switch to Light" : "Switch to Dark"}</span>
            </button>
            <div className="text-white text-lg">
              Current: <span className="font-bold">{isDark ? "Dark Mode" : "Light Mode"}</span>
            </div>
          </div>
        </div>

        {/* Language Selector Test */}
        <div className="bg-slate-800 p-8 rounded-lg border-2 border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">🌍 Language Selector Test</h2>
          <div className="space-y-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full max-w-md bg-slate-700 text-white px-6 py-3 rounded-lg border-2 border-slate-600 text-lg cursor-pointer"
            >
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="hi">🇮🇳 Hindi</option>
            </select>
            <div className="text-white text-lg">
              Selected: <span className="font-bold">{language}</span>
            </div>
          </div>
        </div>

        {/* Icons Test */}
        <div className="bg-slate-800 p-8 rounded-lg border-2 border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">🎨 Icons Visibility Test</h2>
          <div className="flex gap-6 text-white text-4xl">
            <MdDarkMode />
            <MdLightMode />
            <span className="text-lg">← Icons should be visible</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-green-900/20 border-2 border-green-500 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-green-400 mb-2">✅ If you can see this page:</h3>
          <ul className="text-white space-y-2 list-disc list-inside">
            <li>Dark mode toggle button is working above</li>
            <li>Language selector dropdown is working above</li>
            <li>Icons are visible (moon and sun)</li>
            <li>Check Navbar (top right) for the same icons</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DebugPage;
