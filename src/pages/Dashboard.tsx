import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import PupilDashboard from "@/components/dashboard/PupilDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, isAdmin, isPupil, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isPupil) {
    return <PupilDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">No Role Assigned</h1>
        <p className="text-muted-foreground">
          Please contact your administrator to assign you a role.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
