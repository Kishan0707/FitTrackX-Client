import { useState, useEffect } from "react";
import API from "../services/api";
import {
  FaWeight,
  FaRuler,
  FaTrophy,
  FaPlus,
  FaChartLine,
  FaCalendar,
  FaEdit,
} from "react-icons/fa";

const ClientProgress = ({ coachId }) => {
  const [progressList, setProgressList] = useState([]);
  const [coachClients, setCoachClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "init", "update", "achievement"
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    weight: "",
    bodyFat: "",
    chest: "",
    waist: "",
    hips: "",
    arms: "",
    thighs: "",
    notes: "",
  });

  const [goalData, setGoalData] = useState({
    targetWeight: "",
    targetBodyFat: "",
    deadline: "",
    description: "",
  });

  const [achievementData, setAchievementData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchClientsProgress();
    fetchCoachClients();
  }, [coachId]);

  const fetchCoachClients = async () => {
    try {
      const res = await API.get(`/admin/coaches/${coachId}`);
      if (!res) {
        setError("Failed to fetch coach clients");
        setSuccess("");
        return;
      }
      setCoachClients(res.data.data.clients || []);
    } catch (error) {
      console.error("Failed to fetch coach clients", error);
      setError("Failed to fetch coach clients");
    }
  };

  const fetchClientsProgress = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/admin/coaches/${coachId}/clients-progress`);
      console.log("Progress data:", res.data.data);
      setProgressList(res.data.data);
    } catch (error) {
      console.error("Failed to fetch progress", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitProgress = async (client) => {
    setSelectedClient({ clientId: client });
    setModalType("init");
    setShowModal(true);
  };

  const handleAddUpdate = async (client) => {
    setSelectedClient(client);
    setModalType("update");
    setShowModal(true);
  };

  const handleAddAchievement = async (client) => {
    setSelectedClient(client);
    setModalType("achievement");
    setSuccess("Achievement Added");
    setShowModal(true);
  };

  const submitInitProgress = async () => {
    try {
      await API.post(
        `/admin/coaches/${coachId}/clients/${selectedClient.clientId._id}/progress`,
        {
          goals: goalData,
          initialStats: {
            weight: parseFloat(formData.weight),
            bodyFat: parseFloat(formData.bodyFat),
            measurements: {
              chest: parseFloat(formData.chest),
              waist: parseFloat(formData.waist),
              hips: parseFloat(formData.hips),
              arms: parseFloat(formData.arms),
              thighs: parseFloat(formData.thighs),
            },
          },
        },
      );
      setSuccess("Progress tracking initialized!");
      fetchClientsProgress();
      closeModal();
    } catch (error) {
      console.error(
        error.response?.data?.message || "Failed to initialize progress",
      );
      setError("Failed to initialize progress");
    }
  };

  const submitUpdate = async () => {
    try {
      const res = await API.post(
        `/admin/coaches/${coachId}/clients/${selectedClient.clientId._id}/progress/update`,
        {
          weight: parseFloat(formData.weight),
          bodyFat: parseFloat(formData.bodyFat),
          measurements: {
            chest: parseFloat(formData.chest),
            waist: parseFloat(formData.waist),
            hips: parseFloat(formData.hips),
            arms: parseFloat(formData.arms),
            thighs: parseFloat(formData.thighs),
          },
          notes: formData.notes,
        },
      );
      if (!res || res.data.length === 0) {
        return setError("Failed to update progress");
      }
      setSuccess("Progress updated!");
      fetchClientsProgress();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update progress");
    }
  };

  const submitAchievement = async () => {
    try {
      await API.post(
        `/admin/coaches/${coachId}/clients/${selectedClient.clientId._id}/progress/achievement`,
        achievementData,
      );
      alert("Achievement added!");
      fetchClientsProgress();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add achievement");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    setFormData({
      weight: "",
      bodyFat: "",
      chest: "",
      waist: "",
      hips: "",
      arms: "",
      thighs: "",
      notes: "",
    });
    setGoalData({
      targetWeight: "",
      targetBodyFat: "",
      deadline: "",
      description: "",
    });
    setAchievementData({
      title: "",
      description: "",
    });
  };

  if (loading) {
    return (
      <div className="p-6 border bg-slate-800 border-slate-700 rounded-xl">
        <div className="space-y-4 animate-pulse">
          <div className="w-3/4 h-4 rounded bg-slate-700"></div>
          <div className="w-1/2 h-4 rounded bg-slate-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border bg-slate-800 border-slate-700 rounded-xl">
      <h3 className="mb-6 text-xl font-bold text-white">
        Client Progress Tracking
      </h3>

      {/* Clients without progress tracking */}
      {coachClients.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 font-semibold text-white">
            Start Tracking Progress
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {coachClients
              .filter(
                (client) =>
                  !progressList.find((p) => p.clientId?._id === client._id),
              )
              .map((client) => (
                <div
                  key={client._id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-slate-700/50 border-slate-600"
                >
                  <div>
                    <p className="font-medium text-white">{client.name}</p>
                    <p className="text-xs text-slate-400">{client.email}</p>
                  </div>
                  <button
                    onClick={() => handleInitProgress(client)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                  >
                    <FaPlus size={12} /> Track
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {progressList.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          No progress data available. Start tracking client progress!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {progressList.map((progress) => (
            <div
              key={progress._id}
              className="p-4 border rounded-lg bg-slate-700/50 border-slate-600"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {progress.clientId?.name}
                  </h4>
                  <p className="text-sm text-slate-400">
                    {progress.clientId?.email}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    progress.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : progress.status === "completed"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {progress.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-400">Progress</span>
                  <span className="font-semibold text-white">
                    {Math.round(progress.progressPercentage || 0)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-600">
                  <div
                    className="h-2 transition-all rounded-full bg-linear-to-r from-red-500 to-orange-500"
                    style={{
                      width: `${Math.min(progress.progressPercentage || 0, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <FaWeight className="text-blue-400" />
                    <span className="text-xs text-slate-400">Current</span>
                  </div>
                  <p className="font-semibold text-white">
                    {progress.progressData[progress.progressData.length - 1]
                      ?.weight || "N/A"}{" "}
                    kg
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <FaChartLine className="text-green-400" />
                    <span className="text-xs text-slate-400">Target</span>
                  </div>
                  <p className="font-semibold text-white">
                    {progress.goals?.targetWeight || "N/A"} kg
                  </p>
                </div>
              </div>

              {/* Achievements */}
              {progress.achievements && progress.achievements.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaTrophy className="text-yellow-500" />
                    <span className="text-sm font-medium text-slate-300">
                      Achievements ({progress.achievements.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {progress.achievements
                      .slice(0, 3)
                      .map((achievement, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs text-yellow-400 rounded bg-yellow-500/20"
                        >
                          {achievement.title}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddUpdate(progress)}
                  className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-sm text-white transition bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  <FaEdit size={14} /> Update
                </button>
                <button
                  onClick={() => handleAddAchievement(progress)}
                  className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-sm text-white transition bg-green-500 rounded-lg hover:bg-green-600"
                >
                  <FaTrophy size={14} /> Achievement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="mb-6 text-2xl font-bold text-white">
              {modalType === "init" && "Initialize Progress Tracking"}
              {modalType === "update" && "Add Progress Update"}
              {modalType === "achievement" && "Add Achievement"}
            </h2>

            {/* Init Form */}
            {modalType === "init" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-slate-300">
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="w-full px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-slate-300">
                      Body Fat (%)
                    </label>
                    <input
                      type="number"
                      value={formData.bodyFat}
                      onChange={(e) =>
                        setFormData({ ...formData, bodyFat: e.target.value })
                      }
                      className="w-full px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    placeholder="Chest (cm)"
                    value={formData.chest}
                    onChange={(e) =>
                      setFormData({ ...formData, chest: e.target.value })
                    }
                    className="px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                  />
                  <input
                    type="number"
                    placeholder="Waist (cm)"
                    value={formData.waist}
                    onChange={(e) =>
                      setFormData({ ...formData, waist: e.target.value })
                    }
                    className="px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                  />
                  <input
                    type="number"
                    placeholder="Hips (cm)"
                    value={formData.hips}
                    onChange={(e) =>
                      setFormData({ ...formData, hips: e.target.value })
                    }
                    className="px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                  />
                </div>

                <h3 className="mt-6 mb-3 font-semibold text-white">Goals</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Target Weight (kg)"
                    value={goalData.targetWeight}
                    onChange={(e) =>
                      setGoalData({ ...goalData, targetWeight: e.target.value })
                    }
                    className="px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                  />
                  <input
                    type="date"
                    value={goalData.deadline}
                    onChange={(e) =>
                      setGoalData({ ...goalData, deadline: e.target.value })
                    }
                    className="px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                  />
                </div>

                <button
                  onClick={submitInitProgress}
                  className="w-full px-4 py-2 mt-4 text-white bg-red-500 rounded-lg hover:bg-red-600"
                >
                  Initialize Tracking
                </button>
              </div>
            )}

            {/* Update Form */}
            {modalType === "update" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    className="px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                  />
                  <input
                    type="number"
                    placeholder="Body Fat (%)"
                    value={formData.bodyFat}
                    onChange={(e) =>
                      setFormData({ ...formData, bodyFat: e.target.value })
                    }
                    className="px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                  />
                </div>
                <textarea
                  placeholder="Notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows="3"
                  className="w-full px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                />
                <button
                  onClick={submitUpdate}
                  className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  Add Update
                </button>
              </div>
            )}

            {/* Achievement Form */}
            {modalType === "achievement" && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Achievement Title"
                  value={achievementData.title}
                  onChange={(e) =>
                    setAchievementData({
                      ...achievementData,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                />
                <textarea
                  placeholder="Description"
                  value={achievementData.description}
                  onChange={(e) =>
                    setAchievementData({
                      ...achievementData,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600"
                />
                <button
                  onClick={submitAchievement}
                  className="w-full px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600"
                >
                  Add Achievement
                </button>
              </div>
            )}

            <button
              onClick={closeModal}
              className="w-full px-4 py-2 mt-3 text-white rounded-lg bg-slate-700 hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProgress;
