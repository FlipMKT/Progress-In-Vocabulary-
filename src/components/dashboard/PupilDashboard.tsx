import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BookOpen, Trophy, TrendingUp, LogOut, CheckCircle, RotateCcw, Medal, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Fictional leaderboard checkpoints
const FICTIONAL_PLAYERS = [
  { name: "Sophie M", modules: 2, accuracy: 28 },
  { name: "James L", modules: 4, accuracy: 34 },
  { name: "Oliver T", modules: 5, accuracy: 37 },
  { name: "Amy P", modules: 6, accuracy: 39 },
  { name: "Lucas R", modules: 8, accuracy: 45 },
  { name: "Emma K", modules: 10, accuracy: 52 },
  { name: "Noah B", modules: 12, accuracy: 58 },
  { name: "Mia D", modules: 15, accuracy: 65 },
  { name: "Ethan W", modules: 18, accuracy: 72 },
  { name: "Chloe H", modules: 20, accuracy: 80 },
];

interface Module {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  isCompleted?: boolean;
}

interface Stats {
  totalAttempts: number;
  averageAccuracy: number;
  modulesCompleted: number;
}

const PupilDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [pupilName, setPupilName] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [profileId, setProfileId] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalAttempts: 0,
    averageAccuracy: 0,
    modulesCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [leaderboardView, setLeaderboardView] = useState<"modules" | "accuracy">("modules");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "Kickstart" | "Intermediate" | "Advanced">("all");

  useEffect(() => {
    if (user) {
      getProfileId();
    }
  }, [user]);

  useEffect(() => {
    if (profileId) {
      fetchModules();
      fetchStats();
    }
  }, [profileId]);

  const getProfileId = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("auth_id", user.id)
        .limit(1)
        .single();
      
      if (error) throw error;
      if (data) {
        setProfileId(data.id);
        if (data.name) {
          const firstName = data.name.split(" ")[0];
          const lastName = data.name.split(" ")[1] || "";
          setPupilName(firstName);
          setFullName(`${firstName} ${lastName.charAt(0).toUpperCase()}`);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile",
        variant: "destructive",
      });
    }
  };

  const fetchModules = async () => {
    if (!profileId) return;

    try {
      // Fetch assigned modules
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("module_assignments")
        .select(`
          module_id,
          modules (
            id,
            title,
            description,
            subject,
            level
          )
        `)
        .eq("user_id", profileId);

      if (assignmentsError) throw assignmentsError;

      // Fetch completed sessions to determine which modules are completed
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("game_sessions")
        .select("module_id")
        .eq("user_id", profileId)
        .not("completed_at", "is", null);

      if (sessionsError) throw sessionsError;

      const completedModuleIds = new Set(sessionsData?.map(s => s.module_id) || []);

      const modulesList = assignmentsData?.map((item: any) => ({
        ...item.modules,
        isCompleted: completedModuleIds.has(item.modules?.id)
      })).filter(Boolean) || [];
      
      // Sort modules by title (extracts numbers for natural sorting)
      modulesList.sort((a: Module, b: Module) => {
        const numA = parseInt(a.title.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.title.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
      
      setModules(modulesList);
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast({
        title: "Error",
        description: "Failed to load your modules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!profileId) return;

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("accuracy, completed_at, module_id")
        .eq("user_id", profileId)
        .not("completed_at", "is", null);

      if (error) throw error;

      const completedSessions = data || [];
      const totalAttempts = completedSessions.length;
      const averageAccuracy = totalAttempts > 0
        ? completedSessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) / totalAttempts
        : 0;

      setStats({
        totalAttempts,
        averageAccuracy: Math.round(averageAccuracy),
        modulesCompleted: new Set(completedSessions.map(s => s.module_id)).size,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Accelerate Vocab</h1>
              <p className="text-sm text-muted-foreground">Welcome back!</p>
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
          <h2 className="text-3xl font-bold mb-2">
            Welcome to Your Learning Dashboard{pupilName ? `, ${pupilName}` : ""}
          </h2>
          <p className="text-muted-foreground">Track your progress and continue learning</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageAccuracy}%</div>
              <Progress value={stats.averageAccuracy} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.modulesCompleted}</div>
            </CardContent>
          </Card>
        </div>

        {/* Modules List */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Your Modules</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {difficultyFilter === "all" ? "All Levels" : difficultyFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setDifficultyFilter("all")}
                  className={difficultyFilter === "all" ? "bg-primary/10" : ""}
                >
                  View All
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDifficultyFilter("Kickstart")}
                  className={difficultyFilter === "Kickstart" ? "bg-primary/10" : ""}
                >
                  Kickstart
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDifficultyFilter("Intermediate")}
                  className={difficultyFilter === "Intermediate" ? "bg-primary/10" : ""}
                >
                  Intermediate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDifficultyFilter("Advanced")}
                  className={difficultyFilter === "Advanced" ? "bg-primary/10" : ""}
                >
                  Advanced
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {modules.filter(m => difficultyFilter === "all" || m.level === difficultyFilter).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No modules assigned yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Contact your teacher to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules
                .filter(m => difficultyFilter === "all" || m.level === difficultyFilter)
                .map((module) => (
                <Card key={module.id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="flex gap-2 mb-4">
                      {module.subject && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {module.subject}
                        </span>
                      )}
                      {module.level && (
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                          {module.level}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto">
                    {module.isCompleted ? (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          className="flex-1 bg-green-500/10 border-green-500 text-green-600 hover:bg-green-500/20 hover:text-green-700"
                          disabled
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Completed
                        </Button>
                        <Button 
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => navigate(`/game/${module.id}`)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Repeat
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/game/${module.id}`)}
                      >
                        Start Learning
                      </Button>
                    )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Your Progress Leaderboard */}
        <div className="animate-fade-in mt-8" style={{ animationDelay: "0.3s" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Medal className="w-6 h-6 text-amber-500" />
              Your Progress
            </h3>
            <Tabs value={leaderboardView} onValueChange={(v) => setLeaderboardView(v as "modules" | "accuracy")}>
              <TabsList>
                <TabsTrigger value="modules">Completed Modules</TabsTrigger>
                <TabsTrigger value="accuracy">Average Accuracy</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <LeaderboardTable 
                userStats={{ 
                  name: fullName || "You", 
                  modules: stats.modulesCompleted, 
                  accuracy: stats.averageAccuracy 
                }}
                sortBy={leaderboardView}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Leaderboard component
interface LeaderboardEntry {
  name: string;
  modules: number;
  accuracy: number;
  isUser?: boolean;
}

interface LeaderboardTableProps {
  userStats: { name: string; modules: number; accuracy: number };
  sortBy: "modules" | "accuracy";
}

const LeaderboardTable = ({ userStats, sortBy }: LeaderboardTableProps) => {
  const [showFullTable, setShowFullTable] = useState(false);

  const sortedLeaderboard = useMemo(() => {
    const allPlayers: LeaderboardEntry[] = [
      ...FICTIONAL_PLAYERS,
      { ...userStats, isUser: true }
    ];
    
    if (sortBy === "modules") {
      return allPlayers.sort((a, b) => b.modules - a.modules);
    } else {
      return allPlayers.sort((a, b) => b.accuracy - a.accuracy);
    }
  }, [userStats, sortBy]);

  const userRank = sortedLeaderboard.findIndex(p => p.isUser) + 1;
  const userEntry = sortedLeaderboard.find(p => p.isUser);

  // Get display entries: first 6, then user if not in top 6
  const displayEntries = useMemo(() => {
    if (showFullTable) {
      return sortedLeaderboard.map((player, index) => ({ ...player, rank: index + 1 }));
    }

    const top6 = sortedLeaderboard.slice(0, 6).map((player, index) => ({ ...player, rank: index + 1 }));
    
    // If user is in top 6, just return top 6
    if (userRank <= 6) {
      return top6;
    }

    // Otherwise, add user at the end with their actual rank
    return [...top6, { ...userEntry!, rank: userRank }];
  }, [sortedLeaderboard, userRank, userEntry, showFullTable]);

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-amber-400";
      case 2: return "text-gray-400";
      case 3: return "text-amber-600";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-2">
      {displayEntries.map((player, index) => {
        const showGap = !showFullTable && index === 6 && userRank > 7;
        return (
          <div key={`${player.name}-${player.rank}`}>
            {showGap && (
              <div className="flex items-center justify-center py-2 text-muted-foreground text-sm">
                <span className="border-t border-dashed border-muted-foreground/30 flex-1 mr-3" />
                <span>...</span>
                <span className="border-t border-dashed border-muted-foreground/30 flex-1 ml-3" />
              </div>
            )}
            <div
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                player.isUser 
                  ? "bg-primary/10 border-2 border-primary shadow-sm" 
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center font-bold ${getMedalColor(player.rank)}`}>
                  {player.rank <= 3 ? (
                    <Trophy className="w-5 h-5" />
                  ) : (
                    <span className="text-sm">{player.rank}</span>
                  )}
                </div>
                <span className={`font-medium ${player.isUser ? "font-bold text-primary" : ""}`}>
                  {player.isUser ? `${player.name} (You)` : player.name}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className={`text-right ${sortBy === "modules" ? "font-bold" : "text-muted-foreground"}`}>
                  <span className="hidden sm:inline">Modules: </span>
                  <span>{player.modules}</span>
                </div>
                <div className={`text-right min-w-[60px] ${sortBy === "accuracy" ? "font-bold" : "text-muted-foreground"}`}>
                  <span className="hidden sm:inline">Accuracy: </span>
                  <span>{player.accuracy}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {!showFullTable && sortedLeaderboard.length > 6 && (
        <Button 
          variant="ghost" 
          className="w-full mt-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowFullTable(true)}
        >
          View full table
        </Button>
      )}
      
      {showFullTable && (
        <Button 
          variant="ghost" 
          className="w-full mt-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowFullTable(false)}
        >
          Show less
        </Button>
      )}
    </div>
  );
};

export default PupilDashboard;