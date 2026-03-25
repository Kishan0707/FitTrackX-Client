import { useState, useEffect } from "react";
import React from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import WeightChart from "../../components/WeightChart";
import MonthlyComparision from "../../components/MonthlyComparision";
import StatCard from "../../components/StatCard";
import ProgressPhotoUpload from "../../components/ProgressPhotoUpload";
import SocialShare from "../../components/SocialShare";
import API from "../../services/api";
import {
  FaWeight,
  FaFire,
  FaAppleAlt,
  FaChartLine,
  FaPlus,
  FaCamera,
  FaRuler,
} from "react-icons/fa";

const Progress = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await API.get("/progress/graphs");
        setProgress(res.data.data);
        setError("");
      } catch (err) {
        console.error("Error fetching progress:", err);
        setError("Failed to load progress data");
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Progress Tracking
          </h1>
          <p className="text-slate-400">
            Monitor your fitness journey with detailed analytics and insights
          </p>
        </div>
        <SocialShare
          title="My Fitness Progress on FitTrack"
          text="Check out my amazing fitness journey and progress!"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      {progress && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Current Weight"
            value={
              progress.weightHistory?.length > 0
                ? `${progress.weightHistory[progress.weightHistory.length - 1].weight} kg`
                : "N/A"
            }
            icon={<FaWeight />}
          />
          <StatCard
            title="Total Calories Burned"
            value={
              progress.caloriesBurned
                ?.reduce((sum, item) => sum + item.calories, 0)
                .toLocaleString() || 0
            }
            icon={<FaFire />}
          />
          <StatCard
            title="Avg Protein Intake"
            value={
              progress.proteinIntake?.length > 0
                ? `${(progress.proteinIntake.reduce((sum, item) => sum + item.protein, 0) / progress.proteinIntake.length).toFixed(1)}g`
                : "N/A"
            }
            icon={<FaAppleAlt />}
          />
          <StatCard
            title="Weight Change"
            value={
              progress.weightHistory?.length > 1
                ? `${(progress.weightHistory[progress.weightHistory.length - 1].weight - progress.weightHistory[0].weight).toFixed(1)} kg`
                : "N/A"
            }
            icon={<FaChartLine />}
          />
        </div>
      )}

      {/* Charts Section */}
      {progress && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weight Progress Chart */}
          <div className="bg-slate-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaWeight className="mr-2 text-red-500" />
              Weight History
            </h3>
            <WeightChart data={progress.weightHistory} color="#ef4444" />
          </div>

          {/* Calories Burned Chart */}
          <div className="bg-slate-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaFire className="mr-2 text-red-500" />
              Calories Burned
            </h3>
            <WeightChart
              data={progress.caloriesBurned}
              xDataKey="date"
              yDataKey="calories"
              color="#10b981"
            />
          </div>

          {/* Protein Intake Chart */}
          <div className="bg-slate-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaAppleAlt className="mr-2 text-red-500" />
              Protein Intake
            </h3>
            <WeightChart
              data={progress.proteinIntake}
              xDataKey="date"
              yDataKey="protein"
              color="#3b82f6"
            />
          </div>

          {/* Monthly Comparison */}
          <div className="bg-slate-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaChartLine className="mr-2 text-red-500" />
              Monthly Comparison
            </h3>
            <MonthlyComparision />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-slate-900 p-6 rounded-xl mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <FaPlus className="mr-2 text-red-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
            <FaWeight className="mr-2" />
            Add Weight Measurement
          </button>
          <button
            onClick={() => setShowPhotoUpload(!showPhotoUpload)}
            className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <FaCamera className="mr-2" />
            Upload Progress Photo
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
            <FaRuler className="mr-2" />
            Body Measurements
          </button>
        </div>
      </div>

      {/* Progress Photo Upload */}
      {showPhotoUpload && (
        <ProgressPhotoUpload
          onUploadSuccess={() => setShowPhotoUpload(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default Progress;
