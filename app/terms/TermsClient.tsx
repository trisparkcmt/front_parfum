'use client';

/**
 * @file app/terms/page.tsx
 * @description Terms & Conditions Page for Accessoires Exclusifs.
 */
import { BackButton } from '@/components/ui/BackButton';
import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 md:pt-8 pb-8 space-y-6">
      <BackButton label={t('back', { defaultValue: isEn ? "Back" : "Retour" })} />
      
      <div className="border-b border-white/10 pb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
          {t('documentation', { defaultValue: "Documentation" })}
        </span>
        <h1 className="text-4xl font-serif font-bold text-foreground mt-2">
          {t('terms_title', { defaultValue: isEn ? "Terms & Conditions" : "Conditions Générales d'Utilisation et de Vente" })}
        </h1>
        <p className="text-xs text-foreground/40 mt-1 uppercase tracking-widest">
          {t('terms_last_updated', { defaultValue: isEn ? "Last updated: September 2, 2026" : "Dernière mise à jour : 2 septembre 2026" })}
        </p>
      </div>

      <div className="space-y-6 text-sm text-foreground/80 leading-relaxed font-sans">
        
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">1. {isEn ? "Acceptance of Terms" : "Acceptation des conditions"}</h2>
          <p>
            {isEn 
              ? "By accessing and placing an order on Accessoires Exclusifs, you confirm that you are in agreement with and bound by the terms outlined below. These terms apply to the entire website and any communication between you and our company."
              : "En accédant et en passant une commande sur Accessoires Exclusifs, vous confirmez votre accord avec les présentes Conditions Générales de Vente et d'Utilisation. Celles-ci s'appliquent à l'ensemble du site web et à toute communication entre vous et notre entreprise."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">2. {isEn ? "Order Process & Products" : "Commandes et Produits"}</h2>
          <p>
            {isEn
              ? "Orders are placed exclusively through our platform. All products, including luxury accessories and perfumes, are subject to availability. We reserve the right to refuse or cancel any order for any reason, including suspected fraud or product unavailability."
              : "Les commandes sont passées exclusivement via notre plateforme. Tous les produits, y compris les accessoires de luxe et les parfums, sont sous réserve de disponibilité. Nous nous réservons le droit de refuser ou d'annuler toute commande, notamment en cas de suspicion de fraude ou d'indisponibilité."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">3. {isEn ? "Custom Perfumes (Atelier Numba)" : "Parfums sur Mesure (Atelier Numba)"}</h2>
          <p>
            {isEn
              ? "Formulations created by users in the Atelier Olfactif are custom-made items. Because these products are personalized and made strictly to your specifications, they cannot be cancelled, returned, or refunded once the order is validated and processing has begun."
              : "Les formulations créées par les utilisateurs dans l'Atelier Olfactif sont des articles sur mesure. Parce que ces produits sont hautement personnalisés selon vos spécifications, ils ne peuvent être ni annulés, ni retournés, ni remboursés une fois la commande validée et la préparation commencée."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">4. {isEn ? "Pricing & Payments" : "Prix et Paiements"}</h2>
          <p>
            {isEn
              ? "All prices are indicated in CFA Francs (FCFA). We accept Mobile Money (MTN, Orange) and cash on delivery. Payment is required in full before the transfer of ownership of any physical goods."
              : "Tous les prix sont indiqués en Francs CFA (FCFA). Nous acceptons les paiements par Mobile Money (MTN, Orange) ainsi que le paiement en espèces à la livraison. Le paiement intégral est requis pour le transfert de propriété des articles."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">5. {isEn ? "Delivery" : "Livraison"}</h2>
          <p>
            {isEn
              ? "Local deliveries in Yaoundé, Douala, and surrounding regions are handled by our assigned delivery agents. Standard processing takes 24-48 hours. Accessoires Exclusifs is not liable for delays caused by external circumstances beyond our control."
              : "Les livraisons locales (Yaoundé, Douala et environs) sont assurées par nos livreurs partenaires. Le délai de traitement standard est de 24 à 48 heures. Accessoires Exclusifs ne saurait être tenu responsable des retards dus à des circonstances indépendantes de notre volonté."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">6. {isEn ? "Returns & Refunds (Standard Items)" : "Retours et Remboursements (Articles Standards)"}</h2>
          <p>
            {isEn
              ? "For standard (non-customized) items, if you are not entirely satisfied with your purchase, you must notify us within 24 hours of delivery. Items must be returned in their original packaging, unused. Refunds will be processed to the original payment method after inspection."
              : "Pour les articles standards (non personnalisés), si vous n'êtes pas entièrement satisfait, vous devez nous en informer dans les 24 heures suivant la livraison. Les articles doivent être retournés dans leur emballage d'origine, non utilisés. Le remboursement interviendra après inspection du produit."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">7. {isEn ? "Liability" : "Limitation de responsabilité"}</h2>
          <p>
            {isEn
              ? "Accessoires Exclusifs shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our products or platform."
              : "Accessoires Exclusifs ne pourra être tenu responsable de tout dommage indirect, accessoire ou consécutif résultant de l'utilisation ou de l'incapacité à utiliser nos produits ou notre plateforme."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">8. {isEn ? "Applicable Law" : "Droit applicable"}</h2>
          <p>
            {isEn
              ? "These terms are governed by and construed in accordance with the laws of Cameroon. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in Yaoundé, Cameroon."
              : "Ces conditions sont régies et interprétées conformément aux lois en vigueur au Cameroun. Tout litige sera soumis à la juridiction exclusive des tribunaux compétents de Yaoundé, Cameroun."}
          </p>
        </section>

      </div>
    </div>
  );
}