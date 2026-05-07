'use client';

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
} from "lucide-react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Temporarily shrink to get the right scrollHeight
      textarea.style.height = `${minHeight}px`;

      // Calculate new height
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export default function AiConsultantPage() {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        setValue("");
        adjustHeight(true);
      }
    }
  };

  const ideaPrompts = [
    "Un parfum pour une soirée élégante et mystérieuse.",
    "Je cherche une fragrance qui évoque la fraîcheur du matin.",
    "Créez un parfum qui me rappelle un souvenir d'enfance.",
    "J'ai besoin d'un parfum qui exprime la confiance et le pouvoir.",
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8 pt-24 lg:pt-32 min-h-screen">
      <h1 className="font-display text-4xl md:text-6xl font-bold text-white text-center">
        Votre Sommelier <span className="text-gradient-gold">IA</span>
      </h1>
      <p className="text-lg md:text-xl text-cream/70 max-w-2xl mx-auto mb-16 font-light leading-relaxed text-center">
        Décrivez votre personnalité, vos envies ou une occasion spéciale. Notre IA experte concevra la formule parfaite pour vous.
      </p>

      <div className="w-full">
        <div className="relative bg-deep-black/50 backdrop-blur-lg rounded-xl border border-white/10">
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Décrivez votre parfum idéal..."
              className={cn(
                "w-full px-4 py-3",
                "resize-none",
                "bg-transparent",
                "border-none",
                "text-cream text-sm",
                "focus:outline-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-cream/50 placeholder:text-sm",
                "min-h-[60px]"
              )}
              style={{
                overflow: "hidden",
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="group p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
              >
                <Paperclip className="w-4 h-4 text-cream/70" />
                <span className="text-xs text-cream/50 hidden group-hover:inline transition-opacity">
                  Attacher
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-2 py-1 rounded-lg text-sm text-cream/50 transition-colors border border-white/10 hover:border-gold/50 hover:bg-gold/10 flex items-center justify-between gap-1"
              >
                <PlusIcon className="w-4 h-4 text-cream/70" />
                Projet
              </button>
              <button
                type="button"
                className={cn(
                  "px-1.5 py-1.5 rounded-lg text-sm transition-colors border border-gold/50",
                  value.trim()
                    ? "bg-gold text-deep-black"
                    : "text-cream/50 bg-white/5 hover:bg-white/10"
                )}
              >
                <ArrowUpIcon
                  className={cn(
                    "w-4 h-4",
                    value.trim()
                      ? "text-deep-black"
                      : "text-cream/50"
                  )}
                />
                <span className="sr-only">Envoyer</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {ideaPrompts.map((prompt, index) => (
            <button
              key={index}
              type="button" 
              onClick={() => {
                setValue(prompt);
                adjustHeight(true); // Reset height after setting new value
              }}
              className="px-3 py-1.5 w-auto  bg-white/5 backdrop-blur-sm hover:bg-gold/10 rounded-full border border-white/10 text-cream/70 hover:text-gold transition-colors text-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}