import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FlipCard from "./FlipCard";
import FeedbackOverlay from "./FeedbackOverlay";

export interface SynonymPair {
  id: string;
  word: string;
  synonym: string;
}

interface CardFlipMemoryGameProps {
  pairs: SynonymPair[];
  partNumber: number;
  onPartComplete: (attempts: Map<string, number>, timeTaken: number) => void;
  onPairMatched: (pairId: string, attempts: number) => void;
}

const CardFlipMemoryGame = ({ 
  pairs, 
  partNumber, 
  onPartComplete,
  onPairMatched,
}: CardFlipMemoryGameProps) => {
  const [leftColumn, setLeftColumn] = useState<SynonymPair[]>([]);
  const [rightColumn, setRightColumn] = useState<SynonymPair[]>([]);
  const [flippedLeft, setFlippedLeft] = useState<string | null>(null);
  const [flippedRight, setFlippedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState<Map<string, number>>(new Map());
  const [incorrectPair, setIncorrectPair] = useState<{ left: string; right: string } | null>(null);
  const [correctPair, setCorrectPair] = useState<{ left: string; right: string } | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [startTime] = useState(Date.now());
  const [promptMessage, setPromptMessage] = useState("");

  useEffect(() => {
    // Shuffle columns independently
    setLeftColumn(shuffleArray([...pairs]));
    setRightColumn(shuffleArray([...pairs]));
    setMatchedPairs(new Set());
    setAttempts(new Map());
    setFlippedLeft(null);
    setFlippedRight(null);
    setIncorrectPair(null);
    setCorrectPair(null);
    setPromptMessage("");
  }, [pairs, partNumber]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleLeftClick = (pairId: string) => {
    if (matchedPairs.has(pairId) || feedback) return;
    
    // If clicking same card, unflip it
    if (flippedLeft === pairId) {
      setFlippedLeft(null);
      setPromptMessage("");
      return;
    }

    setFlippedLeft(pairId);
    setFlippedRight(null);
    setPromptMessage("Now choose a card from the right column");
  };

  const handleRightClick = (pairId: string) => {
    if (!flippedLeft || matchedPairs.has(pairId) || feedback) return;

    setFlippedRight(pairId);

    // Track attempt
    const currentAttempts = attempts.get(flippedLeft) || 0;
    const newAttempts = new Map(attempts);
    newAttempts.set(flippedLeft, currentAttempts + 1);
    setAttempts(newAttempts);

    if (flippedLeft === pairId) {
      // Correct match - sequence: reveal card → turn green → show message → disappear
      onPairMatched(pairId, currentAttempts + 1);
      
      // Step 1: Card is already revealed via setFlippedRight above
      // Step 2: After 800ms, mark as correct (turn green)
      setTimeout(() => {
        setCorrectPair({ left: flippedLeft, right: pairId });
        
        // Step 3: After 800ms, show the success feedback overlay
        setTimeout(() => {
          setFeedback("correct");
          
          // Step 4: After 1400ms, hide feedback and cards disappear together
          setTimeout(() => {
            setFeedback(null);
            const newMatched = new Set(matchedPairs);
            newMatched.add(pairId);
            setMatchedPairs(newMatched);
            setFlippedLeft(null);
            setFlippedRight(null);
            setCorrectPair(null);
            setPromptMessage("");

            // Check if part complete
            if (newMatched.size === pairs.length) {
              setTimeout(() => {
                onPartComplete(newAttempts, Date.now() - startTime);
              }, 500);
            }
          }, 1400);
        }, 800);
      }, 800);
    } else {
      // Incorrect match - sequence: reveal card → turn red → show message → flip back
      
      // Step 1: Card is already revealed via setFlippedRight above
      // Step 2: After a brief moment, mark as incorrect (turn red)
      setTimeout(() => {
        setIncorrectPair({ left: flippedLeft, right: pairId });
        
        // Step 3: Show the error feedback overlay
        setTimeout(() => {
          setFeedback("incorrect");
          
          // Step 4: Hide everything and flip cards back
          setTimeout(() => {
            setFeedback(null);
            setFlippedLeft(null);
            setFlippedRight(null);
            setIncorrectPair(null);
            setPromptMessage("");
          }, 1500);
        }, 600);
      }, 500);
    }
  };

  const unmatchedLeft = leftColumn.filter(p => !matchedPairs.has(p.id));
  const unmatchedRight = rightColumn.filter(p => !matchedPairs.has(p.id));

  return (
    <div className="relative">
      <AnimatePresence>
        {feedback && (
          <FeedbackOverlay 
            type={feedback} 
            message={feedback === "correct" ? "Well done!" : "Not quite, try again!"}
          />
        )}
      </AnimatePresence>

      {/* Prompt message */}
      <AnimatePresence>
        {promptMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-6"
          >
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              {promptMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Left Column - Words (Blue backs) */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Words
          </p>
          <AnimatePresence mode="popLayout">
            {unmatchedLeft.map((pair) => (
              <FlipCard
                key={pair.id}
                content={pair.word}
                isFlipped={flippedLeft === pair.id || incorrectPair?.left === pair.id || correctPair?.left === pair.id}
                isMatched={matchedPairs.has(pair.id)}
                isIncorrect={incorrectPair?.left === pair.id}
                isCorrect={correctPair?.left === pair.id}
                onClick={() => handleLeftClick(pair.id)}
                column="left"
                disabled={feedback !== null}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Right Column - Synonyms (Yellow backs) */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Synonyms
          </p>
          <AnimatePresence mode="popLayout">
            {unmatchedRight.map((pair) => (
              <FlipCard
                key={pair.id}
                content={pair.synonym}
                isFlipped={flippedRight === pair.id || incorrectPair?.right === pair.id || correctPair?.right === pair.id}
                isMatched={matchedPairs.has(pair.id)}
                isIncorrect={incorrectPair?.right === pair.id}
                isCorrect={correctPair?.right === pair.id}
                onClick={() => handleRightClick(pair.id)}
                column="right"
                disabled={!flippedLeft || feedback !== null}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-8 flex justify-center gap-2">
        {pairs.map((pair) => (
          <motion.div
            key={pair.id}
            className={`w-3 h-3 rounded-full ${
              matchedPairs.has(pair.id) ? "bg-success" : "bg-muted"
            }`}
            animate={{ scale: matchedPairs.has(pair.id) ? [1, 1.3, 1] : 1 }}
          />
        ))}
      </div>
    </div>
  );
};

export default CardFlipMemoryGame;
