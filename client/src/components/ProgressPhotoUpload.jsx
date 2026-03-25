import React, { useState } from "react";
import API from "../services/api";

const ProgressPhotoUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const uploadPhoto = async () => {
    if (!file) {
      setError("Please select a photo");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("notes", notes);

    try {
      setLoading(true);
      setError("");
      const response = await API.post("/progress-photo/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Photo uploaded successfully!");
      setFile(null);
      setNotes("");
      setPreview(null);

      if (onUploadSuccess) {
        onUploadSuccess(response.data.data);
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error.response?.data?.message || "Failed to upload photo");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <h3 className="text-xl font-bold mb-4 text-white">
        Upload Progress Photo
      </h3>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-400 p-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-slate-400 mb-2">Select Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full bg-slate-900 text-white px-4 py-2 rounded border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-w-md h-64 object-cover rounded-lg border border-slate-700"
            />
          </div>
        )}

        <div>
          <label className="block text-slate-400 mb-2">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about your progress..."
            className="w-full bg-slate-900 text-white px-4 py-2 rounded border border-slate-700 focus:outline-none focus:border-blue-500 h-24 resize-none"
          />
        </div>

        <button
          onClick={uploadPhoto}
          disabled={loading || !file}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition font-semibold"
        >
          {loading ? "Uploading..." : "Upload Photo"}
        </button>
      </div>
    </div>
  );
};

export default ProgressPhotoUpload;
