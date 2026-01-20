import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, BarChart3, LogOut, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModuleManagement from "@/components/admin/ModuleManagement";
import PupilManagement from "@/components/admin/PupilManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

interface DashboardStats {
  totalPupils: number;
  totalModules: number;
  totalSessions: number;
  averageAccuracy: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPupils: 0,
    totalModules: 0,
    totalSessions: 0,
    averageAccuracy: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Count pupils
      const { count: pupilCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "pupil");

      // Count modules
      const { count: moduleCount } = await supabase
        .from("modules")
        .select("*", { count: "exact", head: true });

      // Get session stats
      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("accuracy")
        .not("completed_at", "is", null);

      const totalSessions = sessions?.length || 0;
      const averageAccuracy = totalSessions > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalSessions)
        : 0;

      setStats({
        totalPupils: pupilCount || 0,
        totalModules: moduleCount || 0,
        totalSessions,
        averageAccuracy,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Accelerate Vocab Admin</h1>
              <p className="text-sm text-muted-foreground">Manage your platform</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage pupils, modules, and track performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pupils</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPupils}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalModules}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sessions Played</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Accuracy</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageAccuracy}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="modules" className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="pupils">Pupils</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="modules">
            <ModuleManagement onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="pupils">
            <PupilManagement onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
