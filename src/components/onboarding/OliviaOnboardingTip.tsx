import { Bot, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  tip: string;
  step: number;
}

export function OliviaOnboardingTip({ tip, step }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 30, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -30, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-md shadow-lg overflow-hidden"
      >
        <div className="p-3.5 flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs font-semibold text-primary font-serif">Olivia</p>
              <Volume2 className="h-3 w-3 text-primary/50" />
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{tip}</p>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />
      </motion.div>
    </AnimatePresence>
  );
}
