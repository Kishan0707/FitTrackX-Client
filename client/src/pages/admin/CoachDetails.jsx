import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import API from "../../services/api";
import {
  FaUserTie,
  FaUsers,
  FaDumbbell,
  FaAppleAlt,
  FaArrowLeft,
  FaPlus,
  FaTimes,
  FaChartLine,
  FaClock,
  FaStar,
  FaHistory,
  FaChartBar,
} from "react-icons/fa";
import ActivityTimeline from "../../components/ActivityTimeline";
import ClientProgress from "../../components/ClientProgress";

const CoachDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableClients, setAvailableClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [activeTab, setActiveTab] = useState("clients");

  useEffect(() => {
    fetchCoachDetails();
    fetchAvailableClients();
  }, [id]);

  const fetchCoachDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/admin/coaches/${id}`);
      setCoach(res.data.data);
      console.log("SetCoach:", res.data.data);
    } catch (error) {
      console.error("Failed to fetch coach details", error);
      showMessage("Failed to fetch coach details", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClients = async () => {
    try {
      const res = await API.get("/admin/users");
      const clients = res.data.data.filter(
        (user) => user.role === "user" && !user.assignedCoach,
      );
      setAvailableClients(clients);
    } catch (error) {
      console.error("Failed to fetch clients", error);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAssignClient = async () => {
    if (!selectedClient) {
      showMessage("Please select a client", "error");
      return;
    }

    try {
      await API.post(`/admin/coaches/${id}/assign-client`, {
        clientId: selectedClient,
      });
      showMessage("Client assigned successfully", "success");
      setShowAssignModal(false);
      setSelectedClient("");
      fetchCoachDetails();
      fetchAvailableClients();
    } catch (error) {
      console.error("Failed to assign client", error);
      showMessage("Failed to assign client", "error");
    }
  };

  const handleUnassignClient = async (clientId) => {
    if (window.confirm("Are you sure you want to unassign this client?")) {
      try {
        await API.post(`/admin/coaches/${id}/unassign-client`, { clientId });
        showMessage("Client unassigned successfully", "success");
        fetchCoachDetails();
        fetchAvailableClients();
      } catch (error) {
        console.error("Failed to unassign client", error);
        showMessage("Failed to unassign client", "error");
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen p-6 bg-slate-900">
          <div className="animate-pulse">
            <div className="w-1/4 h-8 mb-6 rounded bg-slate-700"></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="h-32 rounded bg-slate-700"></div>
              <div className="h-32 rounded bg-slate-700"></div>
              <div className="h-32 rounded bg-slate-700"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!coach) {
    return (
      <DashboardLayout>
        <div className="min-h-screen p-6 bg-slate-900">
          <div className="text-center text-white">Coach not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 bg-slate-900">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate("/admin/coaches")}
              className="transition text-slate-400 hover:text-white"
            >
              <FaArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-white">Coach Details</h1>
          </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                messageType === "success"
                  ? "bg-green-500/20 border border-green-500 text-green-400"
                  : "bg-red-500/20 border border-red-500 text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* Coach Profile Card */}
          <div className="p-6 mb-6 border bg-slate-800 border-slate-700 rounded-xl">
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20">
                <FaUserTie className="text-4xl text-red-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    {coach.name}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      coach.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {coach.status}
                  </span>
                </div>
                <p className="mb-1 text-slate-400">{coach.email}</p>
                <p className="mb-3 text-slate-400">{coach.phone}</p>
                {coach.specialization && (
                  <div className="flex items-center gap-2 mb-2">
                    <FaStar className="text-yellow-500" />
                    <span className="text-slate-300">
                      Specialization: {coach.specialization}
                    </span>
                  </div>
                )}
                {coach.experience && (
                  <div className="flex items-center gap-2 mb-2">
                    <FaClock className="text-blue-500" />
                    <span className="text-slate-300">
                      Experience: {coach.experience} years
                    </span>
                  </div>
                )}
                {coach.bio && (
                  <p className="mt-3 text-slate-300">{coach.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
            <div className="p-4 border bg-slate-800 border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <FaUsers className="text-2xl text-blue-500" />
                <div>
                  <p className="text-sm text-slate-400">Total Clients</p>
                  <p className="text-2xl font-bold text-white">
                    {coach.clientCount || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border bg-slate-800 border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <FaDumbbell className="text-2xl text-red-500" />
                <div>
                  <p className="text-sm text-slate-400">Workouts Created</p>
                  <p className="text-2xl font-bold text-white">
                    {coach.performance?.totalWorkoutsCreated || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border bg-slate-800 border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <FaAppleAlt className="text-2xl text-green-500" />
                <div>
                  <p className="text-sm text-slate-400">Diets Created</p>
                  <p className="text-2xl font-bold text-white">
                    {coach.performance?.totalDietsCreated || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border bg-slate-800 border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <FaChartLine className="text-2xl text-purple-500" />
                <div>
                  <p className="text-sm text-slate-400">Retention Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {coach.performance?.retentionRate !== null &&
                    coach.performance?.retentionRate !== undefined
                      ? `${coach.performance.retentionRate}%`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-700">
            <button
              onClick={() => setActiveTab("clients")}
              className={`px-4 py-3 font-medium transition flex items-center gap-2 ${
                activeTab === "clients"
                  ? "text-red-500 border-b-2 border-red-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FaUsers /> Clients
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-4 py-3 font-medium transition flex items-center gap-2 ${
                activeTab === "activity"
                  ? "text-red-500 border-b-2 border-red-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FaHistory /> Activity Timeline
            </button>
            <button
              onClick={() => setActiveTab("progress")}
              className={`px-4 py-3 font-medium transition flex items-center gap-2 ${
                activeTab === "progress"
                  ? "text-red-500 border-b-2 border-red-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FaChartBar /> Client Progress
            </button>
          </div>

          {/* Clients Section */}
          {activeTab === "clients" && (
            <div className="p-6 border bg-slate-800 border-slate-700 rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Assigned Clients
                </h3>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-white transition bg-red-500 rounded-lg hover:bg-red-600"
                >
                  <FaPlus /> Assign Client
                </button>
              </div>

              {coach.clients && coach.clients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-left uppercase text-slate-300">
                          Name
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-left uppercase text-slate-300">
                          Email
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-left uppercase text-slate-300">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-left uppercase text-slate-300">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-left uppercase text-slate-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {coach.clients.map((client) => (
                        <tr key={client._id} className="hover:bg-slate-700/50">
                          <td className="px-6 py-4 text-white">
                            {client.name}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {client.email}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {client.phone || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {new Date(client.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUnassignClient(client._id)}
                                className="text-red-400 hover:text-red-300"
                                title="Unassign"
                              >
                                <FaTimes size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setActiveTab("progress");
                                }}
                                className="text-blue-400 hover:text-blue-300"
                                title="Track Progress"
                              >
                                <FaChartLine size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  No clients assigned yet
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline Tab */}
          {activeTab === "activity" && <ActivityTimeline coachId={id} />}

          {/* Client Progress Tab */}
          {activeTab === "progress" && <ClientProgress coachId={id} />}
        </div>
      </div>

      {/* Assign Client Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md p-6 border bg-slate-800 border-slate-700 rounded-xl">
            <h2 className="mb-6 text-2xl font-bold text-white">
              Assign Client to Coach
            </h2>
            <div className="mb-6">
              <label className="block mb-2 text-sm text-slate-300">
                Select Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-2 text-white border rounded-lg bg-slate-700 border-slate-600 focus:outline-none focus:border-red-500"
              >
                <option value="">Choose a client...</option>
                {availableClients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
              {availableClients.length === 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  No available clients to assign
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAssignClient}
                disabled={!selectedClient}
                className="flex-1 px-4 py-2 text-white transition bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Assign
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedClient("");
                }}
                className="flex-1 px-4 py-2 text-white transition rounded-lg bg-slate-700 hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CoachDetails;
