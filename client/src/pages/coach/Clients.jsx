import { useEffect, useState } from "react";
import React from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import ClientCard from "../../components/ClientCard";
import API from "../../services/api";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await API.get("/coach/clients");
        setClients(res.data);
        setSuccess("Clients fetched successfully");

        setTimeout(() => setSuccess(""), 3000);
        setError("");
      } catch (err) {
        console.log(err);
        setError("Failed to fetch clients");
        setTimeout(() => setError(""), 3000);
        setSuccess("");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);
  if (!clients) return <div>no clients found</div>;

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      </DashboardLayout>
    );
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">My clients</h1>
      <div
        className="grid md:grid-cols-1 lg:grid-cols-3
      "
      >
        {clients.map((client) => (
          <ClientCard key={client._id} client={client} />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Clients;
