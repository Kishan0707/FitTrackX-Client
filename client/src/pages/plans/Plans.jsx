import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import API from "../../services/api";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [processingPayment, setProcessingPayment] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await API.get("/plans");
        setPlans(res.data.data);
        setSuccess(res.data.message || "Plans fetched successfully");
        setError("");
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error fetching plans:", error);
        setError("Error fetching plans: " + error.message);
        setSuccess("");
        setTimeout(() => setError(""), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handlePayment = async (planId) => {
    setProcessingPayment(planId);
    console.log("Handling payment for planId:", planId);
    try {
      const res = await API.post(`/payment/create-order`, { planId });
      console.log("Create order response:", res.data);
      const order = res.data.order;
      const options = {
        key: "rzp_test_1DP5mmOlF5G5ag",
        amount: order.amount,
        currency: order.currency,
        name: "FitTrackX",
        description: "Premium Plan",
        order_id: order.id,
        handler: async function (response) {
          await API.post("/payment/verify-payment", {
            ...response,
            planId,
          });
          alert("Plan activated successfully!");
          setProcessingPayment(null);
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(null);
          },
        },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Fitness Plan
          </h1>
          <p className="text-xl text-gray-600">
            Unlock your potential with our premium subscription plans
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-slate-900  rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200"
            >
              <div className="bg-linear-to-r from-blue-500/20 to-purple-600/20 p-6 backdrop-blur-2xl">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {plan.title}
                </h2>
                <p className="text-blue-100">{plan.description}</p>
              </div>

              <div className="p-6">
                <div className="flex items-baseline mb-4">
                  {/* items-baseline : (job of propertie) =>
                    aligns the children along the baseline of the flex container. */}
                  <span className="text-4xl font-bold text-gray-200">
                    ₹{plan.price}
                  </span>
                  <span className="text-gray-400 ml-2">
                    / {plan.duration} days
                  </span>
                </div>

                <div className="space-y-2 mb-6 text-white">
                  <div className="flex items-center ">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Personalized workout plans
                  </div>
                  <div className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Nutrition guidance
                  </div>
                  <div className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Progress tracking
                  </div>
                </div>

                <button
                  onClick={() => handlePayment(plan._id)}
                  disabled={processingPayment === plan._id}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors duration-200 ${
                    processingPayment === plan._id
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-linear-to-r from-blue-500/50 to-purple-600/50 hover:from-blue-600/50 hover:to-purple-700/50 backdrop-blur-2xl"
                  }`}
                >
                  {processingPayment === plan._id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    "Get Started"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏋️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No plans available
            </h3>
            <p className="text-gray-600">
              Check back later for exciting fitness plans!
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Plans;
