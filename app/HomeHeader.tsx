"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchDropdown } from "@/components/shared/SearchDropdown";

/**
 * Mobile-only search bar below the global Navbar.
 * Shown only on <lg viewports on the home page.
 */
export function HomeHeader() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Navigate on form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setIsNavigating(true);
    setShowDropdown(false);
    router.push(`/shop/perfumes?search=${encodeURIComponent(q)}`);
  };

  // Reset navigating state on route change
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Debounce query by 350ms before querying the backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Show dropdown when there's text
  useEffect(() => {
    setShowDropdown(debouncedQuery.trim().length > 0);
  }, [debouncedQuery]);

  return (
    <header className="relative lg:hidden w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-3">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gold transition-opacity duration-200 ${isNavigating ? 'opacity-100' : 'opacity-0'}`} />

      {/* Search bar with autocomplete dropdown */}
      <div className="relative">
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
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (debouncedQuery.trim()) setShowDropdown(true); }}
            placeholder={t("search_placeholder", { defaultValue: "Rechercher un parfum, un accessoire…" })}
            className="flex-1 h-full pl-10 pr-2 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            aria-label={t("search", { defaultValue: "Rechercher" })}
            className="h-8 w-8 mr-2 rounded-full flex items-center justify-center text-foreground/50 flex-shrink-0 hover:text-gold transition-colors"
          >
            <SlidersHorizontal size={16} />
          </button>
        </form>

        {/* Search results dropdown */}
        {showDropdown && (
          <SearchDropdown
            query={debouncedQuery}
            onClose={() => setShowDropdown(false)}
          />
        )}
      </div>
    </header>
  );
}

export default HomeHeader;