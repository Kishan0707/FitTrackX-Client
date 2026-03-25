import { useEffect, useState } from "react";
import React from "react";
import API from "../services/api";

const GrocerySuggestion = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    const fetchFood = async () => {
      try {
        const response = await API.get("/diet/grocery-suggestion");
        if (response.data.success) {
          setFoods(response.data.suggestion);
          console.log("foods", response.data);
          setLoading(false);
          setSuccess("Fetched foods successfully");
          setTimeout(() => setSuccess(""), 3000);
          setError("");
        }
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError("Failed to fetch foods");
        setLoading(false);
      }
    };
    fetchFood();
  }, []);
  return (
    <div className="bg-slate-900 p-6 mt-6 rounded-xl w-full ">
      {success && (
        <div className="bg-green-500 text-white p-2 rounded mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>
      )}
      <h2 className="text-2xl font-bold text-white my-5">Grocery Suggestion</h2>
      <div className="flex flex-wrap gap-4 items-center justify-center">
        {loading ? (
          <p className="text-white">Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          foods.map((food, index) => (
            <div
              key={index}
              className="bg-slate-800 p-4 rounded-lg shadow-md w-40 border border-slate-700 hover:border hover:border-blue-500"
            >
              {food}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GrocerySuggestion;
