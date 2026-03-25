import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/authContext";

const Register = ({ togglePanel }) => {
  // const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [registerFormData, setRegisterFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setRegisterFormData({
      ...registerFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      console.log(register);

      await register(registerFormData);
      setSuccess("Registration Successful");
      // after a successful registration, switch back to login panel
      if (togglePanel) togglePanel();
    } catch (err) {
      setError(err.response?.data?.message || "Register Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end w-1/2 h-full p-5 gap-15 md:translate-x-10">
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
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 items-center justify-end w-full"
      >
        <h1 className="text-3xl font-bold text-center mb-3">Register</h1>
        <input
          type="text"
          placeholder="Username"
          name="name"
          onChange={handleChange}
          value={registerFormData.name}
          className="border border-gray-600 bg-gray-800 px-4 py-2 rounded focus:outline-none ring-1 ring-blue-900 focus:ring-2 focus:ring-blue-500 w-3/5"
        />
        <input
          type="email"
          placeholder="Email"
          name="email"
          onChange={handleChange}
          value={registerFormData.email}
          className="border border-gray-600 bg-gray-800 px-4 py-2 rounded focus:outline-none ring-1 ring-blue-900 focus:ring-2 focus:ring-blue-500 w-3/5"
        />

        <div className=" flex gap-2 w-3/5">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            name="password"
            onChange={handleChange}
            value={registerFormData.password}
            className="border border-gray-600 bg-gray-800 px-4 py-2 pr-20 rounded focus:outline-none ring-1 ring-blue-900 focus:ring-2 focus:ring-blue-500 w-full"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="bg-gray-950 px-4 py-1.5 rounded shadow-lg ring-1 ring-blue-900 hover:bg-gray-900 transition"
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
            <div className="">Register</div>
          )}
        </button>

        <p
          className="text-center text-sm cursor-pointer"
          onClick={() => {
            if (togglePanel) togglePanel();
          }}
        >
          I already have an
          <span className="text-blue-500 font-semibold underline">account</span>
        </p>
      </form>
      <div className="w-full md:flex hidden">
        <img
          src="/bg_register.jpg"
          className=" object-cover object-bottom-right h-full rounded-tl-full"
          alt=""
        />
      </div>
    </div>
  );
};

export default Register;
