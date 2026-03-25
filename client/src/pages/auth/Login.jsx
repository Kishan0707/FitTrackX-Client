import { useContext, useState } from "react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
import { AuthContext } from "../../context/authContext";
import Register from "./Register";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [changeState, setChangeState] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setLoginFormData({
      ...loginFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      const res = await login(loginFormData);
      setSuccess("Login Successful");

      // Role-based redirect
      setTimeout(() => {
        if (res?.role === "admin") {
          navigate("/admin");
        } else if (res?.role === "coach") {
          navigate("/coach");
        } else {
          navigate("/dashboard");
        }
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {error && (
        <div className="bg-red-500 text-white p-2 rounded mb-2 absolute right-10 top-10">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500 text-white p-2 rounded mb-2 absolute right-10 top-10">
          {success}
        </div>
      )}
      <div className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-5">
        <div className="w-full max-w-5xl h-150 bg-gray-900 rounded-2xl shadow-gray-700 overflow-hidden relative">
          <div
            className={`flex w-[200%] h-full transition-transform duration-500 ${
              changeState ? "-translate-x-1/2" : "translate-x-0"
            }`}
          >
            {/* login panel */}
            <div className="w-1/2 flex  md:pl-8 gap-5">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5 items-center justify-center w-full"
              >
                <h1 className="text-3xl font-bold text-center mb-3">Login</h1>

                <input
                  type="email"
                  name="email"
                  value={loginFormData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="border border-gray-600 bg-gray-800 px-4 py-2 rounded focus:outline-none ring-1 ring-blue-900 focus:ring-2 focus:ring-blue-500 w-3/5"
                />

                <div className="flex gap-2 w-3/5">
                  <input
                    type={!showPassword ? "password" : "text"}
                    name="password"
                    value={loginFormData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="border border-gray-600 bg-gray-800 px-4 py-2 rounded focus:outline-none focus:ring-2 ring-1 ring-blue-900 focus:ring-blue-500 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="border-0 bg-gray-950 px-4 rounded shadow-lg ring-1 ring-blue-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <button
                  className={`bg-gray-700 hover:bg-gray-800 py-2 rounded-xl transition w-3/5 flex items-center justify-center text-center ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  type="submit"
                >
                  {loading ? (
                    <div className="w-5 h-5 p-1 border-t border-r border-b rounded-full animate-spin transition-all ease-in-out duration-300"></div>
                  ) : (
                    <div className="">Login</div>
                  )}
                </button>
                <Link to="/forgot-password" className="text-blue-500">
                  Forgot Password?
                </Link>

                <p
                  className="text-center text-sm cursor-pointer"
                  onClick={() => setChangeState((prev) => !prev)}
                >
                  I don't have an
                  <span className="text-blue-500 font-semibold underline">
                    account
                  </span>
                </p>
              </form>
              <div className="w-full md:flex hidden">
                <img
                  src="/bg-login.jpg"
                  className=" object-cover object-bottom-left h-full rounded-tl-full"
                  alt=""
                />
              </div>
            </div>

            {/* register panel */}

            <Register togglePanel={() => setChangeState((prev) => !prev)} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

// const handleLogin = async () => {
//   try {
//     setLoading(true);

//     const res = await axios.post("http://localhost:5000/api/auth/login", {
//       email,
//       password,
//     });
//     setSuccess("Login successful");
//     navigate("/dasboard");
//     // if (!res.data) {
//     //   setError("Invalid credentials");
//     // }
//     // setSuccess("Login successful");
//     // navigate("/dasboard");
//     // setUser(res.data);
//     console.log(res.data.role);
//     console.log(user);
//   } catch (err) {
//     setError(err.response?.data?.message || "Login failed");
//   } finally {
//     setLoading(false);
//   }
// };
