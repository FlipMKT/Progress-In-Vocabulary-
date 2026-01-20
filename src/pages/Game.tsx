import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import OnboardingOverlay from "@/components/games/OnboardingOverlay";

interface VocabItem {
  id: string;
  word: string;
  definition: string;
}

interface MatchCard {
  id: string;
  content: string;
  type: "word" | "definition";
  vocabId: string;
  matched: boolean;
}

const Game = () => {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [moduleTitle, setModuleTitle] = useState("");
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setGameStarted(true);
  }, []);

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
      
      // Redirect to appropriate game type
      if (module.game_type === "multiple_choice") {
        navigate(`/game/multiple-choice/${moduleId}`);
        return;
      }
      if (module.game_type === "synonym_match") {
        navigate(`/game/synonym-match/${moduleId}`);
        return;
      }
      
      setModuleTitle(module.title);

      // Fetch vocabulary items
      const { data: vocabItems, error: vocabError } = await supabase
        .from("vocab_items")
        .select("id, word, definition")
        .eq("module_id", moduleId)
        .limit(6);

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

      // Create game session
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .insert([{
          user_id: profileId,
          module_id: parseInt(moduleId!),
          score_total: vocabItems.length,
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Create cards
      const gameCards: MatchCard[] = [];
      vocabItems.forEach((item) => {
        gameCards.push({
          id: `word-${item.id}`,
          content: item.word,
          type: "word",
          vocabId: item.id,
          matched: false,
        });
        gameCards.push({
          id: `def-${item.id}`,
          content: item.definition,
          type: "definition",
          vocabId: item.id,
          matched: false,
        });
      });

      // Shuffle cards
      setCards(shuffleArray(gameCards));
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

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleCardClick = async (card: MatchCard) => {
    if (card.matched || selectedCards.some(c => c.id === card.id)) return;

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      const isMatch = first.vocabId === second.vocabId && first.type !== second.type;

      setScore(prev => ({ ...prev, total: prev.total + 1 }));

      if (isMatch) {
        // Match found
        setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
        setCards(prev => prev.map(c => 
          c.vocabId === first.vocabId ? { ...c, matched: true } : c
        ));

        // Save answer
        if (sessionId) {
          await supabase
            .from("session_answers")
            .insert([{
              game_session_id: sessionId,
              vocab_item_id: parseInt(first.vocabId),
              was_correct: true,
            }]);
        }

        toast({
          title: "Correct!",
          description: "Well done!",
        });
      } else {
        // No match
        if (sessionId) {
          await supabase
            .from("session_answers")
            .insert([{
              game_session_id: sessionId,
              vocab_item_id: parseInt(first.vocabId),
              was_correct: false,
            }]);
        }

        toast({
          title: "Not quite",
          description: "Try again!",
          variant: "destructive",
        });
      }

      // Clear selection after a delay
      setTimeout(() => {
        setSelectedCards([]);
        
        // Check if game is complete
        const allMatched = cards.every(c => 
          c.matched || c.vocabId === first.vocabId
        );
        if (allMatched && isMatch) {
          completeGame();
        }
      }, 1000);
    }
  };

  const completeGame = async () => {
    if (!sessionId) return;

    const accuracy = (score.correct / cards.length) * 100 * 2; // multiply by 2 since we have word+def pairs

    try {
      await supabase
        .from("game_sessions")
        .update({
          score_correct: score.correct,
          completed_at: new Date().toISOString(),
          accuracy: Math.round(accuracy),
        })
        .eq("id", sessionId);

      setGameComplete(true);
    } catch (error) {
      console.error("Error completing game:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading game...
      </div>
    );
  }

  if (gameComplete) {
    const accuracy = Math.round((score.correct / (cards.length / 2)) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-scale-in">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-success flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-success-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Great Job!</h2>
              <p className="text-muted-foreground">You've completed the module</p>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold text-primary">{accuracy}%</div>
              <p className="text-sm text-muted-foreground">
                {score.correct} out of {cards.length / 2} correct
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="flex-1">
                Dashboard
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Play Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (cards.filter(c => c.matched).length / cards.length) * 100;

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
                {score.correct} correct • {score.total} attempts
              </p>
            </div>
            <div className="w-20"></div>
          </div>
          <Progress value={progress} className="mt-4" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Match the Vocabulary</h2>
            <p className="text-muted-foreground">Click on a word and then its definition</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={card.matched}
                className={cn(
                  "p-6 rounded-lg border-2 text-left transition-all duration-200",
                  "hover:shadow-lg hover:scale-105 active:scale-95",
                  card.matched && "bg-success/10 border-success opacity-50 cursor-not-allowed",
                  !card.matched && selectedCards.some(c => c.id === card.id) && "border-primary bg-primary/5 scale-105",
                  !card.matched && !selectedCards.some(c => c.id === card.id) && "bg-card border-border hover:border-primary",
                  card.type === "word" && "font-bold"
                )}
              >
                <div className="flex items-start justify-between">
                  <span className={cn(
                    "flex-1",
                    card.type === "word" ? "text-lg" : "text-sm"
                  )}>
                    {card.content}
                  </span>
                  {card.matched && (
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 ml-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Game;