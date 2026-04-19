# 💳 Guide Paiement — Recevoir en DT sur votre compte BTE via Flouci

## Situation actuelle
Maydeni AI utilise actuellement un système de paiement **semi-automatique** :
- **Flouci P2P** : Le client envoie via l'app Flouci
- **D17 (La Poste)** : Transfert postal
- **Virement bancaire** : Virement direct vers le compte BTE

Les fonds arrivent sur :
```
Banque : BTE (Banque de Tunisie et des Emirats) — Agence Virtuelle
IBAN   : TN59 24 031 155 9222 511101 59
SWIFT  : BTEXTNTT
```

## Pour activer le paiement par carte (Visa/MasterCard) en DT

### Option 1 : Flouci Business (Recommandé)
1. **Créer un compte Flouci Business** sur https://business.flouci.com
2. **Obtenir votre matricule fiscal** (requis par la loi tunisienne)
3. **Lier votre compte BTE** comme compte de règlement
4. **Configurer l'API** :
   - API URL : `https://developers.flouci.com/api/generate_payment`
   - Vous recevrez un `app_token` et `app_secret`
5. **Variables d'environnement** à configurer sur Render :
   ```
   GATEWAY_API_URL=https://developers.flouci.com/api/generate_payment
   GATEWAY_API_KEY=votre_app_token
   GATEWAY_WALLET_ID=votre_wallet_id
   ```
6. Les paiements par carte (Visa, MasterCard, e-DINAR) seront convertis automatiquement en **DT** et versés sur votre compte Flouci Business, que vous pouvez retirer vers votre compte BTE.

### Option 2 : Konnect.tn (Alternative)
1. **S'inscrire sur** https://konnect.network
2. Konnect supporte Visa, MasterCard, e-DINAR Smart
3. Même principe : les fonds sont versés en DT sur votre compte bancaire tunisien

### Option 3 : PayTabs (International)
Pour les clients hors Tunisie payant en devise étrangère :
1. Les devises étrangères (EUR, USD, etc.) sont converties en TND
2. PayTabs verse en DT directement sur votre compte bancaire BTE

## Conclusion
**Quelle que soit la carte (Visa, MasterCard, e-DINAR), vous serez payé en DT dans votre compte BTE**, car :
1. Flouci Business et Konnect sont des PSP tunisiens régulés par la BCT
2. Ils collectent en multi-devises et versent en DT
3. Votre IBAN BTE est configuré comme compte de règlement

### Prochaine étape
→ Obtenir votre **matricule fiscal** et créer un compte **Flouci Business**
→ Configurer les variables d'environnement sur Render.com
→ Le code est déjà prêt dans `backend/src/routes/payments.js` pour basculer du mode P2P au mode Gateway API
