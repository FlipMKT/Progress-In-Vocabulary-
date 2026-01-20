import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, X, BookOpen, Target, Clock, TrendingUp } from "lucide-react";

interface PupilAnalytics {
  id: string;
  name: string;
  email: string;
  uniqueModulesAllocated: number;
  uniqueModulesCompleted: number;
  averageAccuracy: number | null;
  modulesStartedNotCompleted: number;
  totalModulesCompleted: number;
}

interface ModulePerformance {
  moduleId: string;
  moduleTitle: string;
  isAllocated: boolean;
  timesCompleted: number;
  bestAccuracy: number | null;
  averageAccuracy: number | null;
  lastPlayedAt: string | null;
  totalTimeTakenSeconds: number;
}

interface PupilFullReport {
  pupil: PupilAnalytics;
  modulePerformance: ModulePerformance[];
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<PupilAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPupil, setSelectedPupil] = useState<PupilFullReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch pupils with emails
      const { data: pupilsData, error: pupilsError } = await supabase.functions.invoke('get-pupils');
      if (pupilsError) throw pupilsError;

      const pupils = pupilsData?.pupils || [];

      if (pupils.length === 0) {
        setAnalytics([]);
        setLoading(false);
        return;
      }

      const pupilIds = pupils.map((p: any) => p.id);

      // Fetch module assignments for all pupils
      const { data: assignments, error: assignError } = await supabase
        .from("module_assignments")
        .select("user_id, module_id")
        .in("user_id", pupilIds);

      if (assignError) throw assignError;

      // Fetch all game sessions for pupils
      const { data: sessions, error: sessionsError } = await supabase
        .from("game_sessions")
        .select("user_id, module_id, completed_at, accuracy")
        .in("user_id", pupilIds);

      if (sessionsError) throw sessionsError;

      // Calculate analytics for each pupil
      const analyticsData: PupilAnalytics[] = pupils.map((pupil: any) => {
        const pupilAssignments = assignments?.filter(a => a.user_id === pupil.id) || [];
        const pupilSessions = sessions?.filter(s => s.user_id === pupil.id) || [];

        // Unique modules allocated
        const uniqueModulesAllocated = new Set(pupilAssignments.map(a => a.module_id)).size;

        // Completed sessions (has completed_at)
        const completedSessions = pupilSessions.filter(s => s.completed_at);
        
        // Unique modules completed
        const uniqueModulesCompleted = new Set(completedSessions.map(s => s.module_id)).size;

        // Total modules completed (including repeats)
        const totalModulesCompleted = completedSessions.length;

        // Average accuracy across all completed sessions
        const accuracies = completedSessions
          .map(s => s.accuracy)
          .filter((a): a is number => a !== null);
        const averageAccuracy = accuracies.length > 0
          ? accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length
          : null;

        // Modules started but not completed
        const startedModuleIds = new Set(pupilSessions.map(s => s.module_id));
        const completedModuleIds = new Set(completedSessions.map(s => s.module_id));
        const modulesStartedNotCompleted = [...startedModuleIds].filter(
          id => !completedModuleIds.has(id)
        ).length;

        return {
          id: pupil.id,
          name: pupil.name,
          email: pupil.email,
          uniqueModulesAllocated,
          uniqueModulesCompleted,
          averageAccuracy,
          modulesStartedNotCompleted,
          totalModulesCompleted,
        };
      });

      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPupilFullReport = async (pupil: PupilAnalytics) => {
    try {
      setReportLoading(true);

      // Fetch all modules
      const { data: modules, error: modulesError } = await supabase
        .from("modules")
        .select("id, title")
        .eq("is_active", true);

      if (modulesError) throw modulesError;

      // Fetch pupil's module assignments
      const { data: assignments, error: assignError } = await supabase
        .from("module_assignments")
        .select("module_id")
        .eq("user_id", pupil.id);

      if (assignError) throw assignError;

      const allocatedModuleIds = new Set(assignments?.map(a => a.module_id) || []);

      // Fetch all game sessions for this pupil
      const { data: sessions, error: sessionsError } = await supabase
        .from("game_sessions")
        .select("module_id, completed_at, accuracy, time_taken_seconds")
        .eq("user_id", pupil.id);

      if (sessionsError) throw sessionsError;

      // Calculate per-module performance
      const modulePerformance: ModulePerformance[] = (modules || []).map(module => {
        const moduleSessions = sessions?.filter(s => s.module_id === module.id) || [];
        const completedSessions = moduleSessions.filter(s => s.completed_at);

        const accuracies = completedSessions
          .map(s => s.accuracy)
          .filter((a): a is number => a !== null);

        const timeTaken = completedSessions
          .map(s => s.time_taken_seconds)
          .filter((t): t is number => t !== null);

        const sortedByDate = [...completedSessions].sort((a, b) => 
          new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
        );

        return {
          moduleId: module.id,
          moduleTitle: module.title,
          isAllocated: allocatedModuleIds.has(module.id),
          timesCompleted: completedSessions.length,
          bestAccuracy: accuracies.length > 0 ? Math.max(...accuracies) : null,
          averageAccuracy: accuracies.length > 0
            ? accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length
            : null,
          lastPlayedAt: sortedByDate[0]?.completed_at || null,
          totalTimeTakenSeconds: timeTaken.reduce((sum, t) => sum + t, 0),
        };
      });

      // Sort: allocated first, then by times completed
      modulePerformance.sort((a, b) => {
        if (a.isAllocated !== b.isAllocated) return a.isAllocated ? -1 : 1;
        return b.timesCompleted - a.timesCompleted;
      });

      setSelectedPupil({
        pupil,
        modulePerformance,
      });
    } catch (error) {
      console.error("Error fetching pupil report:", error);
    } finally {
      setReportLoading(false);
    }
  };

  const formatAccuracy = (accuracy: number | null) => {
    if (accuracy === null) return "—";
    return `${accuracy.toFixed(1)}%`;
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (accuracy === null) return "secondary";
    if (accuracy >= 80) return "default";
    if (accuracy >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Analytics</h3>
        <p className="text-sm text-muted-foreground">View detailed performance metrics by pupil. Click on a pupil to see their full report.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pupil Activity Overview</CardTitle>
          <CardDescription>
            Performance and progress metrics for all pupils
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : analytics.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pupils have been allocated roles yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Pupil</TableHead>
                    <TableHead className="text-center">Modules Allocated</TableHead>
                    <TableHead className="text-center">Modules Completed</TableHead>
                    <TableHead className="text-center">Average Accuracy</TableHead>
                    <TableHead className="text-center">Started Not Completed</TableHead>
                    <TableHead className="text-center">Total Completions</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map((pupil) => (
                    <TableRow 
                      key={pupil.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fetchPupilFullReport(pupil)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{pupil.name}</div>
                          <div className="text-sm text-muted-foreground">{pupil.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {pupil.uniqueModulesAllocated}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {pupil.uniqueModulesCompleted}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatAccuracy(pupil.averageAccuracy)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {pupil.modulesStartedNotCompleted}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {pupil.totalModulesCompleted}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Report Dialog */}
      <Dialog open={selectedPupil !== null} onOpenChange={(open) => !open && setSelectedPupil(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {reportLoading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-4 gap-4 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
              <Skeleton className="h-64 w-full mt-6" />
            </div>
          ) : selectedPupil && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedPupil.pupil.name}</span>
                </DialogTitle>
                <DialogDescription>{selectedPupil.pupil.email}</DialogDescription>
              </DialogHeader>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-xs">Modules Allocated</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedPupil.pupil.uniqueModulesAllocated}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">Completed</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedPupil.pupil.uniqueModulesCompleted}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs">Avg Accuracy</span>
                    </div>
                    <div className="text-2xl font-bold">{formatAccuracy(selectedPupil.pupil.averageAccuracy)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">Total Completions</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedPupil.pupil.totalModulesCompleted}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Module-by-Module Performance */}
              <div>
                <h4 className="font-semibold mb-3">Module Performance</h4>
                {selectedPupil.modulePerformance.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No modules available</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Module</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Times Completed</TableHead>
                          <TableHead className="text-center">Best Accuracy</TableHead>
                          <TableHead className="text-center">Avg Accuracy</TableHead>
                          <TableHead className="text-center">Total Time</TableHead>
                          <TableHead className="text-center">Last Played</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPupil.modulePerformance.map((module) => (
                          <TableRow key={module.moduleId}>
                            <TableCell className="font-medium">{module.moduleTitle}</TableCell>
                            <TableCell className="text-center">
                              {module.isAllocated ? (
                                <Badge variant="default">Allocated</Badge>
                              ) : (
                                <Badge variant="outline">Not Allocated</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{module.timesCompleted}</TableCell>
                            <TableCell className="text-center">
                              {module.bestAccuracy !== null ? (
                                <Badge variant={getAccuracyColor(module.bestAccuracy)}>
                                  {formatAccuracy(module.bestAccuracy)}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {formatAccuracy(module.averageAccuracy)}
                            </TableCell>
                            <TableCell className="text-center">
                              {formatTime(module.totalTimeTakenSeconds)}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {formatDate(module.lastPlayedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalyticsDashboard;
