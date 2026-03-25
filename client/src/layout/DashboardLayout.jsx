import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useState } from "react";

const DashboardLayout = ({ children }) => {
  const [menuBtn, setMenuBtn] = useState(true);

  return (
    <div className="flex bg-slate-950 text-white min-h-screen">
      <Sidebar setMenuBtn={setMenuBtn} menuBtn={menuBtn} />

      <div className="flex-1 flex flex-col">
        <Navbar setMenuBtn={setMenuBtn} menuBtn={menuBtn} />

        <main className="p-6 w-full">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
