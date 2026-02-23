import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/olivia-chat`;

const PAGE_GREETINGS: Record<string, { greeting: string; suggestions: string[] }> = {
  "/dashboard": {
    greeting: "Vitajte na **Dashboarde**! 📊 Tu máte prehľad o vašej reštaurácii — menu, štatistiky a rýchle akcie.",
    suggestions: ["Čo vidím na dashboarde?", "Ako vytvorím dnešné menu?"],
  },
  "/daily-menu": {
    greeting: "Ste v sekcii **Denné menu** 📅 Tu tvoríte a spravujete menu na každý deň v týždni (Po-Pia).",
    suggestions: ["Generuj menu pomocou AI", "Ako importujem z Excel?"],
  },
  "/dishes": {
    greeting: "Vitajte v **databáze jedál** 🍽️ Tu spravujete všetky jedlá s alergénmi, cenami a kategóriami.",
    suggestions: ["Ako pridám nové jedlo?", "Vysvetli cenotvorbu"],
  },
  "/ingredients": {
    greeting: "Ste v sekcii **Ingrediencie** 🥕 Tu spravujete suroviny a porovnávate ceny dodávateľov.",
    suggestions: ["Ako porovnám ceny?", "Čo znamená 'Use this price'?"],
  },
  "/recipes": {
    greeting: "Vitajte v **Receptoch** 📖 Tu vytvárate a spravujete recepty priradené k jedlám.",
    suggestions: ["Ako vytvorím recept?", "Čo je zamknutý recept?"],
  },
  "/permanent-menu": {
    greeting: "Ste na stránke **Jedálny lístok** 📋 Tu organizujete stálu ponuku v kategóriách.",
    suggestions: ["Ako pridám kategóriu?", "Ako priradím jedlá?"],
  },
  "/shopping-list": {
    greeting: "Vitajte v **Nákupnom zozname** 🛒 Automaticky generované suroviny z vášho menu.",
    suggestions: ["Generuj zoznam z menu", "Export do Excel"],
  },
  "/exports": {
    greeting: "Ste v **Export centre** 📤 Tu exportujete menu na TV, PDF, Excel alebo web.",
    suggestions: ["Ako exportujem pre TV?", "Čo je web embed?"],
  },
  "/templates": {
    greeting: "Vitajte v **Šablónach** 🎨 Tu nastavujete vizuálny štýl vašich exportov.",
    suggestions: ["Aké šablóny sú dostupné?", "Ako zmením štýl?"],
  },
  "/settings": {
    greeting: "Ste v **Nastaveniach** ⚙️ Tu upravujete profil reštaurácie, maržu, DPH a tím.",
    suggestions: ["Ako nastavím maržu?", "Ako pridám člena tímu?"],
  },
  "/nastenka": {
    greeting: "Vitajte na **Nástenke** 📌 Tu vidíte a spravujete návrhy jedál od vášho tímu.",
    suggestions: ["Ako pridám návrh?", "Ako schválim návrh?"],
  },
};

const SEEN_KEY = "olivia_seen_pages";

function getSeenPages(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markPageSeen(page: string) {
  const seen = getSeenPages();
  seen.add(page);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

interface OliviaAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OliviaAssistant({ open, onOpenChange }: OliviaAssistantProps) {
  const location = useLocation();
  const currentPage = location.pathname;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasAutoGreeted, setHasAutoGreeted] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-greeting on first visit to each page (only when drawer is opened)
  useEffect(() => {
    if (!open) return;
    const seen = getSeenPages();
    const pageConfig = PAGE_GREETINGS[currentPage];

    if (pageConfig && !seen.has(currentPage) && !hasAutoGreeted.has(currentPage)) {
      markPageSeen(currentPage);
      setHasAutoGreeted((prev) => new Set([...prev, currentPage]));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: pageConfig.greeting },
      ]);
    }
  }, [open, currentPage, hasAutoGreeted]);

  // Initial welcome on first ever open
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Ahoj! Som **Olivia**, vaša AI asistentka v MENUMAT. 👋\n\nMôžem vám pomôcť s čímkoľvek v aplikácii — navigáciou, tvorbou menu, vysvetlením funkcií. Stačí sa opýtať!",
        },
      ]);
    }
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      const userMsg: ChatMessage = { role: "user", content: msg };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      let assistantSoFar = "";

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            currentPage,
          }),
        });

        if (!resp.ok || !resp.body) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || "Chyba pripojenia");
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantSoFar += content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
                    return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                  }
                  return [...prev, { role: "assistant", content: assistantSoFar }];
                });
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${e.message || "Nepodarilo sa spojiť s Oliviou."}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, currentPage]
  );

  const currentSuggestions = PAGE_GREETINGS[currentPage]?.suggestions || [
    "Čo všetko vieš?",
    "Pomôž mi začať",
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col gap-0 border-l border-border bg-background">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <SheetTitle className="text-sm font-semibold font-serif">Olivia</SheetTitle>
                <span className="text-[10px] text-muted-foreground">AI Asistentka • MENUMAT</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              {currentPage.replace("/", "") || "home"}
            </Badge>
          </div>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
          <div className="space-y-3 pb-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm rounded-lg px-3 py-2.5 max-w-[90%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&_strong]:text-foreground [&_a]:text-primary">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Olivia píše...
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested actions */}
        {!loading && messages.length <= 3 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {currentSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-2.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 px-3 py-2.5 border-t border-border flex-shrink-0"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Napíšte správu Olivii..."
            className="text-sm h-9"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
