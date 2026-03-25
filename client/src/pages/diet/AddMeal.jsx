import { useState } from "react";
import React from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import API from "../../services/api";
import Diet from "./Diet";

const AddMeal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    mealName: "",
    foodName: "",
    calories: "",
    protein: "",
    carbs: "", // Fixed typo: cabs -> carbs
    fat: "",
    quantity: "", // Added quantity
  });
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.mealName ||
      !formData.foodName ||
      !formData.calories ||
      !formData.protein ||
      !formData.carbs ||
      !formData.fat
    ) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // eslint-disable-next-line no-unused-vars
      const res = await API.post("/diet", {
        meals: [
          // Fixed: meal -> meals
          {
            mealName: formData.mealName,
            foods: [
              // Added foods array
              {
                foodName: formData.foodName,
                quantity: parseFloat(formData.quantity) || 1, // Added quantity, default 1
                calories: parseFloat(formData.calories),
                protein: parseFloat(formData.protein),
                carbs: parseFloat(formData.carbs), // Fixed: cabs -> carbs
                fat: parseFloat(formData.fat),
                sugar: 0, // Added, default 0
                sodium: 0, // Added, default 0
              },
            ],
          },
        ],
      });

      setSuccess("Meal Added Successfully"); // Fixed: set to string
    } catch (err) {
      setError(err.response?.data?.message || "Server is not responding"); // Fixed message
    } finally {
      setLoading(false);
    }
  };
  return (
    <DashboardLayout>
      {error && (
        <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-500 text-white p-2 rounded mb-4">
          Meal Added Successfully
        </div>
      )}
      <div className="flex flex-col  items-center justify-center p-5  bg-slate-800 my-5 h-96 w-full max-w-2xl rounded-2xl mx-auto">
        <h1 className="text-2xl font-bold mt-6">Add Meal</h1>
        <form className=" mb-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:p-6">
            <input
              type="text"
              className="bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0 p-2 col-span-1 md:col-span-2 lg:col-span-3 w-full"
              name="mealName"
              onChange={handleChange}
              value={formData.mealName}
              placeholder="Meal Name"
            />
            <input
              type="text"
              className=" rounded w-full bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0 p-2"
              name="foodName"
              onChange={handleChange}
              value={formData.foodName}
              placeholder="Food name"
            />
            <input
              type="number"
              className="bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0 p-2 rounded w-full"
              name="calories"
              onChange={handleChange}
              value={formData.calories}
              placeholder="Calories"
            />
            <input
              type="number"
              className="bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0 p-2 rounded w-full"
              name="protein"
              onChange={handleChange}
              value={formData.protein}
              placeholder="Protein"
            />
            <input
              type="number"
              className="bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0 p-2 rounded w-full"
              name="carbs"
              onChange={handleChange}
              value={formData.carbs}
              placeholder="Carbs"
            />
            <input
              type="number"
              className="bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0 p-2 rounded w-full"
              name="fat"
              onChange={handleChange}
              value={formData.fat}
              placeholder="Fat"
            />
            <input
              type="number"
              className="bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0 p-2 rounded w-full"
              name="quantity"
              onChange={handleChange}
              value={formData.quantity}
              placeholder="Quantity (e.g., 100)"
            />

            <button className="bg-green-500 my-5 px-4 py-2 rounded hover:bg-green-600 col-span-1 md:col-span-2 lg:col-span-3 w-full">
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Please wait
                </span>
              ) : (
                "Add Meal"
              )}
            </button>
          </div>
        </form>
      </div>
      <Diet />
    </DashboardLayout>
  );
};

export default AddMeal;
