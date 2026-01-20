import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AnimatePresence } from "framer-motion";
import OnboardingOverlay from "@/components/games/OnboardingOverlay";

interface Question {
  id: string;
  word: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
}

interface Answer {
  questionId: string;
  selectedOption: string;
}

const MultipleChoiceGame = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [moduleTitle, setModuleTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [sessionId, setSessionId] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      getProfileId();
    }
  }, [user]);

  useEffect(() => {
    if (profileId && moduleId) {
      loadGame();
    }
  }, [profileId, moduleId]);

  const getProfileId = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_id", user.id)
        .limit(1)
        .single();
      
      if (error) throw error;
      if (data) {
        setProfileId(data.id);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const loadGame = async () => {
    if (!profileId) return;

    try {
      // Fetch module details
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("title, game_type")
        .eq("id", moduleId)
        .single();

      if (moduleError) throw moduleError;

      if (moduleData.game_type !== "multiple_choice") {
        toast({
          title: "Wrong game type",
          description: "This module uses a different game format.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setModuleTitle(moduleData.title);

      // Fetch questions
      const { data: vocabData, error: vocabError } = await supabase
        .from("vocab_items")
        .select("id, word, option_a, option_b, option_c, option_d, correct_option")
        .eq("module_id", moduleId)
        .not("option_a", "is", null);

      if (vocabError) throw vocabError;

      if (!vocabData || vocabData.length === 0) {
        toast({
          title: "No questions available",
          description: "This module doesn't have any questions yet.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      const formattedQuestions: Question[] = vocabData.map((item) => ({
        id: item.id,
        word: item.word,
        optionA: item.option_a!,
        optionB: item.option_b!,
        optionC: item.option_c!,
        optionD: item.option_d!,
        correctOption: item.correct_option!,
      }));

      setQuestions(formattedQuestions);

      // Create game session
      const { data: sessionData, error: sessionError } = await supabase
        .from("game_sessions")
        .insert({
          user_id: profileId,
          module_id: parseInt(moduleId!),
          score_total: formattedQuestions.length,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(sessionData.id);
      setLoading(false);
    } catch (error) {
      console.error("Error loading game:", error);
      toast({
        title: "Error",
        description: "Failed to load game. Please try again.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setGameStarted(true);
  }, []);

  // Timer countdown - only starts after onboarding is complete
  useEffect(() => {
    if (loading || isComplete || !gameStarted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isComplete, gameStarted]);

  // Load saved answer for current question
  useEffect(() => {
    const savedAnswer = answers.find(
      (a) => a.questionId === questions[currentQuestionIndex]?.id
    );
    setSelectedOption(savedAnswer?.selectedOption || "");
  }, [currentQuestionIndex, answers, questions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    const currentQuestion = questions[currentQuestionIndex];
    
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== currentQuestion.id);
      return [...filtered, { questionId: currentQuestion.id, selectedOption: option }];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      let correctCount = 0;

      // Calculate score and save answers
      for (const answer of answers) {
        const question = questions.find((q) => q.id === answer.questionId);
        if (question) {
          const isCorrect = answer.selectedOption === question.correctOption;
          if (isCorrect) correctCount++;

          // Save answer to database
          await supabase.from("session_answers").insert({
            game_session_id: sessionId,
            vocab_item_id: parseInt(question.id),
            was_correct: isCorrect,
          });
        }
      }

      // Update game session
      await supabase
        .from("game_sessions")
        .update({
          score_correct: correctCount,
          completed_at: new Date().toISOString(),
          accuracy: (correctCount / questions.length) * 100,
        })
        .eq("id", sessionId);

      setScore(correctCount);
      setIsComplete(true);

      toast({
        title: "Quiz Completed!",
        description: `You scored ${correctCount} out of ${questions.length}`,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                <p className="text-muted-foreground">{moduleTitle}</p>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-primary">{score}/{questions.length}</div>
                <p className="text-lg text-muted-foreground">{percentage.toFixed(0)}% Correct</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate("/dashboard")} variant="outline">
                  Back to Dashboard
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const allQuestionsAnswered = answers.length === questions.length;

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && moduleId && (
          <OnboardingOverlay
            moduleId={moduleId}
            onComplete={handleOnboardingComplete}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{moduleTitle}</h1>
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Question {currentQuestionIndex + 1}:
              </p>
              <p className="text-lg">
                Which of these words is closest in meaning to the word{" "}
                <strong className="font-bold text-primary">{currentQuestion.word}</strong>?
              </p>
            </div>

            {/* Options */}
            <div className="grid gap-3">
              {[
                { label: "A", value: currentQuestion.optionA },
                { label: "B", value: currentQuestion.optionB },
                { label: "C", value: currentQuestion.optionC },
                { label: "D", value: currentQuestion.optionD },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleOptionSelect(option.label)}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-[1.02] ${
                    selectedOption === option.label
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        selectedOption === option.label
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {option.label}
                    </div>
                    <span className="text-base">{option.value}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="flex gap-2">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button onClick={handleNext} disabled={!selectedOption}>
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!allQuestionsAnswered}
                    className="bg-primary"
                  >
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Section - Bottom */}
        <div className="mt-6 space-y-4">
          {/* Progress Circles */}
          <div className="flex gap-2 justify-center">
            {questions.map((_, index) => {
              const isAnswered = answers.some((a) => a.questionId === questions[index].id);
              const isCurrent = index === currentQuestionIndex;
              return (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isAnswered
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{answers.length} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceGame;