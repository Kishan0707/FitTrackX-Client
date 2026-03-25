import { NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaDumbbell,
  FaAppleAlt,
  FaChartBar,
  FaRobot,
  FaCrown,
  FaCog,
  FaFileAlt,
  FaHistory,
  FaChartPie,
  FaUserTie,
} from "react-icons/fa";
import { MdManageAccounts } from "react-icons/md";
import { useContext } from "react";
import { AuthContext } from "../context/authContext";

const Sidebar = ({ menuBtn }) => {
  const { user } = useContext(AuthContext);
  let menu = [];
  if (!user) return;
  if (user.role === "admin") {
    menu = [
      { name: "Dashboard", path: "/admin", icon: <FaChartLine /> },
      {
        name: "User Management",
        path: "/admin/users",
        icon: <MdManageAccounts />,
      },
      {
        name: "Workouts Management",
        path: "/admin/workouts",
        icon: <FaDumbbell />,
      },
      { name: "Diet Management", path: "/admin/diet", icon: <FaAppleAlt /> },
      {
        name: "Coach Management",
        path: "/admin/coaches",
        icon: <FaUserTie />,
      },
      {
        name: "Reports",
        path: "/admin/reports",
        icon: <FaFileAlt />,
      },
      { name: "Settings", path: "/settings", icon: <FaCog /> },
    ];
  } else if (user.role === "coach") {
    menu = [
      { name: "Dashboard", path: "/coachDashboard", icon: <FaChartLine /> },
      { name: "Add Workouts", path: "/add-workout", icon: <FaDumbbell /> },
      { name: "Add-Diet", path: "/add-meal", icon: <FaAppleAlt /> },
      { name: "Progress", path: "/progress", icon: <FaChartBar /> },
      { name: "AI Trainer", path: "/ai", icon: <FaRobot /> },
      { name: "Plans", path: "/plans", icon: <FaCrown /> },
    ];
  } else {
    menu = [
      { name: "Dashboard", path: "/dashboard", icon: <FaChartLine /> },
      { name: "Add Workouts", path: "/add-workout", icon: <FaDumbbell /> },
      {
        name: "Workout Analytics",
        path: "/workout-analytics",
        icon: <FaChartPie />,
      },
      {
        name: "Workout History",
        path: "/workout-history",
        icon: <FaHistory />,
      },
      { name: "Add-Diet", path: "/add-meal", icon: <FaAppleAlt /> },
      { name: "Progress", path: "/progress", icon: <FaChartBar /> },
      { name: "AI Trainer", path: "/ai", icon: <FaRobot /> },
      { name: "Plans", path: "/plans", icon: <FaCrown /> },
      { name: "Settings", path: "/settings", icon: <FaCog /> },
    ];
  }
  // const menu = [
  //   { name: "Dashboard", path: "/dashboard", icon: <FaChartLine /> },
  //   { name: "Workouts", path: "/workouts", icon: <FaDumbbell /> },
  //   { name: "Add Workouts", path: "/add-workout", icon: <FaDumbbell /> },
  //   { name: "Diet", path: "/diet", icon: <FaAppleAlt /> },
  //   { name: "Add-Diet", path: "/add-meal", icon: <FaAppleAlt /> },
  //   { name: "Progress", path: "/progress", icon: <FaChartBar /> },
  //   { name: "AI Trainer", path: "/ai", icon: <FaRobot /> },
  //   { name: "Plans", path: "/plans", icon: <FaCrown /> },
  // ];

  return (
    <div
      className={`min-h-screen bg-slate-900 border-r border-slate-700 p-5 transition-all duration-300 ${
        menuBtn ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between mt-5 mb-10">
        <h1
          className={`text-xl font-bold text-red-500 transition-opacity duration-300 ${
            menuBtn ? " pointer-events-none" : "opacity-100"
          }`}
        >
          {menuBtn ? "FitX" : "FitTrackX"}
        </h1>
      </div>

      <nav className="flex flex-col gap-2">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end
            title={item.name}
            className={({ isActive }) =>
              `group flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-red-500 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span
              className={`truncate transition-opacity duration-300 ${
                menuBtn ? "opacity-0 w-0" : "opacity-100 w-full"
              }`}
            >
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
