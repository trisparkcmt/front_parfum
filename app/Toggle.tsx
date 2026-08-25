"use client"

import { useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  checked?: boolean
  onChange?: () => void
}

export function ThemeToggle({ className, checked, onChange }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true)
  const dark = checked ?? isDark

  const handleToggle = () => {
    if (checked === undefined) setIsDark(!isDark)
    onChange?.()
  }

  // next-themes
  // const { resolvedTheme, setTheme } = useTheme()
  // const isDark = resolvedTheme === "dark"
  // onClick={() => setTheme(isDark ? "light" : "dark")}

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300",
        dark
          ? "bg-zinc-950 border border-zinc-800" 
          : "bg-white border border-zinc-200",
        className
      )}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            dark
              ? "transform translate-x-0 bg-zinc-800" 
              : "transform translate-x-8 bg-gray-200"
          )}
        >
          {dark ? (
            <Moon 
              className="w-4 h-4 text-white" 
              strokeWidth={1.5}
            />
          ) : (
            <Sun 
              className="w-4 h-4 text-gray-700" 
              strokeWidth={1.5}
            />
          )}
        </div>
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            dark
              ? "bg-transparent" 
              : "transform -translate-x-8"
          )}
        >
          {dark ? (
            <Sun 
              className="w-4 h-4 text-gray-500" 
              strokeWidth={1.5}
            />
          ) : (
            <Moon 
              className="w-4 h-4 text-black" 
              strokeWidth={1.5}
            />
          )}
        </div>
      </div>
    </div>
  )
}