import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MatchCard from "./MatchCard";
import FeedbackOverlay from "./FeedbackOverlay";

export interface SynonymPair {
  id: string;
  word: string;
  synonym: string;
}

interface OpenMatchingGameProps {
  pairs: SynonymPair[];
  partNumber: number;
  onPartComplete: (attempts: Map<string, number>, timeTaken: number) => void;
  onPairMatched: (pairId: string, attempts: number) => void;
}

const OpenMatchingGame = ({ 
  pairs, 
  partNumber, 
  onPartComplete,
  onPairMatched,
}: OpenMatchingGameProps) => {
  const [leftColumn, setLeftColumn] = useState<SynonymPair[]>([]);
  const [rightColumn, setRightColumn] = useState<SynonymPair[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [incorrectRight, setIncorrectRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [pendingMatch, setPendingMatch] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Map<string, number>>(new Map());
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    console.log('OpenMatchingGame received pairs:', pairs);
    // Shuffle columns independently
    setLeftColumn(shuffleArray([...pairs]));
    setRightColumn(shuffleArray([...pairs]));
    setMatchedPairs(new Set());
    setPendingMatch(null);
    setAttempts(new Map());
    setSelectedLeft(null);
    setIncorrectRight(null);
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
    if (matchedPairs.has(pairId)) return;
    setSelectedLeft(pairId);
    setIncorrectRight(null);
  };

  const handleRightClick = (pairId: string) => {
    if (!selectedLeft || matchedPairs.has(pairId)) return;

    // Track attempt
    const currentAttempts = attempts.get(selectedLeft) || 0;
    const newAttempts = new Map(attempts);
    newAttempts.set(selectedLeft, currentAttempts + 1);
    setAttempts(newAttempts);

    if (selectedLeft === pairId) {
      // Correct match - hide the pair immediately
      setPendingMatch(pairId);
      setFeedback("correct");
      onPairMatched(pairId, currentAttempts + 1);
      
      setTimeout(() => {
        setFeedback(null);
        const newMatched = new Set(matchedPairs);
        newMatched.add(pairId);
        setMatchedPairs(newMatched);
        setPendingMatch(null);
        setSelectedLeft(null);

        // Check if part complete
        if (newMatched.size === pairs.length) {
          setTimeout(() => {
            onPartComplete(newAttempts, Date.now() - startTime);
          }, 500);
        }
      }, 2500);
    } else {
      // Incorrect match
      setFeedback("incorrect");
      setIncorrectRight(pairId);

      setTimeout(() => {
        setFeedback(null);
        setIncorrectRight(null);
      }, 2500);
    }
  };

  // Filter out matched and pending pairs
  const unmatchedLeft = leftColumn.filter(p => !matchedPairs.has(p.id) && p.id !== pendingMatch);
  const unmatchedRight = rightColumn.filter(p => !matchedPairs.has(p.id) && p.id !== pendingMatch);

  console.log('Rendering - unmatchedLeft:', unmatchedLeft.length, 'unmatchedRight:', unmatchedRight.length);

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

      <div className="grid grid-cols-2 gap-8 max-w-xl mx-auto">
        {/* Left Column - Words */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Select a word
          </p>
          <AnimatePresence mode="popLayout">
            {unmatchedLeft.map((pair) => (
              <MatchCard
                key={pair.id}
                content={pair.word}
                isSelected={selectedLeft === pair.id}
                isMatched={matchedPairs.has(pair.id)}
                isIncorrect={false}
                onClick={() => handleLeftClick(pair.id)}
                column="left"
                disabled={feedback !== null}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Right Column - Synonyms */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Match its synonym
          </p>
          <AnimatePresence mode="popLayout">
            {unmatchedRight.map((pair) => (
              <MatchCard
                key={pair.id}
                content={pair.synonym}
                isSelected={false}
                isMatched={matchedPairs.has(pair.id)}
                isIncorrect={incorrectRight === pair.id}
                onClick={() => handleRightClick(pair.id)}
                column="right"
                disabled={!selectedLeft || feedback !== null}
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

export default OpenMatchingGame;