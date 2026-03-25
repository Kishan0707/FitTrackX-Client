// import { useEffect, useState } from "react";
import React, { useState } from "react";
import API from "../services/api";

const UserCard = ({ user, onUserDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      await API.delete(`/admin/users/${user._id}`);
      onUserDeleted(user._id);
      setShowConfirm(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  return (
    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-700">
      <div className="flex flex-col md:flex-row items-start justify-around">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-100">
                {user.name}
              </h3>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center">
              <span className="text-gray-400 w-16">Role:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === "admin"
                    ? "bg-red-500/20 text-red-300"
                    : user.role === "coach"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-green-500/20 text-green-300"
                }`}
              >
                {user.role || "user"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 w-16">Joined:</span>
              <span className="text-gray-300 text-sm">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="ml-4">
          {!showConfirm ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span className="">Delete</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-1"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Confirm</span>
                  </>
                )}
              </button>
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {showConfirm && !deleting && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">
            Are you sure you want to delete <strong>{user.name}</strong>? This
            action cannot be undone.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserCard;
