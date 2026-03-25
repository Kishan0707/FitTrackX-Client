import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../services/api";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/reset-password", {
        token,
        password,
      });

      alert("Password updated successfully ✅");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg w-80"
      >
        <h2 className="text-xl mb-4 text-black dark:text-white">
          Reset Password
        </h2>

        <input
          type="password"
          placeholder="Enter new password"
          className="w-full p-2 mb-4 rounded border"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full bg-green-500 text-white p-2 rounded">
          Update Password
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;
