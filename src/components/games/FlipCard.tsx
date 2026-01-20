import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipCardProps {
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  isIncorrect: boolean;
  isCorrect: boolean;
  onClick: () => void;
  column: "left" | "right";
  disabled?: boolean;
}

const FlipCard = ({
  content,
  isFlipped,
  isMatched,
  isIncorrect,
  isCorrect,
  onClick,
  column,
  disabled,
}: FlipCardProps) => {
  const backColor = column === "left" 
    ? "bg-blue-300 dark:bg-blue-800/50 border-blue-400 dark:border-blue-700" 
    : "bg-yellow-300 dark:bg-yellow-700/50 border-yellow-400 dark:border-yellow-600";

  return (
    <motion.div
      className="perspective-1000 w-full h-24 cursor-pointer"
      onClick={!disabled && !isMatched ? onClick : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isMatched ? 0 : 1,
        scale: isMatched ? 0.8 : 1,
        y: 0,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-500 preserve-3d"
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full rounded-xl border-2 flex items-center justify-center backface-hidden",
            backColor,
            !disabled && "hover:scale-[1.02] transition-transform"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/20" />
        </div>

        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full rounded-xl border-2 flex items-center justify-center p-4 backface-hidden",
            // Default front state
            !isIncorrect && !isMatched && !isCorrect && "bg-card border-border",
            // Correct state - green
            isCorrect && "bg-success/20 border-success",
            // Incorrect state - red
            isIncorrect && "bg-destructive/10 border-destructive",
            // Matched state
            isMatched && "bg-success/10 border-success",
          )}
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="text-center text-base font-medium">
            {content}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FlipCard;
