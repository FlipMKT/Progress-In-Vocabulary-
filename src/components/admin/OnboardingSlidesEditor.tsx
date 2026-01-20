import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  SkipForward, 
  BookOpen, 
  Target, 
  Trophy,
  Lightbulb,
  Gamepad2,
  Star,
  Zap,
  Brain,
  Sparkles,
  Save
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnboardingSlide {
  id?: string;
  module_id: string;
  slide_number: number;
  icon_name: string;
  image_url: string;
  content: string;
}

interface OnboardingSlidesEditorProps {
  moduleId: string;
  gameType: string;
}

const AVAILABLE_ICONS = [
  { name: "BookOpen", icon: BookOpen },
  { name: "Target", icon: Target },
  { name: "Trophy", icon: Trophy },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Star", icon: Star },
  { name: "Zap", icon: Zap },
  { name: "Brain", icon: Brain },
  { name: "Sparkles", icon: Sparkles },
];

const getDefaultSlides = (moduleId: string, gameType: string): OnboardingSlide[] => {
  const defaults: Record<string, OnboardingSlide[]> = {
    matching: [
      { module_id: moduleId, slide_number: 1, icon_name: "BookOpen", image_url: "", content: "Welcome to the Matching Game!\n\nMatch words with their definitions by selecting pairs.\nTest your vocabulary knowledge in a fun, interactive way." },
      { module_id: moduleId, slide_number: 2, icon_name: "Target", image_url: "", content: "How to Play\n\nClick on a word, then click on its matching definition.\nCorrect matches will be highlighted green.\nKeep going until all pairs are matched!" },
      { module_id: moduleId, slide_number: 3, icon_name: "Trophy", image_url: "", content: "Track Your Progress\n\nYour score and accuracy are recorded.\nTry to complete the module with the highest accuracy!\nGood luck!" },
    ],
    multiple_choice: [
      { module_id: moduleId, slide_number: 1, icon_name: "Brain", image_url: "", content: "Welcome to Multiple Choice!\n\nTest your knowledge by selecting the correct answer.\nEach question has four options to choose from." },
      { module_id: moduleId, slide_number: 2, icon_name: "Lightbulb", image_url: "", content: "How to Play\n\nRead each question carefully.\nSelect the answer you think is correct.\nGet instant feedback on your choice!" },
      { module_id: moduleId, slide_number: 3, icon_name: "Star", image_url: "", content: "Aim for the Top!\n\nTry to answer as many questions correctly as possible.\nYour results will be saved to track improvement.\nLet's begin!" },
    ],
    synonym_match: [
      { module_id: moduleId, slide_number: 1, icon_name: "Sparkles", image_url: "", content: "Welcome to Synonym Match!\n\nThis game tests your knowledge of word relationships.\nMatch words with their synonyms across two exciting games." },
      { module_id: moduleId, slide_number: 2, icon_name: "Gamepad2", image_url: "", content: "Two Games in One\n\nGame 1: Card flip memory matching.\nGame 2: Open matching with visible cards.\nComplete both for the best score!" },
      { module_id: moduleId, slide_number: 3, icon_name: "Zap", image_url: "", content: "Ready to Challenge Yourself?\n\nPay attention to word pairs and their meanings.\nThe faster and more accurate you are, the better!\nLet's get started!" },
    ],
  };

  return defaults[gameType] || defaults.matching;
};

const OnboardingSlidesEditor = ({ moduleId, gameType }: OnboardingSlidesEditorProps) => {
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSlides();
  }, [moduleId]);

  const fetchSlides = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("module_onboarding_slides")
        .select("*")
        .eq("module_id", moduleId)
        .order("slide_number", { ascending: true });

      if (error) throw error;

      if (data && data.length === 3) {
        setSlides(data);
      } else {
        // Initialize with defaults if no slides exist
        setSlides(getDefaultSlides(moduleId, gameType));
      }
    } catch (error) {
      console.error("Error fetching slides:", error);
      setSlides(getDefaultSlides(moduleId, gameType));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSlides = async () => {
    setIsSaving(true);
    try {
      // Delete existing slides first
      await supabase
        .from("module_onboarding_slides")
        .delete()
        .eq("module_id", moduleId);

      // Insert all slides
      const { error } = await supabase
        .from("module_onboarding_slides")
        .insert(slides.map(slide => ({
          module_id: slide.module_id,
          slide_number: slide.slide_number,
          icon_name: slide.icon_name,
          image_url: slide.image_url,
          content: slide.content,
        })));

      if (error) throw error;

      toast({
        title: "Success",
        description: "Onboarding slides saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving slides:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save slides",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSlide = (field: keyof OnboardingSlide, value: string) => {
    setSlides(prev => prev.map((slide, index) => 
      index === currentSlide ? { ...slide, [field]: value } : slide
    ));
  };

  const IconComponent = AVAILABLE_ICONS.find(i => i.name === slides[currentSlide]?.icon_name)?.icon || BookOpen;

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading slides...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Onboarding Slides</h4>
        <Button onClick={handleSaveSlides} disabled={isSaving} size="sm">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Slides"}
        </Button>
      </div>

      {/* Preview Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-lg">Slide {currentSlide + 1} of 3 Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center whitespace-pre-line text-sm text-muted-foreground min-h-[100px]">
            {slides[currentSlide]?.content || "Enter slide content..."}
          </div>
          
          {/* Navigation Preview */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentSlide === 0}
              onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                    i === currentSlide ? "bg-primary" : "bg-muted"
                  }`}
                  onClick={() => setCurrentSlide(i)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <SkipForward className="w-4 h-4 mr-1" />
                Skip
              </Button>
              <Button 
                size="sm"
                disabled={currentSlide === 2}
                onClick={() => setCurrentSlide(prev => Math.min(2, prev + 1))}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <div className="space-y-4 p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((num) => (
            <Button
              key={num}
              variant={currentSlide === num - 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentSlide(num - 1)}
            >
              Slide {num}
            </Button>
          ))}
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Icon</Label>
            <Select
              value={slides[currentSlide]?.icon_name || "BookOpen"}
              onValueChange={(value) => updateSlide("icon_name", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                  <SelectItem key={name} value={name}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Image URL (optional)</Label>
            <Input
              placeholder="https://example.com/image.png"
              value={slides[currentSlide]?.image_url || ""}
              onChange={(e) => updateSlide("image_url", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If provided, the image will be shown instead of the icon
            </p>
          </div>

          <div className="space-y-2">
            <Label>Content (3-4 lines)</Label>
            <Textarea
              placeholder="Enter slide content..."
              value={slides[currentSlide]?.content || ""}
              onChange={(e) => updateSlide("content", e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Use line breaks to separate paragraphs. Keep content concise and clear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSlidesEditor;
