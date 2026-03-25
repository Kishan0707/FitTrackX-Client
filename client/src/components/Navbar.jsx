import React, { useContext } from "react";
import { AuthContext } from "../context/authContext";
import { RiMenu2Fill } from "react-icons/ri";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useTheme } from "../context/themeContext";

// eslint-disable-next-line no-unused-vars
const Navbar = ({ setMenuBtn, menuBtn }) => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-slate-900 flex justify-between items-center p-4 border-b border-slate-700">
      <button
        className="p-2 rounded hover:bg-slate-800 transition hidden md:block text-white"
        onClick={() => setMenuBtn((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        <RiMenu2Fill size={20} />
      </button>

      <div className="flex items-center justify-center gap-3">
        <h2 className="text-sm sm:text-base text-white">
          Welcome, {user?.name}
        </h2>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition border-2 border-slate-600"
          title="Toggle Dark/Light Mode"
        >
          {theme === "dark" ? (
            <MdLightMode size={24} className="text-yellow-400" />
          ) : (
            <MdDarkMode size={24} className="text-blue-400" />
          )}
        </button>

        <button
          className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition text-white font-medium"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
