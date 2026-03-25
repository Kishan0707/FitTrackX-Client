import React from "react";

const StatCard = ({ title, value, icon, growth }) => {
  const shouldShowGrowth =
    growth !== undefined && growth !== null && growth !== "";

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-md flex justify-between items-center">
      <div>
        <h3 className="text-sm text-slate-400">{title}</h3>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {shouldShowGrowth && (
          <p className="text-sm text-green-400 mt-1">{growth}</p>
        )}
      </div>
      <div className="text-slate-400 text-2xl">{icon}</div>
    </div>
  );
};

export default StatCard;
