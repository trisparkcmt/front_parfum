'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { buildAbsoluteUrl, buildWhatsAppUrl, getCompanyWhatsAppNumber, resolveImageUrl } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductInquiryWhatsAppButtonProps {
  product: Product;
  isEn: boolean;
  productType?: 'perfume' | 'accessory' | 'diffuseur';
}

export function ProductInquiryWhatsAppButton({ product, isEn, productType = 'perfume' }: ProductInquiryWhatsAppButtonProps) {
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    let isMounted = true;

    shopService.getCompanyInfos()
      .then((companyInfos) => {
        if (isMounted) {
          setWhatsappNumber(getCompanyWhatsAppNumber(Array.isArray(companyInfos) ? companyInfos[0] : null));
        }
      })
      .catch(() => {
        if (isMounted) setWhatsappNumber('');
      });

    return () => { isMounted = false; };
  }, []);

  if (!whatsappNumber) return null;

  const productId = encodeURIComponent(String(product.slug || product.id));
  const productPath = product.category === 'huile'
    ? `/shop/huile/${productId}`
    : `/shop/product/${productId}?type=${encodeURIComponent(productType)}`;
  const productUrl = buildAbsoluteUrl(productPath);
  const imageUrl = resolveImageUrl(product.image_principale || product.images?.[0] || product.image_supp_1);
  const message = [
    isEn ? 'Can I get more information about this product?' : 'Puis-je avoir plus d’informations sur ce produit ?',
    `${isEn ? 'Product' : 'Produit'}: ${product.name}`,
    imageUrl ? `${isEn ? 'Image' : 'Image'}: ${imageUrl}` : '',
    `${isEn ? 'Link' : 'Lien'}: ${productUrl}`,
  ].filter(Boolean).join('\n');

  return (
    <a
      href={buildWhatsAppUrl(whatsappNumber, message)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/15"
    >
      <MessageCircle size={17} />
      {isEn ? 'Ask about this product on WhatsApp' : 'Demander des informations sur WhatsApp'}
    </a>
  );
}