import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import API from "../../services/api";
import {
  FaUserTie,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaChartLine,
  FaSearch,
  FaFilter,
  FaEye,
} from "react-icons/fa";

const CoachManagement = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    experience: "",
    bio: "",
    status: "active",
  });

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/coaches");
      setCoaches(res.data.data);
    } catch (error) {
      showMessage("Failed to fetch coaches", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleOpenModal = (type, coach = null) => {
    setModalType(type);
    setSelectedCoach(coach);
    if (coach) {
      setFormData({
        name: coach.name || "",
        email: coach.email || "",
        password: "",
        phone: coach.phone || "",
        specialization: coach.specialization || "",
        experience: coach.experience || "",
        bio: coach.bio || "",
        status: coach.status || "active",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        specialization: "",
        experience: "",
        bio: "",
        status: "active",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCoach(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      specialization: "",
      experience: "",
      bio: "",
      status: "active",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "add") {
        await API.post("/admin/coaches", formData);
        showMessage("Coach added successfully", "success");
      } else {
        await API.put(`/admin/coaches/${selectedCoach._id}`, formData);
        showMessage("Coach updated successfully", "success");
      }
      fetchCoaches();
      handleCloseModal();
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Operation failed",
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this coach?")) {
      try {
        await API.delete(`/admin/coaches/${id}`);
        showMessage("Coach deleted successfully", "success");
        fetchCoaches();
      } catch (error) {
        showMessage("Failed to delete coach", "error");
      }
    }
  };

  const filteredCoaches = coaches.filter((coach) => {
    const matchesSearch =
      coach.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || coach.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-slate-900 min-h-screen">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="h-24 bg-slate-700 rounded"></div>
              <div className="h-24 bg-slate-700 rounded"></div>
              <div className="h-24 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Coach Management</h1>
            <button
              onClick={() => handleOpenModal("add")}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <FaPlus /> Add Coach
            </button>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FaUserTie className="text-red-500 text-2xl" />
                <div>
                  <p className="text-slate-400 text-sm">Total Coaches</p>
                  <p className="text-2xl font-bold text-white">
                    {coaches.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FaChartLine className="text-green-500 text-2xl" />
                <div>
                  <p className="text-slate-400 text-sm">Active Coaches</p>
                  <p className="text-2xl font-bold text-white">
                    {coaches.filter((c) => c.status === "active").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FaUsers className="text-blue-500 text-2xl" />
                <div>
                  <p className="text-slate-400 text-sm">Total Clients</p>
                  <p className="text-2xl font-bold text-white">
                    {coaches.reduce((sum, c) => sum + (c.clientCount || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search coaches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <FaFilter className="text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Coaches Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      Coach
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      Clients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredCoaches.map((coach) => (
                    <tr key={coach._id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <FaUserTie className="text-red-500" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {coach.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300 text-sm">{coach.email}</p>
                        <p className="text-slate-400 text-xs">{coach.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300">
                          {coach.specialization || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300">
                          {coach.experience || "0"} years
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300">
                          {coach.clientCount || 0}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            coach.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {coach.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/coaches/${coach._id}`)}
                            className="text-green-400 hover:text-green-300"
                            title="View Details"
                          >
                            <FaEye size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenModal("edit", coach)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Edit"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(coach._id)}
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              {modalType === "add" ? "Add New Coach" : "Edit Coach"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              {modalType === "add" && (
                <div>
                  <label className="block text-slate-300 text-sm mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Experience (years)
                </label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows="3"
                  className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                >
                  {modalType === "add" ? "Add Coach" : "Update Coach"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CoachManagement;
