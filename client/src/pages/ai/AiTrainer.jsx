import { useState } from "react";
import React from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import API from "../../services/api";

const AiTrainer = () => {
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [plan, setPlan] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const generateWorkout = async () => {
    try {
      setLoading(true);
      const res = await API.post("/ai/ai-workout", {
        goal,
        experience,
      });

      if (!res.data.data) {
        setError("No plan generated");
        return;
      }

      if (res.data.data.length === 0) {
        setError("No plan generated");
        return;
      }

      setPlan(res.data.data);
      setSuccess("Workout Plan Generated Successfully! 💪");
      setTimeout(() => setSuccess(""), 3000);
      setError("");
    } catch (err) {
      console.log(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Server is not working",
      );
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const goalOptions = [
    {
      value: "muscle gain",
      label: "Muscle Gain",
      icon: "💪",
      desc: "Build strength & size",
    },
    {
      value: "fat loss",
      label: "Fat Loss",
      icon: "🔥",
      desc: "Burn fat & get lean",
    },
    {
      value: "strength",
      label: "Strength",
      icon: "🏋️",
      desc: "Maximize power",
    },
  ];

  const experienceOptions = [
    {
      value: "beginner",
      label: "Beginner",
      icon: "🌱",
      desc: "New to fitness",
    },
    {
      value: "intermediate",
      label: "Intermediate",
      icon: "⚡",
      desc: "Some experience",
    },
    { value: "expert", label: "Expert", icon: "👑", desc: "Advanced level" },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header Section */}
        <div className="text-center py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold bg-linear-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
              AI Workout Generator
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get personalized workout plans powered by artificial intelligence.
              Choose your goals and experience level for the perfect fitness
              routine.
            </p>
          </div>
        </div>

        {/* Notification Messages */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 px-4">
            <div className="bg-linear-to-r from-red-500 to-pink-500 text-white p-4 rounded-xl shadow-lg animate-bounce border border-red-400">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="max-w-4xl mx-auto mb-6 px-4">
            <div className="bg-linear-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-lg animate-pulse border border-green-400">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎉</span>
                <span className="font-semibold">{success}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form Section */}
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Customize Your Plan
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Goal Selection */}
              <div>
                <label className="block text-lg font-semibold text-white mb-4">
                  🎯 Your Goal
                </label>
                <div className="space-y-3">
                  {goalOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setGoal(option.value)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        goal === option.value
                          ? "bg-linear-to-r from-purple-500 to-pink-500 shadow-lg ring-2 ring-purple-300"
                          : "bg-white/5 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{option.icon}</span>
                        <div>
                          <div
                            className={`font-semibold ${goal === option.value ? "text-white" : "text-gray-300"}`}
                          >
                            {option.label}
                          </div>
                          <div
                            className={`text-sm ${goal === option.value ? "text-purple-100" : "text-gray-400"}`}
                          >
                            {option.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Selection */}
              <div>
                <label className="block text-lg font-semibold text-white mb-4">
                  📊 Experience Level
                </label>
                <div className="space-y-3">
                  {experienceOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setExperience(option.value)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        experience === option.value
                          ? "bg-linear-to-r from-blue-500 to-purple-500 shadow-lg ring-2 ring-blue-300"
                          : "bg-white/5 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{option.icon}</span>
                        <div>
                          <div
                            className={`font-semibold ${experience === option.value ? "text-white" : "text-gray-300"}`}
                          >
                            {option.label}
                          </div>
                          <div
                            className={`text-sm ${experience === option.value ? "text-blue-100" : "text-gray-400"}`}
                          >
                            {option.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={generateWorkout}
                disabled={loading || !goal || !experience}
                className={`px-12 py-4 rounded-full font-bold text-lg transition-all duration-300 transform ${
                  loading || !goal || !experience
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-linear-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl hover:scale-105 text-white"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Generating Your Plan...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🚀</span>
                    Generate Workout Plan
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Workout Plan Display */}
        {plan.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Your Personalized Workout Plan
              </h2>
              <p className="text-xl text-gray-300">
                Follow this AI-generated plan to achieve your fitness goals! 💪
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {plan.map((day, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                >
                  {/* Day Header */}
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-linear-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {day.day}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {day.workout}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Day {day.day} Workout
                      </p>
                    </div>
                  </div>

                  {/* Workout Image */}
                  {day.image && (
                    <div className="mb-4">
                      <img
                        src={day.image}
                        alt={day.workout}
                        className="w-full h-32 object-cover rounded-xl shadow-lg"
                      />
                    </div>
                  )}

                  {/* Exercises */}
                  {day.exercises && day.exercises.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <span className="mr-2">🏋️</span>
                        Exercises
                      </h4>
                      <div className="space-y-2">
                        {day.exercises.map((exercise, exIndex) => (
                          <div
                            key={exIndex}
                            className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors duration-200"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-gray-200 font-medium">
                                {exercise.name || exercise}
                              </span>
                              <span className="text-purple-300 font-semibold text-sm bg-purple-500/20 px-2 py-1 rounded-full">
                                {exercise.sets || 3} × {exercise.reps || 10}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rest Day */}
                  {(!day.exercises || day.exercises.length === 0) && (
                    <div className="text-center py-8">
                      <span className="text-4xl mb-2 block">😴</span>
                      <p className="text-gray-400 font-medium">Rest Day</p>
                      <p className="text-gray-500 text-sm">
                        Take it easy, recover well!
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AiTrainer;
