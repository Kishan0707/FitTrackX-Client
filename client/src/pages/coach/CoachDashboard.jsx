import React from "react";
import DashboardLayout from "../../layout/DashboardLayout";

const CoachDashboard = () => {
  return (
    <DashboardLayout>
      <h1 className="mb-6 text-2xl font-bold">Coach Dashboard</h1>
      <p>
        Welcome to your dashboard. You can manage your sessions, view reports,
        and more here.
      </p>
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Dashboard cards go here */}
        <div className="p-6 mb-6 shadow-xl bg-slate-900 rounded-xl">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoachDashboard;
