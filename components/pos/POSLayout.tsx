'use client';

import { ReactNode } from 'react';

interface POSLayoutProps {
  searchBar: ReactNode;
  productList: ReactNode;
  productPreview: ReactNode;
  cartSummary: ReactNode;
}

export function POSLayout({ searchBar, productList, productPreview, cartSummary }: POSLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 p-4 bg-gradient-to-b from-white/5 to-transparent">
        <h1 className="text-2xl font-bold text-foreground">Point de Vente - Boutique</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Interface de caisse</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
        {/* Left: Search and Product List */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
          <div className="flex-shrink-0">{searchBar}</div>
          <div className="flex-1 border border-white/10 rounded-lg bg-white/5 overflow-hidden">
            {productList}
          </div>
        </div>

        {/* Right: Product Preview */}
        <div className="lg:col-span-2 border border-white/10 rounded-lg overflow-hidden hidden lg:block">
          {productPreview}
        </div>
      </div>

      {/* Bottom: Cart Summary */}
      <div className="border-t border-white/10 bg-white/5">
        {cartSummary}
      </div>

      {/* Mobile Product Preview */}
      <div className="lg:hidden border-t border-white/10 max-h-96 overflow-y-auto bg-white/5">
        {productPreview}
      </div>
    </div>
  );
}
