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
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";

interface Question {
  id: string;
  word: string;
  definition: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: string | null;
}

interface QuestionManagementProps {
  moduleId: string;
  moduleTitle: string;
  gameType: string;
  onBack: () => void;
}

const QuestionManagement = ({ moduleId, moduleTitle, gameType, onBack }: QuestionManagementProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [open, setOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    word: "",
    definition: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [moduleId]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("vocab_items")
        .select("*")
        .eq("module_id", moduleId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Module ID type:', typeof moduleId, 'Value:', moduleId);

    try {
      const questionData = {
        module_id: parseInt(moduleId),
        word: formData.word,
        definition: formData.definition,
        ...(gameType === "multiple_choice" && {
          option_a: formData.option_a,
          option_b: formData.option_b,
          option_c: formData.option_c,
          option_d: formData.option_d,
          correct_option: formData.correct_option,
        }),
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from("vocab_items")
          .update(questionData)
          .eq("id", editingQuestion.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("vocab_items")
          .insert([questionData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question created successfully",
        });
      }

      setOpen(false);
      resetForm();
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const { error } = await supabase
        .from("vocab_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });

      fetchQuestions();
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
      word: "",
      definition: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
    });
    setEditingQuestion(null);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      word: question.word,
      definition: question.definition,
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      option_c: question.option_c || "",
      option_d: question.option_d || "",
      correct_option: question.correct_option || "A",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Modules
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{moduleTitle} - Questions</h3>
          <p className="text-sm text-muted-foreground">
            {gameType === "multiple_choice" ? "Multiple Choice Questions" : "Matching Pairs"}
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Question" : "Add New Question"}
              </DialogTitle>
              <DialogDescription>
                {gameType === "multiple_choice"
                  ? "Create a multiple choice question with 4 options"
                  : "Create a word and definition pair"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="word">Word/Term *</Label>
                <Input
                  id="word"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  placeholder="e.g., brisk"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="definition">Definition *</Label>
                <Textarea
                  id="definition"
                  value={formData.definition}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                  placeholder="e.g., Moving or acting quickly"
                  required
                />
              </div>

              {gameType === "multiple_choice" && (
                <>
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Multiple Choice Options</h4>

                    <div className="space-y-2">
                      <Label htmlFor="option_a">Option A *</Label>
                      <Input
                        id="option_a"
                        value={formData.option_a}
                        onChange={(e) =>
                          setFormData({ ...formData, option_a: e.target.value })
                        }
                        placeholder="First option"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="option_b">Option B *</Label>
                      <Input
                        id="option_b"
                        value={formData.option_b}
                        onChange={(e) =>
                          setFormData({ ...formData, option_b: e.target.value })
                        }
                        placeholder="Second option"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="option_c">Option C *</Label>
                      <Input
                        id="option_c"
                        value={formData.option_c}
                        onChange={(e) =>
                          setFormData({ ...formData, option_c: e.target.value })
                        }
                        placeholder="Third option"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="option_d">Option D *</Label>
                      <Input
                        id="option_d"
                        value={formData.option_d}
                        onChange={(e) =>
                          setFormData({ ...formData, option_d: e.target.value })
                        }
                        placeholder="Fourth option"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="correct_option">Correct Answer *</Label>
                      <Select
                        value={formData.correct_option}
                        onValueChange={(value) =>
                          setFormData({ ...formData, correct_option: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A - {formData.option_a || "Option A"}</SelectItem>
                          <SelectItem value="B">B - {formData.option_b || "Option B"}</SelectItem>
                          <SelectItem value="C">C - {formData.option_c || "Option C"}</SelectItem>
                          <SelectItem value="D">D - {formData.option_d || "Option D"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                {editingQuestion ? "Update Question" : "Create Question"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No questions yet. Click "Add Question" to create one.
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {index + 1}. {question.word}
                    </CardTitle>
                    <CardDescription className="mt-2">{question.definition}</CardDescription>
                    {gameType === "multiple_choice" && question.option_a && (
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className={question.correct_option === "A" ? "font-semibold text-primary" : ""}>
                            A) {question.option_a}
                          </div>
                          <div className={question.correct_option === "B" ? "font-semibold text-primary" : ""}>
                            B) {question.option_b}
                          </div>
                          <div className={question.correct_option === "C" ? "font-semibold text-primary" : ""}>
                            C) {question.option_c}
                          </div>
                          <div className={question.correct_option === "D" ? "font-semibold text-primary" : ""}>
                            D) {question.option_d}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Correct answer: <span className="font-semibold">{question.correct_option}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(question)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
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

export default QuestionManagement;