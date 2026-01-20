import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackOverlayProps {
  type: "correct" | "incorrect" | "part-complete" | "game-complete" | "module-complete";
  message?: string;
  subMessage?: string;
  onContinue?: () => void;
  autoHide?: boolean;
}

const FeedbackOverlay = ({ 
  type, 
  message, 
  subMessage, 
  onContinue,
  autoHide = true 
}: FeedbackOverlayProps) => {
  const isFullScreen = ["part-complete", "game-complete", "module-complete"].includes(type);

  const getContent = () => {
    switch (type) {
      case "correct":
        return {
          icon: <CheckCircle2 className="w-16 h-16 text-success" />,
          title: message || "Well done!",
          bgClass: "bg-success/20",
          textClass: "text-success",
        };
      case "incorrect":
        return {
          icon: <XCircle className="w-16 h-16 text-destructive" />,
          title: message || "Not quite, try again!",
          bgClass: "bg-destructive/20",
          textClass: "text-destructive",
        };
      case "part-complete":
        return {
          icon: <Sparkles className="w-20 h-20 text-primary" />,
          title: message || "Part Complete!",
          subtitle: subMessage || "Great progress!",
          bgClass: "bg-gradient-to-br from-primary/10 via-background to-success/10",
          textClass: "text-foreground",
        };
      case "game-complete":
        return {
          icon: <Trophy className="w-24 h-24 text-warning" />,
          title: message || "That's brilliant, well done!",
          subtitle: subMessage || "Now it's time to make it a little harder.",
          bgClass: "bg-gradient-to-br from-warning/10 via-background to-primary/10",
          textClass: "text-foreground",
        };
      case "module-complete":
        return {
          icon: <Trophy className="w-28 h-28 text-success" />,
          title: message || "Well done. You did really well there.",
          subtitle: subMessage || "Let's put all that fantastic learning to the test in the next lesson!",
          bgClass: "bg-gradient-to-br from-success/10 via-background to-primary/10",
          textClass: "text-foreground",
        };
      default:
        return {
          icon: null,
          title: "",
          bgClass: "",
          textClass: "",
        };
    }
  };

  const content = getContent();

  if (isFullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${content.bgClass} backdrop-blur-sm`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-center space-y-6 p-8 max-w-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
            className="flex justify-center"
          >
            {content.icon}
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={`text-3xl font-bold ${content.textClass}`}
          >
            {content.title}
          </motion.h2>
          {content.subtitle && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg text-muted-foreground"
            >
              {content.subtitle}
            </motion.p>
          )}
          {onContinue && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button size="lg" onClick={onContinue} className="mt-4">
                Continue
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // Inline feedback for correct/incorrect
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className={`${content.bgClass} rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4`}
      >
        {content.icon}
        <span className={`text-2xl font-bold ${content.textClass}`}>
          {content.title}
        </span>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackOverlay;
