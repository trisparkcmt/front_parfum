'use client';

import { BackButton } from '@/components/ui/BackButton';
import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <BackButton label={isEn ? "Back" : "Retour"} />
      
      <div className="border-b border-white/10 pb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Documentation</span>
        <h1 className="text-4xl font-serif font-bold text-foreground mt-2">
          {isEn ? "Terms & Conditions" : "Conditions Générales d'Utilisation"}
        </h1>
        <p className="text-xs text-foreground/40 mt-1 uppercase tracking-widest">
          {isEn ? "Last updated: July 1, 2026" : "Dernière mise à jour : 1er Juillet 2026"}
        </p>
      </div>

      <div className="space-y-6 text-sm text-foreground/80 leading-relaxed font-sans">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">1. {isEn ? "Acceptance of Terms" : "Acceptation des conditions"}</h2>
          <p>
            {isEn 
              ? "By accessing and placing an order on Accessories Exclusif, you confirm that you are in agreement with and bound by the terms of service contained in the Terms & Conditions outlined below. These terms apply to the entire website and any email or other type of communication between you and Accessories Exclusif."
              : "En accédant et en passant une commande sur Accessories Exclusif, vous confirmez que vous êtes d'accord avec et lié par les conditions d'utilisation contenues dans les Conditions Générales d'Utilisation décrites ci-dessous. Ces conditions s'appliquent à l'ensemble du site web et à toute communication entre vous et Accessories Exclusif."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">2. {isEn ? "Products and Atelier Olfactif" : "Produits et Atelier Olfactif"}</h2>
          <p>
            {isEn
              ? "We provide custom perfume formulation services under Numba Atelier and sale of luxury accessories. Formulations created by users are custom-made items. As such, once custom perfume orders are validated, they cannot be returned or refunded due to their personalized nature."
              : "Nous proposons des services de formulation de parfums sur mesure sous l'Atelier Numba et la vente d'accessoires de luxe. Les formulations créées par les utilisateurs sont des articles personnalisés. Par conséquent, une fois validées, les commandes de parfums sur mesure ne peuvent être retournées ou remboursées."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">3. {isEn ? "Delivery & Payments" : "Livraison & Paiements"}</h2>
          <p>
            {isEn
              ? "All payments on the platform are handled securely. Local deliveries in Yaoundé, Douala, and surrounding regions are handled by our assigned delivery agents. Standard processing takes 24-48 hours depending on product availability."
              : "Tous les paiements sur la plateforme sont traités de manière sécurisée. Les livraisons locales à Yaoundé, Douala et dans les régions environnantes sont gérées par nos livreurs assignés. Le traitement standard prend entre 24 et 48 heures."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">4. {isEn ? "User Account & Security" : "Compte Utilisateur & Sécurité"}</h2>
          <p>
            {isEn
              ? "You are responsible for keeping your account password secure. If you select the 'Remember Me' feature, credential tokens are stored securely in local cookies or storage to keep you logged in. Please log out if you are using a shared device."
              : "Vous êtes responsable de la sécurité du mot de passe de votre compte. Si vous sélectionnez l'option 'Se souvenir de moi', des jetons de connexion sont stockés de manière sécurisée dans des cookies ou espace local pour vous maintenir connecté."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">5. {isEn ? "Contact Us" : "Contactez-nous"}</h2>
          <p>
            {isEn
              ? "If you have any questions about these Terms & Conditions, please contact our support team."
              : "Si vous avez des questions concernant ces Conditions Générales, veuillez contacter notre équipe d'assistance."}
          </p>
        </section>
      </div>
    </div>
  );
}
