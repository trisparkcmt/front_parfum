"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Greeting + search header.
 *
 * MOBILE / TABLET ONLY (< lg). Once the viewport reaches `lg`, the real
 * site Navbar (rendered in LayoutWrapper) takes over navigation and
 * search duties, so this component returns nothing there — it must
 * NEVER render alongside Navbar, only ever instead of it.
 *
 * Auth wiring intentionally mirrors Navbar.tsx exactly:
 * - same selector-based store access (not whole-store destructuring),
 * - same `isAuthenticated` guard before trusting `user` (a stale user
 *   object in the store should never be treated as a logged-in session),
 * - same destination routes (/dashboard/profile when logged in,
 *   /login when not) — this header previously linked to a generic
 *   /account route Navbar never uses.
 *
 * There is exactly one search control here: the input and the filter
 * trigger share a single pill, not two separate controls.
 */
export default function HomeHeader() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const firstName = isAuthenticated && user ? user.firstName : "";

  return (
    <header className="lg:hidden w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/50 font-medium">
            {t("welcome_back", { defaultValue: "Welcome back" })}
          </p>
          <h1 className="font-display text-xl font-semibold text-foreground leading-tight">
            {firstName || t("welcome_guest", { defaultValue: "Bienvenue" })}
          </h1>
        </div>

        {isAuthenticated && user ? (
          <Link
            href="/dashboard/profile"
            aria-label={t("my_account", { defaultValue: "My account" })}
            className="size-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold flex-shrink-0 overflow-hidden"
          >
            <span className="font-display text-xs font-bold">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            aria-label={t("login", { defaultValue: "Login" })}
            className="size-10 rounded-full border border-gold/30 bg-gold/10 flex items-center justify-center text-gold flex-shrink-0"
          >
            <span className="font-display text-xs font-semibold">?</span>
          </Link>
        )}
      </div>

      {/* Single search surface: input + filter trigger live inside ONE pill. */}
      <form
        role="search"
        action="/shop/search"
        className="relative flex items-center w-full h-12 rounded-full bg-foreground/5 border border-foreground/10 focus-within:ring-1 focus-within:ring-gold/50 focus-within:border-gold/40 transition-colors"
      >
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none"
        />
        <input
          type="search"
          name="q"
          placeholder={t("search_placeholder", { defaultValue: "Rechercher un parfum, un accessoire…" })}
          className="flex-1 h-full pl-10 pr-2 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
        <button
          type="button"
          aria-label={t("filters", { defaultValue: "Filtres" })}
          className="h-8 w-8 mr-2 rounded-full flex items-center justify-center text-foreground/50 flex-shrink-0 hover:text-gold transition-colors"
        >
          <SlidersHorizontal size={16} />
        </button>
      </form>
    </header>
  );
}