import { useState, useEffect } from "react";
import API from "../services/api";
import {
  FaUserPlus,
  FaUserMinus,
  FaDumbbell,
  FaAppleAlt,
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaTrophy,
  FaFilter,
} from "react-icons/fa";

const ActivityTimeline = ({ coachId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  console.log("ActivityTimeline - coachId:", coachId);

  useEffect(() => {
    fetchActivities();
  }, [coachId, filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? `?type=${filter}` : "";
      const url = `/admin/coaches/${coachId}/activity${params}`;
      console.log("Fetching activities from:", url);
      const res = await API.get(url);
      console.log("Activities response:", res.data);
      setActivities(res.data.data);
    } catch (error) {
      console.error("Failed to fetch activities", error);
      console.error("Error response:", error.response);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      client_assigned: <FaUserPlus className="text-green-500" />,
      client_unassigned: <FaUserMinus className="text-red-500" />,
      workout_created: <FaDumbbell className="text-blue-500" />,
      diet_created: <FaAppleAlt className="text-green-500" />,
      session_completed: <FaCheckCircle className="text-purple-500" />,
      profile_updated: <FaEdit className="text-yellow-500" />,
      message_sent: <FaEnvelope className="text-blue-400" />,
      goal_set: <FaTrophy className="text-orange-500" />,
      progress_updated: <FaCheckCircle className="text-teal-500" />,
    };
    return icons[type] || <FaCheckCircle className="text-slate-500" />;
  };

  const formatDate = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 border bg-slate-800 border-slate-700 rounded-xl">
        <div className="space-y-4 animate-pulse">
          <div className="w-3/4 h-4 rounded bg-slate-700"></div>
          <div className="w-1/2 h-4 rounded bg-slate-700"></div>
          <div className="w-2/3 h-4 rounded bg-slate-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border bg-slate-800 border-slate-700 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Activity Timeline</h3>
        <div className="flex items-center gap-2">
          <FaFilter className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 text-sm text-white border rounded-lg bg-slate-700 border-slate-600 focus:outline-none focus:border-red-500"
          >
            <option value="all">All Activities</option>
            <option value="client_assigned">Client Assigned</option>
            <option value="client_unassigned">Client Unassigned</option>
            <option value="workout_created">Workouts</option>
            <option value="diet_created">Diets</option>
            <option value="progress_updated">Progress</option>
          </select>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          No activities found
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className="flex gap-4 p-4 transition rounded-lg bg-slate-700/50 hover:bg-slate-700"
            >
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-slate-800">
                {getActivityIcon(activity.activityType)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{activity.description}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {formatDate(activity.createdAt)}
                </p>
                {activity.metadata &&
                  Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      {JSON.stringify(activity.metadata)}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
