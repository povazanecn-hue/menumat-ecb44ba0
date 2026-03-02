import { useState, useEffect, useCallback } from "react";
import { Bot, X, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const SEEN_KEY = "olivia_context_tips_seen";

function getSeenTips(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markTipSeen(tipId: string) {
  const seen = getSeenTips();
  seen.add(tipId);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export interface ContextTipConfig {
  id: string;
  text: string;
  icon?: "lightbulb" | "bot";
  /** Show only when this condition is true */
  condition: boolean;
  /** Delay in ms before showing (default 600) */
  delay?: number;
  /** Auto-dismiss after ms (default 12000) */
  autoDismiss?: number;
}

/**
 * Contextual Olivia tip that shows once per trigger condition.
 * Usage:
 *   <OliviaContextTip
 *     id="first-dish"
 *     text="**Tip:** Pridajte alergény a gramáž — zobrazia sa v exportoch."
 *     condition={dishes.length === 0 && formOpen}
 *   />
 */
export function OliviaContextTip({
  id,
  text,
  icon = "lightbulb",
  condition,
  delay = 600,
  autoDismiss = 12000,
}: ContextTipConfig) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!condition) return;

    const seen = getSeenTips();
    if (seen.has(id)) return;

    const timer = setTimeout(() => {
      setVisible(true);
      markTipSeen(id);
    }, delay);

    return () => clearTimeout(timer);
  }, [id, condition, delay]);

  // Auto-dismiss
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), autoDismiss);
    return () => clearTimeout(timer);
  }, [visible, autoDismiss]);

  const handleDismiss = useCallback(() => setVisible(false), []);

  const IconComp = icon === "bot" ? Bot : Lightbulb;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="relative rounded-xl border border-primary/20 bg-card/95 backdrop-blur-md shadow-lg shadow-black/20 overflow-hidden"
        >
          <div className="p-3 flex items-start gap-2.5">
            {/* Icon */}
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
              <IconComp className="h-3.5 w-3.5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-semibold text-primary font-serif tracking-wide uppercase">
                  Olivia tip
                </span>
              </div>
              <div className="text-xs text-foreground/85 leading-relaxed prose prose-sm prose-invert max-w-none [&>p]:my-0 [&_strong]:text-primary">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              className="p-0.5 rounded hover:bg-secondary transition-colors shrink-0"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>

          {/* Bottom accent */}
          <div className="h-[2px] bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
