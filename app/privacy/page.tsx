'use client';

/**
 * @file app/privacy/page.tsx
 * @description Privacy Policy Page for Accessoires Exclusifs.
 */
import { BackButton } from '@/components/ui/BackButton';
import { useTranslation } from 'react-i18next';

export default function PrivacyPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <BackButton label={t('back', { defaultValue: isEn ? 'Back' : 'Retour' })} />

      <div className="border-b border-white/10 pb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
          {t('documentation', { defaultValue: 'Documentation' })}
        </span>
        <h1 className="text-4xl font-serif font-bold text-foreground mt-2">
          {t('privacy_title', { defaultValue: isEn ? 'Privacy Policy' : 'Politique de confidentialité' })}
        </h1>
        <p className="text-xs text-foreground/40 mt-1 uppercase tracking-widest">
          {t('privacy_last_updated', { defaultValue: isEn ? 'Last updated: September 2, 2026' : 'Dernière mise à jour : 2 septembre 2026' })}
        </p>
      </div>

      <div className="space-y-6 text-sm text-foreground/80 leading-relaxed font-sans">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">1. {isEn ? 'Information we collect' : 'Informations collectées'}</h2>
          <p>{isEn ? 'When you create an account or place an order, we collect the information needed to provide our services, such as your name, email address, phone number, delivery details, and order information.' : 'Lorsque vous créez un compte ou passez une commande, nous collectons les informations nécessaires à la fourniture de nos services, notamment votre nom, votre adresse email, votre numéro de téléphone, vos informations de livraison et les détails de vos commandes.'}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">2. {isEn ? 'How we use your information' : 'Utilisation de vos informations'}</h2>
          <p>{isEn ? 'We use this information to manage your account, process and deliver orders, communicate with you about our services, protect the platform, and improve your shopping experience.' : 'Nous utilisons ces informations pour gérer votre compte, traiter et livrer vos commandes, communiquer avec vous au sujet de nos services, protéger la plateforme et améliorer votre expérience d’achat.'}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">3. {isEn ? 'Sharing and retention' : 'Partage et conservation'}</h2>
          <p>{isEn ? 'We share information only with service providers who help operate the platform, such as delivery, hosting, authentication, and analytics providers, and only as needed for those services. We retain information for as long as necessary to provide our services and meet legal obligations.' : 'Nous partageons vos informations uniquement avec les prestataires qui contribuent au fonctionnement de la plateforme, notamment pour la livraison, l’hébergement, l’authentification et les statistiques, dans la limite nécessaire à ces services. Nous conservons les informations aussi longtemps que nécessaire à la fourniture de nos services et au respect de nos obligations légales.'}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">4. {isEn ? 'Your rights' : 'Vos droits'}</h2>
          <p>{isEn ? 'You may request access to, correction of, or deletion of your personal information, subject to applicable law. Contact our support team to exercise these rights or ask questions about your data.' : 'Vous pouvez demander l’accès, la rectification ou la suppression de vos informations personnelles, sous réserve du droit applicable. Contactez notre équipe d’assistance pour exercer ces droits ou poser toute question concernant vos données.'}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">5. {isEn ? 'Contact' : 'Contact'}</h2>
          <p>{isEn ? 'For privacy questions, please contact Accessoires Exclusifs through the support channels available on this website.' : 'Pour toute question relative à la confidentialité, veuillez contacter Accessoires Exclusifs via les canaux d’assistance disponibles sur ce site.'}</p>
        </section>
      </div>
    </div>
  );
}
