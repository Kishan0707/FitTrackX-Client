import { useState, useEffect } from "react";
import API from "../services/api";
import {
  FaUser,
  FaBell,
  FaLock,
  FaCog,
  FaEye,
  FaTrash,
  FaSave,
  FaCamera,
} from "react-icons/fa";
import DashboardLayout from "../layout/DashboardLayout";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Profile State
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    profilePicture: "",
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    theme: "dark",
    language: "en",
    units: "metric",
    timezone: "Asia/Kolkata",
  });

  // Privacy State
  const [privacy, setPrivacy] = useState({
    profileVisibility: "private",
    showWorkoutHistory: false,
    showDietPlans: false,
  });

  // Notifications State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    workoutReminders: true,
    dietReminders: true,
    pushNotifications: false,
  });

  // Password State
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch Settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await API.get("/settings");
      const data = res.data.data;

      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        profilePicture: data.profilePicture || "",
      });

      setPreferences(data.preferences || {});
      setPrivacy(data.privacy || {});
      setNotifications(data.notifications || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      showMessage("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  // Profile Update
  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      await API.put("/settings/profile", profile);
      showMessage("Profile updated successfully", "success");
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Error updating profile",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Preferences Update
  const handlePreferencesUpdate = async () => {
    try {
      setLoading(true);
      await API.put("/settings/preferences", preferences);
      showMessage("Preferences updated successfully", "success");
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Error updating preferences",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Privacy Update
  const handlePrivacyUpdate = async () => {
    try {
      setLoading(true);
      await API.put("/settings/privacy", privacy);
      showMessage("Privacy settings updated successfully", "success");
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Error updating privacy",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Notifications Update
  const handleNotificationsUpdate = async () => {
    try {
      setLoading(true);
      await API.put("/settings/notifications", notifications);
      showMessage("Notification settings updated successfully", "success");
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Error updating notifications",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Password Change
  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }

    try {
      setLoading(true);
      await API.put("/settings/password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });
      showMessage("Password changed successfully", "success");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Error changing password",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Profile Picture Upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("profilePicture", file);
      const res = await API.post("/settings/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile({ ...profile, profilePicture: res.data.data.profilePicture });
      showMessage("Profile picture updated successfully", "success");
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Error uploading picture",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    const password = prompt("Enter your password to confirm account deletion:");
    if (!password) return;

    if (window.confirm("Are you sure? This action cannot be undone.")) {
      try {
        setLoading(true);
        await API.delete("/settings/account", { data: { password } });
        showMessage("Account deleted successfully", "success");
        setTimeout(() => (window.location.href = "/login"), 2000);
      } catch (error) {
        showMessage(
          error.response?.data?.message || "Error deleting account",
          "error",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-6 bg-slate-900 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

          {/* Message Alert */}
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

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700">
            {[
              { id: "profile", label: "Profile", icon: FaUser },
              { id: "preferences", label: "Preferences", icon: FaCog },
              { id: "privacy", label: "Privacy", icon: FaEye },
              { id: "notifications", label: "Notifications", icon: FaBell },
              { id: "account", label: "Account", icon: FaLock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition ${
                    activeTab === tab.id
                      ? "text-red-500 border-b-2 border-red-500"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">
                  Profile Settings
                </h2>

                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUser size={40} className="text-slate-400" />
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                    <div className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
                      <FaCamera size={16} />
                      Upload Picture
                    </div>
                  </label>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      rows="4"
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <FaSave size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Preferences</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">
                      Theme
                    </label>
                    <select
                      value={preferences.theme}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          theme: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm mb-2">
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => {
                        setPreferences({
                          ...preferences,
                          language: e.target.value,
                        });
                        localStorage.setItem("language", e.target.value);
                      }}
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                    >
                      <option value="en">🇺🇸 English</option>
                      <option value="es">🇪🇸 Español</option>
                      <option value="fr">🇫🇷 Français</option>
                      <option value="de">🇩🇪 Deutsch</option>
                      <option value="hi">🇮🇳 Hindi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm mb-2">
                      Units
                    </label>
                    <select
                      value={preferences.units}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          units: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                    >
                      <option value="metric">Metric (kg, cm)</option>
                      <option value="imperial">Imperial (lbs, inches)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm mb-2">
                      Timezone
                    </label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          timezone: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">
                        America/New_York (EST)
                      </option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handlePreferencesUpdate}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  <FaSave size={16} />
                  Save Preferences
                </button>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">
                  Privacy Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={privacy.profileVisibility}
                      onChange={(e) =>
                        setPrivacy({
                          ...privacy,
                          profileVisibility: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <label className="text-slate-300">
                      Show Workout History
                    </label>
                    <input
                      type="checkbox"
                      checked={privacy.showWorkoutHistory}
                      onChange={(e) =>
                        setPrivacy({
                          ...privacy,
                          showWorkoutHistory: e.target.checked,
                        })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <label className="text-slate-300">Show Diet Plans</label>
                    <input
                      type="checkbox"
                      checked={privacy.showDietPlans}
                      onChange={(e) =>
                        setPrivacy({
                          ...privacy,
                          showDietPlans: e.target.checked,
                        })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePrivacyUpdate}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  <FaSave size={16} />
                  Save Privacy Settings
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">
                  Notification Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <label className="text-slate-300">
                      Email Notifications
                    </label>
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <label className="text-slate-300">Workout Reminders</label>
                    <input
                      type="checkbox"
                      checked={notifications.workoutReminders}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          workoutReminders: e.target.checked,
                        })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <label className="text-slate-300">Diet Reminders</label>
                    <input
                      type="checkbox"
                      checked={notifications.dietReminders}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          dietReminders: e.target.checked,
                        })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <label className="text-slate-300">Push Notifications</label>
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          pushNotifications: e.target.checked,
                        })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleNotificationsUpdate}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  <FaSave size={16} />
                  Save Notification Settings
                </button>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">
                  Account Settings
                </h2>

                {/* Change Password */}
                <div className="bg-slate-700/50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-300 text-sm mb-2">
                        Old Password
                      </label>
                      <input
                        type="password"
                        value={passwords.oldPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            oldPassword: e.target.value,
                          })
                        }
                        className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <button
                      onClick={handlePasswordChange}
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                    >
                      <FaSave size={16} />
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Deleting your account is permanent and cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <FaTrash size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
