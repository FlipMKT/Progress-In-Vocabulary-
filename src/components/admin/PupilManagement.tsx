import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Eye, EyeOff } from "lucide-react";

interface Pupil {
  id: number;
  email: string;
  name: string;
  auth_id: string;
  assignedModules?: Array<{ id: string; title: string }>;
}

interface Module {
  id: string;
  title: string;
  game_type: string;
}

interface PupilManagementProps {
  onUpdate: () => void;
}

const PupilManagement = ({ onUpdate }: PupilManagementProps) => {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null);
  const [assignedModuleIds, setAssignedModuleIds] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPupils();
    fetchModules();
  }, []);

  const fetchPupils = async () => {
    try {
      // Get all user_ids with pupil role
      const { data: pupilRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "pupil");

      if (rolesError) throw rolesError;

      const pupilIds = pupilRoles?.map(r => r.user_id) || [];

      if (pupilIds.length === 0) {
        setPupils([]);
        return;
      }

      // Get profiles for those user_ids
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, auth_id")
        .in("id", pupilIds);

      if (profilesError) throw profilesError;

      // Fetch assigned modules for each pupil
      const pupilsWithModules = await Promise.all(
        (profiles || []).map(async (pupil: any) => {
          // Get module assignments
          const { data: assignments, error: assignError } = await supabase
            .from("module_assignments")
            .select("module_id")
            .eq("user_id", pupil.id);

          console.log('Pupil:', pupil.id, 'Raw assignments:', assignments);

          if (assignError) {
            console.error('Error fetching assignments:', assignError);
          }

          // Get module details for assigned modules
          const moduleIds = assignments?.map(a => a.module_id) || [];
          let assignedModules: Array<{ id: string; title: string }> = [];

          if (moduleIds.length > 0) {
            const { data: moduleDetails, error: moduleError } = await supabase
              .from("modules")
              .select("id, title")
              .in("id", moduleIds);

            if (moduleError) {
              console.error('Error fetching module details:', moduleError);
            } else {
              assignedModules = moduleDetails?.map((m: any) => ({
                id: String(m.id),
                title: m.title
              })) || [];
            }
          }

          console.log('Pupil:', pupil.id, 'Assigned modules:', assignedModules);

          return {
            id: pupil.id,
            name: pupil.name,
            email: "",
            auth_id: pupil.auth_id,
            assignedModules
          };
        })
      );

      setPupils(pupilsWithModules);
    } catch (error) {
      console.error("Error fetching pupils:", error);
      toast({
        title: "Error",
        description: "Failed to load pupils",
        variant: "destructive",
      });
    }
  };

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from("modules")
        .select("id, title, game_type")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const fetchPupilAssignments = async (pupilId: number) => {
    try {
      console.log('Fetching assignments for pupil ID:', pupilId, 'Type:', typeof pupilId);
      
      const { data, error } = await supabase
        .from("module_assignments")
        .select("module_id")
        .eq("user_id", pupilId);

      if (error) throw error;
      
      console.log('Fetched assignments:', data);
      setAssignedModuleIds(new Set(data?.map(a => String(a.module_id)) || []));
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const openEditDialog = async (pupil: Pupil) => {
    console.log('Opening edit for pupil:', pupil);
    console.log('Pupil ID:', pupil.id, 'Type:', typeof pupil.id);
    
    setSelectedPupil(pupil);
    setEditFormData({
      name: pupil.name,
    });
    // Fetch current assignments for this pupil
    await fetchPupilAssignments(pupil.id);
    setEditOpen(true);
  };

  const handleToggleModule = async (moduleId: string, isAssigned: boolean) => {
    console.log('Toggle module:', { 
      moduleId, 
      moduleIdType: typeof moduleId,
      moduleIdParsed: parseInt(moduleId),
      isAssigned, 
      selectedPupil,
      selectedPupilId: selectedPupil?.id,
      selectedPupilIdType: typeof selectedPupil?.id
    });
    
    if (!selectedPupil) return;

    try {
      if (isAssigned) {
        const { error } = await supabase
          .from("module_assignments")
          .delete()
          .eq("user_id", selectedPupil.id)
          .eq("module_id", parseInt(moduleId));

        if (error) throw error;

        setAssignedModuleIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(moduleId);
          return newSet;
        });

        toast({
          title: "Module unassigned",
          description: "Module has been removed from the pupil",
        });
      } else {
        const insertData = {
          user_id: selectedPupil.id,
          module_id: parseInt(moduleId),
        };
        
        console.log('Inserting assignment:', insertData);

        const { error } = await supabase
          .from("module_assignments")
          .insert([insertData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        setAssignedModuleIds(prev => new Set([...prev, moduleId]));

        toast({
          title: "Module assigned",
          description: "Module has been assigned to the pupil",
        });
        
        // Refresh pupils list to update the displayed modules
        fetchPupils();
      }
    } catch (error: any) {
      console.error('Toggle error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Call the database function to create profile and role
      const { data: result, error: functionError } = await supabase
        .rpc('create_pupil_account', {
          p_email: formData.email,
          p_password: formData.password,
          p_name: formData.name,
          p_auth_id: authData.user.id
        });

      if (functionError) throw functionError;
      
      if (!result || result.length === 0 || !result[0].success) {
        throw new Error(result?.[0]?.error_message || "Failed to create pupil account");
      }

      toast({
        title: "Success",
        description: "Pupil account created successfully",
      });

      setOpen(false);
      resetForm();
      fetchPupils();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPupil) return;

    console.log('Saving changes for pupil:', selectedPupil);
    console.log('Pupil ID being saved:', selectedPupil.id, 'Type:', typeof selectedPupil.id);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: editFormData.name })
        .eq("id", selectedPupil.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Pupil details updated successfully",
      });

      setEditOpen(false);
      fetchPupils();
      onUpdate();
    } catch (error: any) {
      console.error('Edit submit error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (pupil: Pupil) => {
    if (!confirm("Are you sure you want to delete this pupil account?")) return;

    try {
      // First delete from user_roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", pupil.id);

      // Then delete the profile
      await supabase
        .from("profiles")
        .delete()
        .eq("id", pupil.id);

      // Remove from local state immediately
      setPupils(prev => prev.filter(p => p.id !== pupil.id));

      toast({
        title: "Success",
        description: "Pupil account deleted successfully",
      });
      
      onUpdate();
    } catch (error: any) {
      // Only show error if it's not about the record already being deleted
      if (!error.message?.includes("0 rows")) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      // Refresh the list anyway
      fetchPupils();
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
    });
    setShowPassword(false);
  };

  const getGameTypeLabel = (gameType: string) => {
    switch (gameType) {
      case "multiple_choice": return "Multiple Choice";
      case "synonym_match": return "Synonym Match";
      default: return "Matching";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Pupil Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage pupil accounts</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Pupil
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Pupil</DialogTitle>
              <DialogDescription>
                Add a new pupil account to the platform
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create Pupil
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Pupil Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pupil Details</DialogTitle>
            <DialogDescription>
              Update the pupil's name and assigned modules
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>

            {/* Module Assignment Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Assigned Modules</Label>
                <span className="text-sm text-muted-foreground">
                  {assignedModuleIds.size} of {modules.length} assigned
                </span>
              </div>
              
              {modules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active modules available. Create a module first.
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-3">
                  {modules.map((module) => {
                    const isAssigned = assignedModuleIds.has(module.id);
                    const checkboxId = "edit-" + module.id;
                    return (
                      <div
                        key={module.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={isAssigned}
                          onCheckedChange={() => handleToggleModule(module.id, isAssigned)}
                        />
                        <label
                          htmlFor={checkboxId}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{module.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {getGameTypeLabel(module.game_type)}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {pupils.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No pupils created yet</p>
            </CardContent>
          </Card>
        ) : (
          pupils.map((pupil) => (
            <Card key={pupil.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{pupil.name}</CardTitle>
                    {pupil.email && (
                      <CardDescription>{pupil.email}</CardDescription>
                    )}
                    
                    {/* Show assigned modules */}
                    {pupil.assignedModules && pupil.assignedModules.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {pupil.assignedModules.map((module) => (
                          <span
                            key={module.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {module.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">No modules assigned</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(pupil)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pupil)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PupilManagement;