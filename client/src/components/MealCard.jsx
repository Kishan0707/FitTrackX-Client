import React from "react";

const MealCard = ({ meal }) => {
  return (
    <div className="bg-slate-900 p-5 rounded-xl shadow w-fit">
      <h2 className="text-lg font-semibold mb-3">{meal.mealName}</h2>
      {meal.foods.map((item, index) => (
        <div key={index} className="flex justify-between text-sm mb-2">
          <span>{item.foodName}</span>
          <span>{item.quantity}g</span>
          <span>{item.calories} cal</span>
          <span>{item.protein}g protein</span>
          <span>{item.carbs}g carbs</span>
          <span>{item.fat}g fat</span>
          <span>{item.sugar}g sugar</span>
          <span>{item.sodium}mg sodium</span>
        </div>
      ))}
    </div>
  );
};

export default MealCard;
