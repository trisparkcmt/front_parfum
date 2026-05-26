### 1. Pour les Virements / Payouts (Retraits prestataires)

• Aucune URL de redirection n'est nécessaire.
Le virement de fonds (disbursement/payout) est initié directement de serveur à serveur (via une requête POST vers l'API de Monetbil). Le prestataire n'a pas besoin de s'authentifier
ou de valider l'opération sur son navigateur.
• L'URL essentielle est l'URL de notification (Webhook) :
Puisque le traitement est asynchrone, Monetbil notifie notre backend du statut de la transaction (succès ou échec) en appelant un webhook. Le système génère automatiquement et transmet
cette URL de notification dynamique ( payout_notification_url ) dans la requête de chaque virement :
https://<votre-nom-de-domaine>/api/v1/auth/payout/webhook/ (ex. https://api.accessoireexclusif.com/api/v1/auth/payout/webhook/ ).
Cette URL est publique et exemptée de protection CSRF pour permettre aux serveurs de Monetbil d'y poster les résultats.
──────

### 2. Si vous utilisez également Monetbil pour la Collecte (Paiement des clients)

Si vous configurez un service de paiement client dans votre tableau de bord Monetbil, vous devrez alors renseigner les URL suivantes :

• URL de redirection de succès (Return URL) : L'adresse de votre page de confirmation sur votre frontend (ex: https://accessoireexclusif.com/orders/success ).
• URL de redirection d'annulation (Cancel URL) : L'adresse de retour en cas d'annulation sur votre frontend (ex: https://accessoireexclusif.com/orders/cancel ).
• URL de notification (Webhook de paiement) : L'endpoint de votre API backend qui écoutera les notifications de paiement client (ex: https://api.accessoireexclusif.
com/api/v1/payments/webhook/ ).

Vous pouvez consulter le rapport complet des modifications et de leur validation dans le fichier walkthrough.md.
