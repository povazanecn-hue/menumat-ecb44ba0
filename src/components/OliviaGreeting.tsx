import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Volume2, VolumeX, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/olivia-tts`;

const PAGE_GREETINGS: Record<string, { text: string; voice: string }> = {
  "/dashboard": {
    text: "Vitajte na **Dashboarde**! Tu máte kompletný prehľad — menu, upozornenia a rýchle akcie.",
    voice: "Vitajte na Dashboarde! Tu máte kompletný prehľad — menu, upozornenia a rýchle akcie.",
  },
  "/daily-menu": {
    text: "Ste v sekcii **Denné menu**. Tu tvoríte a spravujete menu na každý deň v týždni.",
    voice: "Ste v sekcii Denné menu. Tu tvoríte a spravujete menu na každý deň v týždni.",
  },
  "/dishes": {
    text: "Vitajte v **databáze jedál**! Spravujte jedlá s alergénmi, cenami a kategóriami.",
    voice: "Vitajte v databáze jedál! Spravujte jedlá s alergénmi, cenami a kategóriami.",
  },
  "/ingredients": {
    text: "Ste v sekcii **Ingrediencie**. Spravujte suroviny a porovnávajte ceny dodávateľov.",
    voice: "Ste v sekcii Ingrediencie. Spravujte suroviny a porovnávajte ceny dodávateľov.",
  },
  "/recipes": {
    text: "Vitajte v **Receptoch**! Vytvárajte a spravujte recepty priradené k jedlám.",
    voice: "Vitajte v Receptoch! Vytvárajte a spravujte recepty priradené k jedlám.",
  },
  "/permanent-menu": {
    text: "Ste na stránke **Jedálny lístok**. Organizujte stálu ponuku v kategóriách.",
    voice: "Ste na stránke Jedálny lístok. Organizujte stálu ponuku v kategóriách.",
  },
  "/shopping-list": {
    text: "Vitajte v **Nákupnom zozname**! Automaticky generované suroviny z vášho menu.",
    voice: "Vitajte v Nákupnom zozname! Automaticky generované suroviny z vášho menu.",
  },
  "/exports": {
    text: "Ste v **Export centre**. Exportujte menu na TV, PDF, Excel alebo web.",
    voice: "Ste v Export centre. Exportujte menu na TV, PDF, Excel alebo web.",
  },
  "/templates": {
    text: "Vitajte v **Šablónach**! Nastavte vizuálny štýl vašich exportov.",
    voice: "Vitajte v Šablónach! Nastavte vizuálny štýl vašich exportov.",
  },
  "/settings": {
    text: "Ste v **Nastaveniach**. Upravujte profil reštaurácie, maržu, DPH a tím.",
    voice: "Ste v Nastaveniach. Upravujte profil reštaurácie, maržu, DPH a tím.",
  },
  "/nastenka": {
    text: "Vitajte na **Nástenke**! Spravujte návrhy jedál od vášho tímu.",
    voice: "Vitajte na Nástenke! Spravujte návrhy jedál od vášho tímu.",
  },
};

const SEEN_KEY = "olivia_greeted_pages";
const MUTED_KEY = "olivia_muted";

function getGreetedPages(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markGreeted(page: string) {
  const seen = getGreetedPages();
  seen.add(page);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export function OliviaGreeting() {
  const location = useLocation();
  const currentPage = location.pathname;
  const [visible, setVisible] = useState(false);
  const [greeting, setGreeting] = useState<{ text: string; voice: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem(MUTED_KEY) === "true"; } catch { return false; }
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Check if page needs greeting
  useEffect(() => {
    const pageConfig = PAGE_GREETINGS[currentPage];
    if (!pageConfig) {
      setVisible(false);
      return;
    }

    const seen = getGreetedPages();
    if (seen.has(currentPage)) {
      setVisible(false);
      return;
    }

    // Delay to let page render first
    const timer = setTimeout(() => {
      setGreeting(pageConfig);
      setVisible(true);
      markGreeted(currentPage);
    }, 800);

    return () => clearTimeout(timer);
  }, [currentPage]);

  // Play voice when greeting appears
  useEffect(() => {
    if (!visible || !greeting || isMuted) return;

    const playVoice = async () => {
      try {
        const response = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: greeting.voice }),
        });

        if (!response.ok) throw new Error("TTS failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          // Auto-dismiss after voice ends
          timeoutRef.current = setTimeout(() => setVisible(false), 2000);
        };
        audio.onerror = () => setIsSpeaking(false);

        await audio.play().catch(() => {
          // Browser blocked auto-play — that's fine, text is shown
          setIsSpeaking(false);
        });
      } catch {
        // TTS failed silently — text greeting still shows
      }
    };

    playVoice();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible, greeting, isMuted]);

  // Auto-dismiss after 8s if no voice
  useEffect(() => {
    if (!visible) return;
    if (isMuted) {
      timeoutRef.current = setTimeout(() => setVisible(false), 6000);
      return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }
  }, [visible, isMuted]);

  const handleDismiss = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setVisible(false);
  }, []);

  const toggleMute = useCallback(() => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    localStorage.setItem(MUTED_KEY, String(newVal));
    if (newVal && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, [isMuted]);

  return (
    <AnimatePresence>
      {visible && greeting && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-xs"
        >
          <div className="relative rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-lg shadow-2xl shadow-black/30 overflow-hidden">
            {/* Animated speaking indicator */}
            {isSpeaking && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-primary/40"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            <div className="p-4">
              {/* Header row */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    isSpeaking ? "bg-primary/30" : "bg-primary/15"
                  )}>
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary font-serif">Olivia</p>
                    {isSpeaking && (
                      <motion.div className="flex gap-0.5 mt-0.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 h-1 rounded-full bg-primary"
                            animate={{ scaleY: [1, 2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleMute}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                    title={isMuted ? "Zapnúť hlas" : "Stlmiť hlas"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Message */}
              <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm prose-invert max-w-none [&>p]:my-0 [&_strong]:text-primary">
                <ReactMarkdown>{greeting.text}</ReactMarkdown>
              </div>
            </div>

            {/* Bottom gradient accent */}
            <div className="h-0.5 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
