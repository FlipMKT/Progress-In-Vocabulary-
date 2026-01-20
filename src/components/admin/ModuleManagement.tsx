import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, List } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import QuestionManagement from "./QuestionManagement";
import OnboardingSlidesEditor from "./OnboardingSlidesEditor";

interface Module {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  is_active: boolean;
  game_type: string;
}

interface ModuleManagementProps {
  onUpdate: () => void;
}

const ModuleManagement = ({ onUpdate }: ModuleManagementProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [open, setOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    level: "",
    is_active: true,
    game_type: "matching",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast({
        title: "Error",
        description: "Failed to load modules",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingModule) {
        const { error } = await supabase
          .from("modules")
          .update(formData)
          .eq("id", editingModule.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Module updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("modules")
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Module created successfully",
        });
      }

      setOpen(false);
      resetForm();
      fetchModules();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
      
      fetchModules();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subject: "",
      level: "",
      is_active: true,
      game_type: "matching",
    });
    setEditingModule(null);
  };

  const openEditDialog = (module: Module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description,
      subject: module.subject,
      level: module.level,
      is_active: module.is_active,
      game_type: module.game_type,
    });
    setOpen(true);
  };

  if (selectedModule) {
    return (
      <QuestionManagement
        moduleId={selectedModule.id}
        moduleTitle={selectedModule.title}
        gameType={selectedModule.game_type}
        onBack={() => setSelectedModule(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Module Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage vocabulary modules</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingModule ? "Edit Module" : "Create New Module"}</DialogTitle>
              <DialogDescription>
                {editingModule ? "Update module details and onboarding slides" : "Add a new vocabulary module"}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input
                      id="level"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="game_type">Game Type *</Label>
                  <Select
                    value={formData.game_type}
                    onValueChange={(value) => setFormData({ ...formData, game_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matching">Matching Game</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="synonym_match">Synonym Match (2 Games)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                
                {/* Onboarding Slides Editor - only show when editing */}
                {editingModule && (
                  <div className="pt-4 border-t">
                    <OnboardingSlidesEditor 
                      moduleId={editingModule.id} 
                      gameType={formData.game_type}
                    />
                  </div>
                )}
                
                <Button type="submit" className="w-full">
                  {editingModule ? "Update Module" : "Create Module"}
                </Button>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {modules.map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                  <div className="flex gap-2 mt-2">
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
                    <span className={`text-xs px-2 py-1 rounded ${
                      module.is_active 
                        ? "bg-success/10 text-success" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {module.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      module.game_type === "multiple_choice"
                        ? "bg-primary/10 text-primary"
                        : module.game_type === "synonym_match"
                        ? "bg-accent/10 text-accent"
                        : "bg-secondary/10 text-secondary"
                    }`}>
                      {module.game_type === "multiple_choice" 
                        ? "Multiple Choice" 
                        : module.game_type === "synonym_match"
                        ? "Synonym Match"
                        : "Matching"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedModule(module)}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Questions
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(module)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(module.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModuleManagement;
