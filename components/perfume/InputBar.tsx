"use client";

import {
  memo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChevronDown, Coins } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ChatStatus = "ready" | "streaming" | "submitted" | "idle";

export type AttachedImage = {
  id: string;
  filename: string;
  url: string;
  size?: number;
};

export type AttachedFile = {
  id: string;
  filename: string;
  size?: number;
};

export type InputBarProps = {
  onSend?: (message: { 
    role: "user"; 
    content: string; 
    bottleSize: string; 
    budget: string 
  }) => void;
  onStop?: () => void;
  status?: ChatStatus;
  placeholder?: string;
  className?: string;
  onAttach?: () => void;
  attachedImages?: AttachedImage[];
  attachedFiles?: AttachedFile[];
  onRemoveImage?: (id: string) => void;
  onRemoveFile?: (id: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
};

const PaperclipIcon = ({ className = "w-[18px] h-[18px]" }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);

const SendIcon = ({ className = "w-[14px] h-[14px]" }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const StopIcon = ({ className = "w-[12px] h-[12px]" }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

const XIcon = ({ className = "w-3 h-3" }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FileIcon = ({ className = "w-4 h-4" }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

function AttachmentButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
    >
      <PaperclipIcon />
    </button>
  );
}

function SendButton({ state, onClick }: { state: "idle" | "typing" | "streaming"; onClick: () => void }) {
  const isStreaming = state === "streaming";
  const isActive = state === "typing" || isStreaming;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150",
        isActive
          ? "bg-neutral-900 text-white dark:bg-gold dark:text-deep-black shadow-lg shadow-gold/20"
          : "bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600",
      )}
    >
      {isStreaming ? <StopIcon /> : <SendIcon />}
    </button>
  );
}

export const InputBar = memo(function InputBar({
  onSend,
  onStop,
  status = "ready",
  placeholder = "Décrivez vos envies olfactives...",
  className,
  onAttach,
  attachedImages = [],
  attachedFiles = [],
  onRemoveImage,
  onRemoveFile,
  value: controlledValue,
  onChange: controlledOnChange,
  disabled,
  autoFocus,
  leftActions,
  rightActions,
}: InputBarProps) {
  const [internalInput, setInternalInput] = useState("");
  const [bottleSize, setBottleSize] = useState("50");
  const [budget, setBudget] = useState("");
  
  const isControlled = controlledValue !== undefined;
  const input = isControlled ? controlledValue : internalInput;
  
  const setInput = useCallback((v: string) => {
    if (isControlled) controlledOnChange?.(v);
    else setInternalInput(v);
  }, [isControlled, controlledOnChange]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";
  const hasInput = input.trim().length > 0;
  const hasContextItems = attachedImages.length > 0 || attachedFiles.length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0";
    const next = Math.min(el.scrollHeight, 120);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > 120 ? "auto" : "hidden";
  }, [input]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend?.({ 
      role: "user", 
      content: trimmed,
      bottleSize: `${bottleSize}ml`,
      budget: budget ? `${budget}FCFA` : "Non spécifié"
    });
    setInput("");
  }, [input, isStreaming, disabled, onSend, setInput, bottleSize, budget]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const sendState: "idle" | "typing" | "streaming" = isStreaming
    ? "streaming"
    : hasInput && !disabled
      ? "typing"
      : "idle";

  return (
    <div className={cn("shrink-0 px-3 pb-3 w-full", className)}>
      <div className="mx-auto max-w-3xl">
        <div className="relative cursor-text rounded-[24px] bg-white dark:bg-neutral-900 shadow-xl ring-1 ring-neutral-200 dark:ring-neutral-800 focus-within:ring-gold/40 transition-shadow">
          {/* Attachments Area */}
          <div className={cn("grid transition-[grid-template-rows] duration-200 ease-out", hasContextItems ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              {hasContextItems && (
                <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3 pb-1">
                  {/* Logic for Image/File chips here */}
                </div>
              )}
            </div>
          </div>

          {/* Main Input */}
          <div className="pt-4 pb-0 pr-4 pl-4 min-h-[48px]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full resize-none bg-transparent border-0 outline-none text-[15px] leading-[1.6] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 overflow-hidden disabled:opacity-50"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              {onAttach && <AttachmentButton onClick={onAttach} disabled={disabled} />}
              
              {/* Numba Specific Actions: Bottle Size & Budget */}
              <div className="h-15 w-auto  flex flex-row items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800/50 p-1 rounded-full border border-neutral-100 dark:border-neutral-800">
                <div className="relative flex items-center">
                  <select
                    value={bottleSize}
                    onChange={(e) => setBottleSize(e.target.value)}
                    disabled={disabled}
                    className="appearance-none bg-transparent pl-2.5 pr-6 py-1 text-[14px] font-bold text-neutral-600 dark:text-neutral-300 outline-none cursor-pointer hover:text-gold transition-colors"
                  >
                    <option value="30">30ml</option>
                    <option value="50">50ml</option>
                    <option value="100">100ml</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-2 pointer-events-none text-neutral-400" />
                </div>
                
                <div className="w-[1px] h-3 bg-neutral-200 dark:border-neutral-700" /> 

                <div className="relative flex w-auto items-center">
                  <Coins size={15} className="ml-2 text-neutral-400" />
                  <input
                    type="number"
                    placeholder="Budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    disabled={disabled}
                    className="w-16 bg-transparent px-1.5 py-1 text-[14px] font-bold text-neutral-600 dark:text-neutral-300 outline-none placeholder:text-neutral-500 placeholder:font-normal"
                  />
                  <span className="pr-2 text-[10px] font-bold text-neutral-400">FCFA</span>
                </div>
              </div>

              {leftActions}
            </div>

            <div className="flex items-center gap-2">
              {rightActions}
              <SendButton
                state={sendState}
                onClick={() => {
                  if (isStreaming) onStop?.();
                  else if (hasInput) handleSubmit();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default InputBar;