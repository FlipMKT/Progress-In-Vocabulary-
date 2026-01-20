import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface OnboardingSlide {
  id: string;
  slide_number: number;
  content: string;
  icon_name: string | null;
  image_url: string | null;
}

interface OnboardingOverlayProps {
  moduleId: string;
  onComplete: () => void;
}

// Default slides for each game type
const getDefaultSlides = (gameType: string): OnboardingSlide[] => {
  switch (gameType) {
    case "matching":
      return [
        {
          id: "default-1",
          slide_number: 1,
          content: "Welcome to the Matching Game!\n\nYou'll see words and their definitions displayed on cards.",
          icon_name: "Gamepad2",
          image_url: null,
        },
        {
          id: "default-2",
          slide_number: 2,
          content: "Click on a word card, then click on the matching definition card to make a pair.",
          icon_name: "MousePointerClick",
          image_url: null,
        },
        {
          id: "default-3",
          slide_number: 3,
          content: "Match all the pairs correctly to complete the game.\n\nGood luck!",
          icon_name: "Trophy",
          image_url: null,
        },
      ];
    case "multiple_choice":
      return [
        {
          id: "default-1",
          slide_number: 1,
          content: "Welcome to the Multiple Choice Quiz!\n\nTest your vocabulary knowledge by selecting the correct answers.",
          icon_name: "ClipboardList",
          image_url: null,
        },
        {
          id: "default-2",
          slide_number: 2,
          content: "For each question, you'll see a word and four possible definitions.\n\nSelect the one that best matches the word.",
          icon_name: "CheckCircle2",
          image_url: null,
        },
        {
          id: "default-3",
          slide_number: 3,
          content: "You have 5 minutes to complete all questions.\n\nThe timer starts when you begin. Good luck!",
          icon_name: "Clock",
          image_url: null,
        },
      ];
    case "synonym_match":
      return [
        {
          id: "default-1",
          slide_number: 1,
          content: "Welcome to Synonym Match!\n\nThis game has two parts to help you master vocabulary.",
          icon_name: "BookOpen",
          image_url: null,
        },
        {
          id: "default-2",
          slide_number: 2,
          content: "Part 1: Open Matching\nSelect a word on the left, then click its matching synonym on the right.",
          icon_name: "ArrowLeftRight",
          image_url: null,
        },
        {
          id: "default-3",
          slide_number: 3,
          content: "Part 2: Memory Match\nCards are face down. Flip them to find matching pairs.\n\nGood luck!",
          icon_name: "RotateCcw",
          image_url: null,
        },
      ];
    default:
      return [
        {
          id: "default-1",
          slide_number: 1,
          content: "Welcome!\n\nGet ready to test and improve your vocabulary.",
          icon_name: "Sparkles",
          image_url: null,
        },
        {
          id: "default-2",
          slide_number: 2,
          content: "Follow the on-screen instructions to complete each challenge.",
          icon_name: "Target",
          image_url: null,
        },
        {
          id: "default-3",
          slide_number: 3,
          content: "Take your time and do your best.\n\nGood luck!",
          icon_name: "Trophy",
          image_url: null,
        },
      ];
  }
};

const OnboardingOverlay = ({ moduleId, onComplete }: OnboardingOverlayProps) => {
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        // Fetch module game type and custom slides
        const [moduleResult, slidesResult] = await Promise.all([
          supabase
            .from("modules")
            .select("game_type")
            .eq("id", moduleId)
            .single(),
          supabase
            .from("module_onboarding_slides")
            .select("*")
            .eq("module_id", moduleId)
            .order("slide_number", { ascending: true }),
        ]);

        if (moduleResult.error) throw moduleResult.error;

        // Use custom slides if available, otherwise use defaults
        if (slidesResult.data && slidesResult.data.length > 0) {
          setSlides(slidesResult.data);
        } else {
          // Use default slides based on game type
          const defaultSlides = getDefaultSlides(moduleResult.data.game_type);
          setSlides(defaultSlides);
        }
      } catch (error) {
        console.error("Error fetching onboarding slides:", error);
        // Show generic defaults on error
        setSlides(getDefaultSlides("default"));
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, [moduleId]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const getIcon = (iconName: string | null): LucideIcon | null => {
    if (!iconName) return null;
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || null;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const slide = slides[currentSlide];
  const IconComponent = getIcon(slide.icon_name);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
    >
      <div className="w-full max-w-lg mx-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-card border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Slide Content */}
            <div className="p-8 space-y-6">
              {/* Icon or Image */}
              <div className="flex justify-center">
                {slide.image_url ? (
                  <img
                    src={slide.image_url}
                    alt="Onboarding"
                    className="w-32 h-32 object-contain rounded-lg"
                  />
                ) : IconComponent ? (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconComponent className="w-10 h-10 text-primary" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {currentSlide + 1}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="text-center space-y-2">
                <p className="text-lg leading-relaxed whitespace-pre-line">
                  {slide.content}
                </p>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? "bg-primary w-6"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="border-t bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={currentSlide === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip
                  <X className="w-4 h-4 ml-1" />
                </Button>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1"
                >
                  {currentSlide === slides.length - 1 ? "Start" : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default OnboardingOverlay;
