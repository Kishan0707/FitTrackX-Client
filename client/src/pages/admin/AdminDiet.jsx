import { useState, useEffect } from "react";
import API from "../../services/api";
import { FaTrash, FaEdit, FaPlus, FaTimes } from "react-icons/fa";
import DashboardLayout from "../../layout/DashboardLayout";

const AdminDiet = () => {
  const [diets, setDiets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    userId: "",
    meals: [
      {
        mealName: "",
        foods: [
          {
            foodName: "",
            quantity: "",
            calories: "",
            protein: "",
            carbs: "",
            fat: "",
            sugar: "",
            sodium: "",
          },
        ],
      },
    ],
  });
  // console.log("totalCalories:", diets);
  console.log("totalCalories:", diets.totalCalories);

  useEffect(() => {
    fetchUsers();
    fetchDiets();
  }, []);

  const fetchDiets = async () => {
    try {
      setLoading(true);
      const response = await API.get("/admin/diets");
      console.log("Diets response:", response.data);
      setDiets(response.data.data || []);
    } catch (error) {
      console.error(
        "Error fetching diets:",
        error.response?.data || error.message,
      );
      setDiets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await API.get("/admin/users");
      console.log("Users response:", response.data);
      const userData = response.data.data || [];
      setUsers(userData);
    } catch (error) {
      console.error(
        "Error fetching users:",
        error.response?.data || error.message,
      );
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleInputChange = (e, mealIndex = null, foodIndex = null) => {
    const { name, value } = e.target;

    if (mealIndex === null) {
      // Top level change (userId)
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (foodIndex === null) {
      // Meal level change
      setFormData((prev) => {
        const newMeals = [...prev.meals];
        newMeals[mealIndex] = {
          ...newMeals[mealIndex],
          [name]: value,
        };
        return { ...prev, meals: newMeals };
      });
    } else {
      // Food level change
      setFormData((prev) => {
        const newMeals = [...prev.meals];
        newMeals[mealIndex].foods[foodIndex] = {
          ...newMeals[mealIndex].foods[foodIndex],
          [name]: value,
        };
        return { ...prev, meals: newMeals };
      });
    }
  };

  const addFood = (mealIndex) => {
    setFormData((prev) => {
      const newMeals = [...prev.meals];
      newMeals[mealIndex].foods.push({
        foodName: "",
        quantity: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        sugar: "",
        sodium: "",
      });
      return { ...prev, meals: newMeals };
    });
  };

  const removeFood = (mealIndex, foodIndex) => {
    setFormData((prev) => {
      const newMeals = [...prev.meals];
      newMeals[mealIndex].foods.splice(foodIndex, 1);
      return { ...prev, meals: newMeals };
    });
  };

  const addMeal = () => {
    setFormData((prev) => ({
      ...prev,
      meals: [
        ...prev.meals,
        {
          mealName: "",
          foods: [
            {
              foodName: "",
              quantity: "",
              calories: "",
              protein: "",
              carbs: "",
              fat: "",
              sugar: "",
              sodium: "",
            },
          ],
        },
      ],
    }));
  };

  const removeMeal = (mealIndex) => {
    setFormData((prev) => {
      const newMeals = prev.meals.filter((_, i) => i !== mealIndex);
      return { ...prev, meals: newMeals };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/admin/diets/${editingId}`, formData);
      } else {
        await API.post("/admin/diets", formData);
      }
      fetchDiets();
      resetForm();
    } catch (error) {
      console.error(
        "Error saving diet:",
        error.response?.data || error.message,
      );
      alert("Error saving diet plan");
    }
  };

  const handleEdit = (diet) => {
    console.log("Editing diet:", diet);
    setFormData({
      userId: diet.userId?._id || diet.userId || "",
      meals: diet.meals || [
        {
          mealName: "",
          foods: [
            {
              foodName: "",
              quantity: "",
              calories: "",
              protein: "",
              carbs: "",
              fat: "",
              sugar: "",
              sodium: "",
            },
          ],
        },
      ],
    });
    setEditingId(diet._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this diet plan?")) {
      try {
        await API.delete(`/admin/diets/${id}`);
        fetchDiets();
      } catch (error) {
        console.error(
          "Error deleting diet:",
          error.response?.data || error.message,
        );
        alert("Error deleting diet plan");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      meals: [
        {
          mealName: "",
          foods: [
            {
              foodName: "",
              quantity: "",
              calories: "",
              protein: "",
              carbs: "",
              fat: "",
              sugar: "",
              sodium: "",
            },
          ],
        },
      ],
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-3 sm:p-6 bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-3xl font-bold text-white">Diet Management</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 text-white transition bg-red-500 rounded-lg hover:bg-red-600"
            >
              <FaPlus /> Add Diet Plan
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-slate-800 border-slate-700">
              <p className="text-sm text-slate-400">Total Diet Plans</p>
              <p className="text-2xl font-bold text-white">
                {diets?.length || 0}
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-slate-800 border-slate-700">
              <p className="text-sm text-slate-400">Avg Calories</p>
              <p className="text-2xl font-bold text-white">
                {diets && diets.length > 0
                  ? Math.round(
                      diets.reduce(
                        (sum, d) => sum + (d.totalCalories || 0),
                        0,
                      ) / diets.length,
                    )
                  : 0}
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-slate-800 border-slate-700">
              <p className="text-sm text-slate-400">Total Users</p>
              <p className="text-2xl font-bold text-white">
                {users?.length || 0}
              </p>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6 max-h-[80vh] overflow-y-auto">
              <h2 className="mb-4 text-xl font-bold text-white">
                {editingId ? "Edit Diet Plan" : "Create Diet Plan"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm text-slate-300">
                    User
                  </label>
                  <select
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-white border rounded-lg bg-slate-700 border-slate-600 focus:outline-none focus:border-red-500"
                  >
                    <option value="">
                      {usersLoading ? "Loading users..." : "Select User"}
                    </option>
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))
                    ) : (
                      <option disabled>No users available</option>
                    )}
                  </select>
                </div>

                {/* Meals */}
                <div className="space-y-4">
                  {formData.meals.map((meal, mealIndex) => (
                    <div
                      key={mealIndex}
                      className="p-4 border rounded-lg bg-slate-700 border-slate-600"
                    >
                      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:justify-between sm:items-center">
                        <h3 className="font-semibold text-slate-200">
                          Meal {mealIndex + 1}
                        </h3>
                        {formData.meals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMeal(mealIndex)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        name="mealName"
                        placeholder="Meal Name (e.g., Breakfast)"
                        value={meal.mealName}
                        onChange={(e) => handleInputChange(e, mealIndex)}
                        required
                        className="w-full px-3 py-2 mb-3 text-white border rounded-lg bg-slate-600 border-slate-500 focus:outline-none focus:border-red-500"
                      />

                      {/* Foods */}
                      <div className="mb-3 space-y-2">
                        {meal.foods.map((food, foodIndex) => (
                          <div
                            key={foodIndex}
                            className="p-3 space-y-2 border rounded-lg bg-slate-600 border-slate-500"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-300">
                                Food {foodIndex + 1}
                              </span>
                              {meal.foods.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFood(mealIndex, foodIndex)
                                  }
                                  className="text-sm text-red-400 hover:text-red-300"
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                              <input
                                type="text"
                                name="foodName"
                                placeholder="Food Name"
                                value={food.foodName}
                                onChange={(e) =>
                                  handleInputChange(e, mealIndex, foodIndex)
                                }
                                required
                                className="w-full px-3 py-2 text-sm text-white border rounded bg-slate-500 border-slate-400 focus:outline-none focus:border-red-500"
                              />
                              <input
                                type="number"
                                name="quantity"
                                placeholder="Quantity"
                                value={food.quantity}
                                onChange={(e) =>
                                  handleInputChange(e, mealIndex, foodIndex)
                                }
                                required
                                className="w-full px-3 py-2 text-sm text-white border rounded bg-slate-500 border-slate-400 focus:outline-none focus:border-red-500"
                              />
                              <input
                                type="number"
                                name="calories"
                                placeholder="Calories"
                                value={food.calories}
                                onChange={(e) =>
                                  handleInputChange(e, mealIndex, foodIndex)
                                }
                                required
                                className="w-full px-3 py-2 text-sm text-white border rounded bg-slate-500 border-slate-400 focus:outline-none focus:border-red-500"
                              />
                              <input
                                type="number"
                                name="protein"
                                placeholder="Protein (g)"
                                value={food.protein}
                                onChange={(e) =>
                                  handleInputChange(e, mealIndex, foodIndex)
                                }
                                required
                                className="w-full px-3 py-2 text-sm text-white border rounded bg-slate-500 border-slate-400 focus:outline-none focus:border-red-500"
                              />
                              <input
                                type="number"
                                name="carbs"
                                placeholder="Carbs (g)"
                                value={food.carbs}
                                onChange={(e) =>
                                  handleInputChange(e, mealIndex, foodIndex)
                                }
                                required
                                className="w-full px-3 py-2 text-sm text-white border rounded bg-slate-500 border-slate-400 focus:outline-none focus:border-red-500"
                              />
                              <input
                                type="number"
                                name="fat"
                                placeholder="Fat (g)"
                                value={food.fat}
                                onChange={(e) =>
                                  handleInputChange(e, mealIndex, foodIndex)
                                }
                                required
                                className="w-full px-3 py-2 text-sm text-white border rounded bg-slate-500 border-slate-400 focus:outline-none focus:border-red-500"
                              />
                              <input
                                type="number"
                                name="sugar"
                                placeholder="Sugar (g)"
                                value={food.sugar}
                                onChange={(e) =>
                                  handleInputChange(e, mealIndex, foodIndex)
                                }
                                required
                                className="w-full px-3 py-2 text-sm text-white border rounded bg-slate-500 border-slate-400 focus:outline-none focus:border-red-500"
                              />
                              <input
                                type="number"
                                name="sodium"
                                placeholder="Sodium (mg)"
                                value={food.sodium}
                                onChange={(e) =>
                                  handleInputChange(e, mealIndex, foodIndex)
                                }
                                required
                                className="w-full px-3 py-2 text-sm text-white border rounded bg-slate-500 border-slate-400 focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addFood(mealIndex)}
                        className="px-3 py-1 text-sm text-white transition rounded bg-slate-500 hover:bg-slate-400"
                      >
                        + Add Food
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addMeal}
                  className="px-3 py-1 text-sm text-white transition rounded bg-slate-600 hover:bg-slate-500"
                >
                  + Add Meal
                </button>

                <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white transition bg-red-500 rounded-lg hover:bg-red-600"
                  >
                    {editingId ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 text-white transition rounded-lg bg-slate-700 hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="w-full overflow-hidden border rounded-lg bg-slate-800 border-slate-700">
            {loading ? (
              <div className="p-6 text-center text-slate-400">Loading...</div>
            ) : !diets || diets.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No diet plans found
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="flex flex-col space-y-4 md:hidden">
                  {diets.map((diet) => (
                    <div key={diet._id} className="p-4 rounded-lg bg-slate-700">
                      <p className="text-sm text-slate-300">User</p>
                      <p className="font-semibold text-white">
                        {diet.userId?.name}
                      </p>
                      <p>
                        <strong>Meals:</strong>{" "}
                        {diet.meals?.map((m) => m.mealName).join(", ")}
                      </p>
                      <p>
                        <strong>Calories:</strong> {diet.totalCalories}
                      </p>

                      <div className="flex gap-3 pt-2 mt-3 border-t border-slate-600">
                        <button
                          onClick={() => handleEdit(diet)}
                          className="text-blue-400"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(diet._id)}
                          className="text-red-400"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <table className="hidden w-full md:table">
                  <thead className="border-b bg-slate-700 border-slate-600 ">
                    <tr>
                      <th className="px-6 py-3 text-sm font-semibold text-left text-slate-200">
                        User
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-left text-slate-200">
                        Meals
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-left text-slate-200">
                        Total Calories
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-left text-slate-200">
                        Protein
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-left text-slate-200">
                        Carbs
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-left text-slate-200">
                        Fat
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-left text-slate-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {diets.map((diet) => (
                      <tr
                        key={diet._id}
                        className="transition border-b border-slate-700 hover:bg-slate-700"
                      >
                        <td className="px-6 py-4 text-slate-200">
                          {diet.userId?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-200">
                          {diet.meals?.map((m) => m.mealName).join(", ") ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-200">
                          {diet.totalCalories}
                        </td>
                        <td className="px-6 py-4 text-slate-200">
                          {diet.totalProtein}g
                        </td>
                        <td className="px-6 py-4 text-slate-200">
                          {diet.totalCarbs}g
                        </td>
                        <td className="px-6 py-4 text-slate-200">
                          {diet.totalFat}g
                        </td>
                        <td className="flex gap-2 px-6 py-4">
                          <button
                            onClick={() => handleEdit(diet)}
                            className="text-blue-400 transition hover:text-blue-300"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(diet._id)}
                            className="text-red-400 transition hover:text-red-300"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDiet;
