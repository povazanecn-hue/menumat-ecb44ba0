import { Bot } from "lucide-react";
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-primary mb-0.5">Olivia</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
