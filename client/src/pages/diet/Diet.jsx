import React, { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import { Link } from "react-router-dom";
import API from "../../services/api";
import MealCard from "../../components/MealCard"; // Added import
import MacroChart from "../../components/MacroChart"; // Added import
import GrocerySuggestion from "../../components/GrocerySuggestion"; // Added import

const Diet = () => {
  const [loading, setLoading] = useState(true);
  const [diet, setDiet] = useState(null); // Changed to null for better handling

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const res = await API.get("/diet/today");
        console.log(res);
        console.log("res", res.data);
        console.log("meal", res.data.meals);
        console.log(res.data.data);
        if (res.status === 200) {
          setDiet(res.data.data); // Only set to the diet data
        }
      } catch (err) {
        console.log(err);
        setDiet(null); // Handle error by setting to null
      } finally {
        setLoading(false);
      }
    };
    fetchMeal();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-lg">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <div className="bg-slate-800 p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Today's Diet</h1>
        <Link
          to="/add-meal"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Add Meal
        </Link>
      </div>
      {diet && diet.meals && diet.meals.length > 0 ? ( // Added check for meals array
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            {diet.meals.map(
              (
                meal,
                index, // Assuming diet has a meals array
              ) => (
                <MealCard key={meal._id || index} meal={meal} /> // Use meal._id if available
              ),
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2  gap-5 w-full">
            <MacroChart />
            <GrocerySuggestion />
          </div>
        </>
      ) : (
        <p>No diet data available for today.</p>
      )}
    </div>
  );
};

export default Diet;
