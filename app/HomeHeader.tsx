"use client";

import { Search, SlidersHorizontal, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Shop header — mobile/tablet only (<lg).
 * Shows shop name, functional search bar, and login/avatar button.
 */
export default function HomeHeader() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/shop/accessories?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className="lg:hidden w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/50 font-medium">
            {t("shop_subtitle", { defaultValue: "Boutique en ligne" })}
          </p>
          <h1 className="font-display text-xl font-semibold text-foreground leading-tight">
            Accessoires Exclusifs
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
            aria-label={t("login", { defaultValue: "Se connecter" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gold/40 bg-gold/10 text-gold text-[10px] uppercase tracking-wider font-semibold flex-shrink-0 hover:bg-gold/20 transition-colors"
          >
            <LogIn size={13} />
            {t("login_btn", { defaultValue: "Connexion" })}
          </Link>
        )}
      </div>

      {/* Functional search — sends to /shop/accessories?search= */}
      <form
        role="search"
        onSubmit={handleSearch}
        className="relative flex items-center w-full h-12 rounded-full bg-foreground/5 border border-foreground/10 focus-within:ring-1 focus-within:ring-gold/50 focus-within:border-gold/40 transition-colors"
      >
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none"
        />
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search_placeholder", { defaultValue: "Rechercher un parfum, un accessoire…" })}
          className="flex-1 h-full pl-10 pr-2 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
        <button
          type="submit"
          aria-label={t("search", { defaultValue: "Rechercher" })}
          className="h-8 w-8 mr-2 rounded-full flex items-center justify-center text-foreground/50 flex-shrink-0 hover:text-gold transition-colors"
        >
          <SlidersHorizontal size={16} />
        </button>
      </form>
    </header>
  );
}