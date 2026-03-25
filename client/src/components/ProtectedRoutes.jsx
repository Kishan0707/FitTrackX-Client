import { Navigate } from "react-router-dom";
import React, { useContext } from "react";
import { AuthContext } from "../context/authContext";

const ProtectedRoutes = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) return <Navigate to="/" />;
  
  return children;
};

export default ProtectedRoutes;
