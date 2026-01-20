import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface MatchCardProps {
  content: string;
  isSelected: boolean;
  isMatched: boolean;
  isIncorrect: boolean;
  onClick: () => void;
  column: "left" | "right";
  disabled?: boolean;
}

const MatchCard = ({
  content,
  isSelected,
  isMatched,
  isIncorrect,
  onClick,
  column,
  disabled,
}: MatchCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isMatched}
      initial={{ opacity: 0, x: column === "left" ? -20 : 20 }}
      animate={{ 
        opacity: isMatched ? 0 : 1, 
        x: 0,
        scale: isMatched ? 0.8 : 1,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      whileHover={!disabled && !isMatched ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isMatched ? { scale: 0.98 } : {}}
      className={cn(
        "w-full py-8 px-6 rounded-xl border-2 text-center transition-colors duration-200",
        "font-medium text-base shadow-sm",
        // Default state
        !isSelected && !isMatched && !isIncorrect && "bg-card border-border hover:border-primary/50",
        // Selected state - green
        isSelected && !isIncorrect && "bg-success/10 border-success text-success-foreground",
        // Incorrect state - red
        isIncorrect && "bg-destructive/10 border-destructive text-destructive",
        // Matched state
        isMatched && "bg-success/20 border-success cursor-not-allowed",
        // Disabled
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-base font-medium">
          {content}
        </span>
        {isMatched && (
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
        )}
      </div>
    </motion.button>
  );
};

export default MatchCard;
