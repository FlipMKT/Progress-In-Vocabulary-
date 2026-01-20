import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import OpenMatchingGame, { SynonymPair } from "@/components/games/OpenMatchingGame";
import CardFlipMemoryGame from "@/components/games/CardFlipMemoryGame";
import FeedbackOverlay from "@/components/games/FeedbackOverlay";
import OnboardingOverlay from "@/components/games/OnboardingOverlay";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface VocabItem {
  id: string;
  word: string;
  definition: string;
}

const SynonymMatchGame = () => {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [moduleTitle, setModuleTitle] = useState("");
  const [allPairs, setAllPairs] = useState<SynonymPair[]>([]);
  const [currentGame, setCurrentGame] = useState(1); // 1 = Open Matching, 2 = Card Flip
  const [currentPart, setCurrentPart] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTransition, setShowTransition] = useState<"part-complete" | "game-complete" | "module-complete" | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);

  const PAIRS_PER_PART = 5;

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setGameStarted(true);
    setGameStartTime(Date.now());
  }, []);

  // Timer effect - only starts after onboarding is complete
  useEffect(() => {
    if (!gameStarted || !gameStartTime) return;
    
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameStartTime]);

  useEffect(() => {
    if (user) {
      getProfileId();
    }
  }, [user]);

  useEffect(() => {
    if (!moduleId || !profileId) return;
    initializeGame();
  }, [moduleId, profileId]);

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

  const initializeGame = async () => {
    if (!profileId) return;

    try {
      // Fetch module details
      const { data: module, error: moduleError } = await supabase
        .from("modules")
        .select("title, game_type")
        .eq("id", moduleId)
        .single();

      if (moduleError) throw moduleError;
      setModuleTitle(module.title);

      // Fetch vocabulary items
      const { data: vocabItems, error: vocabError } = await supabase
        .from("vocab_items")
        .select("id, word, definition")
        .eq("module_id", moduleId)
        .limit(15);

      if (vocabError) throw vocabError;

      if (!vocabItems || vocabItems.length === 0) {
        toast({
          title: "No vocabulary",
          description: "This module doesn't have any vocabulary items yet",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Convert vocab items to synonym pairs
      const pairs: SynonymPair[] = vocabItems.map((item) => ({
        id: item.id,
        word: item.word,
        synonym: item.definition,
      }));

      setAllPairs(pairs);

      // Create game session
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .insert([{
          user_id: profileId,
          module_id: parseInt(moduleId!),
          score_total: vocabItems.length,
          game_number: 1,
          part_number: 1,
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);
      setLoading(false);
    } catch (error: any) {
      console.error("Error initializing game:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  // Memoize current pairs to prevent unnecessary re-renders
  const currentPairs = useMemo(() => {
    const startIndex = (currentPart - 1) * PAIRS_PER_PART;
    const endIndex = Math.min(startIndex + PAIRS_PER_PART, allPairs.length);
    return allPairs.slice(startIndex, endIndex);
  }, [allPairs, currentPart, PAIRS_PER_PART]);

  const getTotalParts = () => Math.ceil(allPairs.length / PAIRS_PER_PART);

  const handlePairMatched = async (pairId: string, attempts: number) => {
    setTotalCorrect(prev => prev + 1);
    setTotalAttempts(prev => prev + attempts);

    // Save to database
    if (sessionId) {
      try {
        await supabase
          .from("session_answers")
          .insert([{
            game_session_id: sessionId,
            vocab_item_id: parseInt(pairId),
            was_correct: true,
          }]);
      } catch (error) {
        console.error("Error saving answer:", error);
      }
    }
  };

  const handlePartComplete = async (attempts: Map<string, number>, timeTaken: number) => {
    const totalParts = getTotalParts();
    const isLastPartOfGame = currentPart >= totalParts;
    const isGame1 = currentGame === 1;

    // Update session with current progress
    if (sessionId) {
      try {
        await supabase
          .from("game_sessions")
          .update({
            game_number: currentGame,
            part_number: currentPart,
            time_taken_seconds: Math.round(timeTaken / 1000),
          })
          .eq("id", sessionId);
      } catch (error) {
        console.error("Error updating session:", error);
      }
    }

    if (isLastPartOfGame && isGame1) {
      // Completed Game 1, move to Game 2
      setShowTransition("game-complete");
    } else if (isLastPartOfGame && !isGame1) {
      // Completed entire module - capture final time before showing overlay
      setFinalTime(elapsedSeconds);
      await completeModule();
      setShowTransition("module-complete");
    } else {
      // Move to next part
      setShowTransition("part-complete");
    }
  };

  const handleContinue = () => {
    const totalParts = getTotalParts();

    if (showTransition === "game-complete") {
      // Move to Game 2
      setCurrentGame(2);
      setCurrentPart(1);
      setShowTransition(null);
    } else if (showTransition === "module-complete") {
      // Go to dashboard
      navigate("/dashboard");
    } else {
      // Next part
      if (currentPart < totalParts) {
        setCurrentPart(prev => prev + 1);
      }
      setShowTransition(null);
    }
  };

  const completeModule = async () => {
    if (!sessionId) return;

    const accuracy = allPairs.length > 0 ? (totalCorrect / (allPairs.length * 2)) * 100 : 0;

    try {
      await supabase
        .from("game_sessions")
        .update({
          score_correct: totalCorrect,
          completed_at: new Date().toISOString(),
          accuracy: Math.round(accuracy),
          game_number: 2,
          part_number: getTotalParts(),
        })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error completing game:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/5">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  const totalParts = getTotalParts();
  const overallProgress = ((currentGame - 1) * totalParts + currentPart) / (totalParts * 2) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && moduleId && (
          <OnboardingOverlay
            moduleId={moduleId}
            onComplete={handleOnboardingComplete}
          />
        )}
      </AnimatePresence>

      {/* Transition Overlays */}
      <AnimatePresence>
        {showTransition === "part-complete" && (
          <FeedbackOverlay
            type="part-complete"
            message="Part Complete!"
            subMessage={`You've completed Part ${currentPart}. Keep going!`}
            onContinue={handleContinue}
          />
        )}
        {showTransition === "game-complete" && (
          <FeedbackOverlay
            type="game-complete"
            message="That's brilliant, well done!"
            subMessage="Now it's time to make it a little harder."
            onContinue={handleContinue}
          />
        )}
        {showTransition === "module-complete" && (
          <FeedbackOverlay
            type="module-complete"
            message="Well Done!"
            subMessage={`You really did well there. You spent ${formatTime(finalTime ?? elapsedSeconds)} developing your vocab.`}
            onContinue={handleContinue}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-bold">{moduleTitle}</h1>
              <p className="text-sm text-muted-foreground">
                Game {currentGame} • Part {currentPart} of {totalParts}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(elapsedSeconds)}</span>
            </div>
          </div>
          <Progress value={overallProgress} className="mt-4" />
        </div>
      </header>

      {/* Main Game Area */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">
            {currentGame === 1 ? "Match the Synonyms" : "Memory Match"}
          </h2>
          <p className="text-muted-foreground">
            {currentGame === 1 
              ? "Select a word on the left, then click its synonym on the right"
              : "Flip a card on the left, then find its matching synonym on the right"
            }
          </p>
        </div>

        {currentGame === 1 ? (
          <OpenMatchingGame
            pairs={currentPairs}
            partNumber={currentPart}
            onPartComplete={handlePartComplete}
            onPairMatched={handlePairMatched}
          />
        ) : (
          <CardFlipMemoryGame
            pairs={currentPairs}
            partNumber={currentPart}
            onPartComplete={handlePartComplete}
            onPairMatched={handlePairMatched}
          />
        )}
      </main>
    </div>
  );
};

export default SynonymMatchGame;