import { useState, useEffect, useRef } from "react";
import API from "../../services/api";
import {
  FaUsers,
  FaDumbbell,
  FaAppleAlt,
  FaDollarSign,
  FaSync,
  FaFilePdf,
  FaFileExcel,
  FaDownload,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import DashboardLayout from "../../layout/DashboardLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

const Reports = () => {
  const [userActivity, setUserActivity] = useState(null);
  const [workoutReport, setWorkoutReport] = useState(null);
  const [dietAdherence, setDietAdherence] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const reportRef = useRef(null);
  const intervalRef = useRef(null);
  console.log(`modalData: ${JSON.stringify(modalData, null, 2)}`);
  const COLORS = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
  ];

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchReports();
      }, 60000); // Refresh every 1 minute
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current); //
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const days = dateRange;
      const [userRes, workoutRes, dietRes, revenueRes] = await Promise.all([
        API.get(`/admin/reports/user-activity?days=${days}`),
        API.get(`/admin/reports/workout?days=${days}`),
        API.get(`/admin/reports/diet-adherence?days=${days}`),
        API.get(`/admin/reports/revenue?days=${days}`),
      ]);

      setUserActivity(userRes.data.data);
      setWorkoutReport(workoutRes.data.data);
      setDietAdherence(dietRes.data.data);
      setRevenueReport(revenueRes.data.data);

      calculateComparison(
        userRes.data.data,
        workoutRes.data.data,
        dietRes.data.data,
        revenueRes.data.data,
      );
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateComparison = (user, workout, diet, revenue) => {
    setComparison({
      userGrowth:
        user?.totalUsers > 0
          ? ((user?.recentActiveUsers / user?.totalUsers) * 100).toFixed(1)
          : 0,
      workoutGrowth:
        workout?.totalWorkouts > 0
          ? ((workout?.recentWorkouts / workout?.totalWorkouts) * 100).toFixed(
              1,
            )
          : 0,
      dietGrowth:
        diet?.totalDiets > 0
          ? ((diet?.recentDiets / diet?.totalDiets) * 100).toFixed(1)
          : 0,
      revenueGrowth:
        revenue?.totalRevenue > 0
          ? ((revenue?.monthlyRevenue / revenue?.totalRevenue) * 100).toFixed(1)
          : 0,
    });
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const exportToPDF = async () => {
    const element = reportRef.current;
    const clone = element.cloneNode(true);

    const convertToInlineStyles = (el) => {
      const computed = window.getComputedStyle(el);
      const props = [
        "color",
        "backgroundColor",
        "borderColor",
        "borderTopColor",
        "borderRightColor",
        "borderBottomColor",
        "borderLeftColor",
        "padding",
        "margin",
        "fontSize",
        "fontWeight",
        "display",
        "width",
        "height",
        "borderRadius",
        "borderWidth",
      ];

      props.forEach((prop) => {
        const value = computed[prop];
        if (value && value !== "rgba(0, 0, 0, 0)" && value !== "transparent") {
          el.style[prop] = value;
        }
      });

      el.removeAttribute("class");
      Array.from(el.children).forEach(convertToInlineStyles);
    };

    convertToInlineStyles(clone);
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#0f172a",
      ignoreElements: (el) => el.tagName === "STYLE" || el.tagName === "LINK",
    });
    document.body.removeChild(clone);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`reports-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // User Activity Sheet
    const userSheet = XLSX.utils.json_to_sheet([
      { Metric: "Total Users", Value: userActivity?.totalUsers || 0 },
      { Metric: "Active Users", Value: userActivity?.activeUsers || 0 },
      { Metric: "Recent Active", Value: userActivity?.recentActiveUsers || 0 },
    ]);
    XLSX.utils.book_append_sheet(wb, userSheet, "User Activity");

    // Workout Report Sheet
    const workoutSheet = XLSX.utils.json_to_sheet([
      { Metric: "Total Workouts", Value: workoutReport?.totalWorkouts || 0 },
      {
        Metric: "Total Calories",
        Value: workoutReport?.totalCaloriesBurned || 0,
      },
      { Metric: "Avg Duration", Value: workoutReport?.avgDuration || 0 },
    ]);
    XLSX.utils.book_append_sheet(wb, workoutSheet, "Workout Report");

    // Diet Adherence Sheet
    const dietSheet = XLSX.utils.json_to_sheet([
      { Metric: "Total Diets", Value: dietAdherence?.totalDiets || 0 },
      { Metric: "Recent Diets", Value: dietAdherence?.recentDiets || 0 },
      { Metric: "Avg Calories", Value: dietAdherence?.avgCalories || 0 },
    ]);
    XLSX.utils.book_append_sheet(wb, dietSheet, "Diet Adherence");

    // Revenue Report Sheet
    const revenueSheet = XLSX.utils.json_to_sheet([
      { Metric: "Total Revenue", Value: revenueReport?.totalRevenue || 0 },
      { Metric: "Monthly Revenue", Value: revenueReport?.monthlyRevenue || 0 },
      { Metric: "Total Payments", Value: revenueReport?.totalPayments || 0 },
    ]);
    XLSX.utils.book_append_sheet(wb, revenueSheet, "Revenue Report");

    XLSX.writeFile(
      wb,
      `reports-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const handleChartClick = (data, type) => {
    setModalData({ data, type });
    setShowModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-6 bg-slate-900 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
              Reports
            </h1>
            <div className="animate-pulse space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="h-8 bg-slate-700 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="h-24 bg-slate-700 rounded"></div>
                  <div className="h-24 bg-slate-700 rounded"></div>
                  <div className="h-24 bg-slate-700 rounded"></div>
                  <div className="h-24 bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-6 bg-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header with Controls */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Reports
            </h1>

            <div className="flex flex-col md:flex-row gap-2">
              {/* Date Range Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-red-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>

              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg transition ${
                  autoRefresh
                    ? "bg-green-500 text-white"
                    : "bg-slate-800 border border-slate-700 text-white"
                }`}
              >
                Auto {autoRefresh ? "ON" : "OFF"}
              </button>

              {/* Manual Refresh */}
              <button
                onClick={handleRefresh}
                className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition flex items-center gap-2"
              >
                <FaSync className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              {/* Export PDF */}
              <button
                onClick={exportToPDF}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition flex items-center gap-2"
              >
                <FaFilePdf />
                PDF
              </button>

              {/* Export Excel */}
              <button
                onClick={exportToExcel}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition flex items-center gap-2"
              >
                <FaFileExcel />
                Excel
              </button>
            </div>
          </div>

          {/* Comparison Stats */}
          {comparison && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400 text-xs">User Growth</p>
                <p
                  className={`text-xl font-bold ${comparison.userGrowth > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {comparison.userGrowth > 0 ? "+" : ""}
                  {comparison.userGrowth}%
                </p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400 text-xs">Workout Growth</p>
                <p
                  className={`text-xl font-bold ${comparison.workoutGrowth > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {comparison.workoutGrowth > 0 ? "+" : ""}
                  {comparison.workoutGrowth}%
                </p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400 text-xs">Diet Growth</p>
                <p
                  className={`text-xl font-bold ${comparison.dietGrowth > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {comparison.dietGrowth > 0 ? "+" : ""}
                  {comparison.dietGrowth}%
                </p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400 text-xs">Revenue Growth</p>
                <p
                  className={`text-xl font-bold ${comparison.revenueGrowth > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {comparison.revenueGrowth > 0 ? "+" : ""}
                  {comparison.revenueGrowth}%
                </p>
              </div>
            </div>
          )}
          {/* pdf exsl  */}
          <div ref={reportRef}>
            {/* User Activity Report */}
            <div
              className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 hover:border-red-500/30 transition mb-6 cursor-pointer"
              onClick={() => handleChartClick(userActivity, "User Activity")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <FaUsers className="text-red-500 text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-white">User Activity</h2>
              </div>

              {userActivity && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-white">
                        {userActivity.totalUsers}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">Active Users</p>
                      <p className="text-2xl font-bold text-white">
                        {userActivity.activeUsers}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">
                        Recent Active ({dateRange}d)
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {userActivity.recentActiveUsers}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">Activity Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {userActivity.totalUsers > 0
                          ? Math.round(
                              (userActivity.recentActiveUsers /
                                userActivity.totalUsers) *
                                100,
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>

                  {userActivity.usersByRole &&
                    userActivity.usersByRole.length > 0 && (
                      <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Users by Role
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={userActivity.usersByRole.map((item) => ({
                                name: item._id,
                                value: item.count,
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              onClick={(data) =>
                                handleChartClick(data, "userRole")
                              }
                              style={{ cursor: "pointer" }}
                            >
                              {userActivity.usersByRole.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Workout Report */}
            <div
              className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 hover:border-red-500/30 transition mb-6 cursor-pointer"
              onClick={() => handleChartClick(workoutReport, "Workout Reports")}
            >
              <div className="flex items-center gap-3 mb-4">
                <FaDumbbell className="text-red-500 text-2xl" />
                <h2 className="text-2xl font-bold text-white">
                  Workout Reports
                </h2>
              </div>

              {workoutReport && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">Total Workouts</p>
                      <p className="text-2xl font-bold text-white">
                        {workoutReport.totalWorkouts}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">
                        Total Calories Burned
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {workoutReport.totalCaloriesBurned}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">
                        Avg Duration (min)
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {workoutReport.avgDuration}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">
                        Recent ({dateRange}d)
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {workoutReport.recentWorkouts}
                      </p>
                    </div>
                  </div>

                  {workoutReport.workoutsByType &&
                    workoutReport.workoutsByType.length > 0 && (
                      <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Workouts by Type
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={workoutReport.workoutsByType.map((item) => ({
                              type: item._id || "Other",
                              count: item.count,
                            }))}
                            onClick={(data) =>
                              handleChartClick(data, "workoutType")
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#475569"
                            />
                            <XAxis dataKey="type" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Bar dataKey="count" fill="#ef4444" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Diet Adherence Report */}
            <div
              className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 hover:border-red-500/30 transition mb-6 cursor-pointer"
              onClick={() => handleChartClick(dietAdherence, "Diet Adherence")}
            >
              <div className="flex items-center gap-3 mb-4">
                <FaAppleAlt className="text-red-500 text-2xl" />
                <h2 className="text-2xl font-bold text-white">
                  Diet Adherence
                </h2>
              </div>

              {dietAdherence && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                    <p className="text-slate-400 text-sm">Total Diet Plans</p>
                    <p className="text-2xl font-bold text-white">
                      {dietAdherence.totalDiets}
                    </p>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                    <p className="text-slate-400 text-sm">
                      Recent ({dateRange}d)
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {dietAdherence.recentDiets}
                    </p>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                    <p className="text-slate-400 text-sm">Avg Calories</p>
                    <p className="text-2xl font-bold text-white">
                      {dietAdherence.avgCalories}
                    </p>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                    <p className="text-slate-400 text-sm">Avg Protein (g)</p>
                    <p className="text-2xl font-bold text-white">
                      {dietAdherence.avgProtein}
                    </p>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                    <p className="text-slate-400 text-sm">Users with Diets</p>
                    <p className="text-2xl font-bold text-white">
                      {dietAdherence.usersWithDiets}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Revenue Report */}
            <div
              className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 hover:border-red-500/30 transition cursor-pointer"
              onClick={() => handleChartClick(revenueReport, "Revenue Report")}
            >
              <div className="flex items-center gap-3 mb-4">
                <FaDollarSign className="text-red-500 text-2xl" />
                <h2 className="text-2xl font-bold text-white">
                  Revenue Report
                </h2>
              </div>

              {revenueReport && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">
                        ${revenueReport.totalRevenue}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">
                        Monthly Revenue ({dateRange}d)
                      </p>
                      <p className="text-2xl font-bold text-white">
                        ${revenueReport.monthlyRevenue}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                      <p className="text-slate-400 text-sm">Total Payments</p>
                      <p className="text-2xl font-bold text-white">
                        {revenueReport.totalPayments}
                      </p>
                    </div>
                  </div>

                  {revenueReport.paymentsByPlan &&
                    revenueReport.paymentsByPlan.length > 0 && (
                      <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-red-500/40 transition">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Revenue by Plan
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={revenueReport.paymentsByPlan.map((item) => ({
                              plan: item._id || "Other",
                              revenue: item.revenue,
                              count: item.count,
                            }))}
                            onClick={(data) =>
                              handleChartClick(data, "revenuePlan")
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#475569"
                            />
                            <XAxis dataKey="plan" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="revenue"
                              fill="#22c55e"
                              name="Revenue ($)"
                            />
                            <Bar dataKey="count" fill="#3b82f6" name="Count" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
          {/* pdf exsl  */}
        </div>
      </div>

      {/* Modal for Detailed View */}
      {showModal && modalData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{modalData.type}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {modalData.data &&
                Object.entries(modalData.data).map(([key, value]) => (
                  <div key={key} className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-sm capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-white font-semibold">
                      {Array.isArray(value) ? (
                        <pre className="text-xs overflow-x-auto mt-2">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : typeof value === "object" && value !== null ? (
                        <pre className="text-xs overflow-x-auto mt-2">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        value?.toString() || "N/A"
                      )}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Reports;
