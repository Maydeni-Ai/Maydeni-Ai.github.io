// ══════════════════════════════════════════════════════════
// Maydeni AI — i18n (Français / English)
// ══════════════════════════════════════════════════════════

const TRANSLATIONS = {
  fr: {
    nav_features:'Fonctionnalités',nav_ai:'IA',nav_pricing:'Tarifs',nav_training:'Formation',nav_download:'Télécharger',nav_security:'Sécurité',nav_contact:'Contact',nav_register:'Inscription',nav_download_btn:'Télécharger',
    intro_dev_credit: "Développé par le <strong>Dr. Slim Lamouchi</strong> fondateur d'Elyesio",
    hero_badge:"Propulsé par l'Intelligence Artificielle",hero_title_1:'Pilotez votre',hero_title_2:'force de vente',hero_title_3:"avec l'IA",
    hero_desc:"Maydeni AI est la plateforme propulsée par l'<strong>Intelligence Artificielle</strong> pour piloter votre force de vente terrain. Applications <strong>100% natives</strong> (Windows, macOS, Android, iOS) — chaque entreprise dispose de son <strong>propre serveur dédié</strong>. GPS intelligent, anti-fraude IA, gamification, import Excel, mises à jour automatiques et rapports en temps réel.",
    hero_download_app:"Télécharger l'application",hero_download_dash:'Télécharger le Dashboard',hero_download_brochure:'Télécharger la brochure (PDF)',
    hero_stat_ai:'IA Prédictive',hero_stat_realtime:'Temps réel',hero_stat_fraud:'Anti-fraude IA',hero_stat_game:'Gamification',
    phone_status:'En ligne — GPS actif',phone_score_title:'Score du jour',phone_visit_title:'Visite en cours',phone_gps_title:'Localisation GPS',
    section_features:'Fonctionnalités',features_title:'Tout ce dont vous avez besoin',features_subtitle:"Une suite complète d'outils pour optimiser votre force de vente terrain",
    feat_gps_title:'Géolocalisation GPS',feat_gps_desc:"Suivi en temps réel des agents terrain. Geofencing intelligent adapté au type de prospect (officine, dépôt, clinique).",
    feat_fraud_title:'Anti-fraude avancé',feat_fraud_desc:"Détection de faux GPS, vitesse incohérente, trajets impossibles. Photo obligatoire en cas d'anomalie.",
    feat_gamif_title:'Gamification & Scoring',feat_gamif_desc:'Système de points, classement live, combos, bonus journée parfaite. Motivation maximale des équipes.',
    feat_visits_title:'Visites automatisées',feat_visits_desc:'Début et fin automatiques basés sur la zone GPS. Chronomètre précis, contraintes horaires respectées.',
    feat_dash_title:"Dashboard directeur propulsé par l'IA",feat_dash_desc:'Carte live, heatmap, alertes IA, classement, prédictions de vente et rapports automatisés en temps réel.',
    feat_offline_title:'Mode offline',feat_offline_desc:"L'application fonctionne sans réseau. Toutes les données se synchronisent automatiquement au retour du signal.",
    section_ai_badge:'Intelligence Artificielle',ai_title:"Pourquoi l'IA dans votre Dashboard ?",ai_subtitle:"Votre directeur commercial ne se base plus sur des intuitions — il utilise l'IA pour piloter ses équipes",
    ai_prediction_title:"Prédiction du Chiffre d'Affaires",ai_prediction_desc:"L'IA analyse l'historique des ventes, la saisonnalité et les performances individuelles pour <strong>prédire le CA</strong> à venir et anticiper les besoins en stock.",
    ai_zones_title:'Zones sous-exploitées',ai_zones_desc:"L'IA identifie automatiquement les <strong>zones géographiques sous-visitées</strong> et recommande des actions correctives pour maximiser la couverture terrain.",
    ai_probability_title:'Probabilité de commande',ai_probability_desc:"Pour chaque prospect, l'IA calcule une <strong>probabilité de conversion</strong> basée sur l'historique, la fréquence de visite et le comportement d'achat.",
    ai_anomaly_title:"Détection d'anomalies IA",ai_anomaly_desc:"L'IA détecte en temps réel les <strong>comportements suspects</strong> : faux GPS, trajets impossibles, baisses de performance subites, avec un scoring de fiabilité.",
    ai_trends_title:'Tendances automatiques',ai_trends_desc:"Analyse des <strong>tendances de vente</strong> sur 7/30/90 jours avec détection automatique des hausses et baisses significatives par agent, zone ou produit.",
    ai_reco_title:'Recommandations intelligentes',ai_reco_desc:"L'IA génère des <strong>recommandations concrètes</strong> : réaffecter un agent, prioriser un prospect, ajuster la fréquence de visite — basées sur les données terrain.",
    ba_badge:'Exclusif Enterprise',ba_title:'Business Analytics Révolutionnaire',ba_subtitle:"Transformez vos données terrain en décisions stratégiques. Un clic suffit pour générer une analyse commerciale complète — sans expertise technique, sans configuration.",
    ba_activation_title:'Activation en un clic',ba_activation_desc:'Générez automatiquement KPI, prévisions IA, segmentation RFM, analyse Pareto et classement des zones — instantanément.',
    ba_predictive_title:'Intelligence Prédictive',ba_predictive_desc:'Prévisions de CA avec régression linéaire, détection de clients à risque, scoring de conversion et recommandations automatiques.',
    ba_vision_title:'Vision Directeur Commercial',ba_vision_desc:'Tableau de bord conçu pour le directeur commercial : performance agent, efficacité, Pareto produits, zones sous-exploitées et clients champions.',
    ba_cta:'Démarrer avec Enterprise',ba_cta_sub:'Essai inclus • Activation sous 24h • Annulation possible à tout moment',
    section_pricing:'Tarifs',pricing_title:'Choisissez votre forfait',pricing_desc:"Paiement sécurisé — Économisez jusqu'à <strong>30%</strong> avec un engagement plus long",
    billing_1:'1 mois',billing_3:'3 mois',billing_6:'6 mois',billing_12:'12 mois',
    pricing_currency_label:'Devise :',pricing_up_to:"Jusqu'à",pricing_agents:'agents terrain',pricing_enterprise_agents:'11 et +',pricing_month:'/mois',
    pricing_cta_starter:'Commencer',pricing_cta_pro:'Choisir Pro',pricing_cta_enterprise:'Choisir Enterprise',
    _delegates_starter:"Jusqu'à <strong>3</strong> agents terrain",_delegates_pro:"Jusqu'à <strong>5</strong> agents terrain",_delegates_enterprise:'<strong>6 et +</strong> agents terrain',
    founder_pill:'PROGRAMME FONDATEUR',founder_title:'Rejoignez les 10 premières entreprises — avantages à vie',founder_perk1:'Licence offerte',founder_perk2:'1er mois gratuit',founder_perk3:'Setup & formation inclus',founder_perk4:'Tarif bloqué à vie',founder_perk5:'Satisfait ou remboursé 60 jours',founder_seats_left:'places restantes sur 10',founder_cta:'Je réserve ma place',
    pricing_badge_popular:'⭐ POPULAIRE',pricing_badge_ai:'🧠 INTELLIGENCE AVANCÉE',pricing_tax_note:'* Tous les prix affichés sont hors taxe (HT)',
    pf_gps:'GPS temps réel & geofencing',pf_fraud:'Anti-fraude avancé',pf_gamif:'Gamification & scoring',pf_dash:'Dashboard directeur',pf_mobile:'App mobile native',pf_reports:'Rapports & export',pf_analytics:'Analytiques avancées',pf_ai:'IA Prédictive',
    pf_all_starter:'Tout du Starter',pf_import:'Import Excel prospects & produits',pf_drops:'Détection des baisses',pf_trends:'Tendances & rapports PDF',pf_heatmap:'Heatmap activité',
    pf_all_pro:'Tout du Pro',pf_ai_full:'IA Prédictive complète',pf_forecast:'Prévision de CA & stocks',pf_scoring:'Scoring probabilité commande',pf_zones:'Zones sous-exploitées',
    pf_ba:'Business Analytics avancée',pf_rfm:'Segmentation RFM clients',pf_pareto:'Analyse Pareto produits',pf_export:'Export données enrichies',pf_support:'Support prioritaire',
    how_pricing_title:'Comment ça marche ?',
    how_step1_title:'Achat de licence (une seule fois)',how_step1_desc:"Le client achète une <strong>licence unique</strong> correspondant à son forfait. C'est un paiement one-time qui active son compte.",
    how_step2_title:'Phase de calibrage (gratuit)',how_step2_desc:"L'IA calibre les données du client (prospects, produits, secteurs). Cette phase est <strong>100% gratuite</strong> — aucune facturation ne démarre.",
    how_step3_title:'1 mois offert + abonnement',how_step3_desc:"Une fois le calibrage terminé, le client bénéficie d'<strong>1 mois gratuit</strong>. Ensuite, l'abonnement mensuel démarre automatiquement.",
    license_starter:'Licence Starter',license_pro:'Licence Pro',license_enterprise:'Licence Enterprise',license_one_time:'paiement unique',
    pricing_secure_title:'Paiement sécurisé',pricing_secure_desc:"Économisez jusqu'à 30% en choisissant un engagement de 12 mois. Les coordonnées de paiement vous seront communiquées après inscription.",
    pricing_bank_title:'Virement bancaire',pricing_bank_subtitle:'Méthode de paiement disponible — Activation sous 24h',pricing_bank_beneficiary:'Bénéficiaire',pricing_bank_bank:'Banque',pricing_bank_note:'Indiquez votre nom de société dans le motif du virement. Votre espace sera activé sous 24h après réception.',
    pricing_card_title:'Carte bancaire',pricing_card_soon:'Bientôt',pricing_card_desc:'Visa, MasterCard, e-DINAR — Paiement en ligne sécurisé disponible prochainement.',
    pricing_activation_title:'Activation instantanée',pricing_activation_desc:"Dès réception et confirmation de votre paiement, votre espace est <strong>activé immédiatement</strong>. Vous recevez vos accès par email et pouvez commencer à utiliser Maydeni AI sans délai.",
    pricing_reminders_title:'Rappels automatiques',pricing_reminders_desc:"5 jours avant l'échéance de votre abonnement, un rappel de renouvellement vous est envoyé chaque jour. En cas de non-paiement à la date d'échéance, l'accès est <strong>provisoirement suspendu</strong> jusqu'au règlement. Le service reprend instantanément après paiement.",
    pricing_total_text:'Total :',pricing_ht_for:'HT pour',pricing_months:'mois',pricing_you_save:'Vous économisez',
    training_badge:'Formation incluse',training_title:'Formation gratuite & personnalisée',training_subtitle:'Offerte par le développeur en personne à chaque nouveau client',
    training_main_title:'Formation 100% gratuite, en direct',training_main_desc:"À chaque nouvelle inscription, <strong>je vous accompagne personnellement</strong> : moi, le développeur de Maydeni AI. La formation est réalisée en visioconférence en direct (Google Meet, Zoom ou autre), à l'heure qui vous convient.",
    training_step1_title:'Installation guidée',training_step1_desc:"Je vous guide pas à pas pour installer le Dashboard natif sur votre ordinateur (Windows, Mac) et l'application mobile sur les téléphones de vos agents terrain (Android, iOS).",
    training_step2_title:'Configuration de votre espace',training_step2_desc:'Import de vos prospects depuis Excel, création des comptes agents terrain, paramétrage du geofencing, configuration de la gamification et des rapports.',
    training_step3_title:'Prise en main complète',training_step3_desc:'Je vous montre toutes les fonctionnalités : suivi GPS, lecture du dashboard, rapports, classement, anti-fraude, IA prédictive. Je réponds à toutes vos questions en direct.',
    training_step4_title:'Vous êtes opérationnel !',training_step4_desc:"À la fin de la formation, tout est prêt. Vos agents n'ont plus qu'à ouvrir l'app et commencer à travailler. Le dashboard se met à jour en temps réel dès la première visite !",
    training_cta_text:"<strong>La formation est incluse dans tous les forfaits</strong>, sans frais supplémentaire. Après la formation, un <strong>système d'assistance intégré</strong> est disponible directement dans votre dashboard : planifiez un <strong>meeting live</strong> en visioconférence avec le développeur, ou soumettez votre problème pour recevoir une <strong>solution détaillée par email</strong> — sans délai, sans intermédiaire.",
    training_cta_btn:"S'inscrire et réserver ma formation",
    download_badge:'Téléchargements',download_title:'Téléchargez Maydeni AI',download_subtitle:"Applications natives pour toutes les plateformes. Chaque entreprise utilise son propre serveur sécurisé.<br>Les mises à jour sont notifiées automatiquement dans l'application.",
    download_dash_heading:'Dashboard Directeur Commercial',download_dash_sub:"Accédez au dashboard depuis n'importe quel navigateur",
    download_web_title:'Dashboard Web',download_web_version:'Accès instantané — Aucune installation',download_web_f1:'Windows, macOS, Linux',download_web_f2:'Chrome, Safari, Firefox, Edge',download_web_f3:'Connexion internet requise',download_web_cta_small:'Ouvrir le',download_web_cta:'Dashboard Directeur',
    download_activation_title:'Activation',download_activation_version:"Clé de licence fournie à l'achat",download_activation_f1:'1 licence = 1 société',download_activation_f2:'Activation une seule fois',download_activation_f3:'Identifiants envoyés par email',download_activation_cta_small:'Demander une',download_activation_cta:"Licence d'activation",
    download_agent_heading:'Application Agent Terrain',download_agent_sub:'Application mobile pour vos agents commerciaux sur le terrain',
    download_android_title:'Android & iOS',download_android_version:'Web App Progressive (PWA)',download_android_f1:'Android 8.0+ / iOS 14.0+',download_android_f2:'GPS requis',download_android_f3:'Fonctionne hors ligne',download_android_cta_small:"Ouvrir l'application",download_android_cta:'Agent Terrain',
    download_pwa_title:'Installation PWA',download_pwa_version:"Ajouter à l'écran d'accueil",download_pwa_f1:'Ouvrez le lien sur mobile',download_pwa_f2:'Menu ⋯ → "Ajouter à l\'écran d\'accueil"',download_pwa_f3:'Icône sur le bureau comme une app native',download_pwa_cta_small:'Installer sur',download_pwa_cta:'iPhone / iPad / Android',
    section_security_badge:'Sécurité',security_title:'Sécurité de niveau entreprise',security_subtitle:'Vos données sont protégées à chaque étape',
    sec_jwt_title:'Authentification JWT',sec_jwt_desc:'Sessions sécurisées avec tokens signés et expiration automatique',
    sec_bcrypt_title:'Mots de passe bcrypt',sec_bcrypt_desc:'Hachage bcrypt avec 12 tours de salage',
    sec_gps_title:'Anti-fraude GPS',sec_gps_desc:'Détection mock location, vitesse incohérente, logs invisibles',
    sec_https_title:'HTTPS / Rate Limiting',sec_https_desc:'Communications chiffrées et protection contre les attaques par force brute',
    sec_log_title:'Journal de sécurité',sec_log_desc:'Chaque anomalie est enregistrée avec horodatage et métadonnées',
    sec_roles_title:'Rôles & permissions',sec_roles_desc:'Admin, Directeur, Agent terrain — accès contrôlé à chaque niveau',
    howit_badge:'Fonctionnement',howit_title:'Comment ça marche ?',
    howit_step1_title:'Téléchargez les apps',howit_step1_desc:"Le directeur installe le Dashboard natif (Windows/Mac) et les agents terrain installent l'app mobile (Android/iOS).",
    howit_step2_title:'Votre propre serveur',howit_step2_desc:'Vos données restent chez vous. Chaque entreprise dispose de son serveur dédié, sécurisé et indépendant.',
    howit_step3_title:'Vos agents sur le terrain',howit_step3_desc:"GPS automatique, visites chronométrées, commandes en temps réel. L'IA détecte les anomalies.",
    howit_step4_title:'Mises à jour automatiques',howit_step4_desc:"Une notification apparaît quand une mise à jour est disponible. Un clic pour mettre à jour — c'est tout !",
    footer_desc:'Plateforme de supervision terrain intelligente',footer_rights:'© 2026 Maydeni AI — Tous droits réservés',
    footer_nav_heading:'Navigation',footer_access_heading:'Accès',footer_signup:"S'inscrire",footer_contact_heading:'Contact',footer_location:'Tunis, Tunisie',footer_admin:'Administration',
    admin_title:'Accès Administration',admin_subtitle:'Réservé aux administrateurs Maydeni AI',admin_user_label:'Identifiant',admin_user_placeholder:'Entrez votre identifiant',admin_pass_label:'Mot de passe',admin_pass_placeholder:'Entrez votre mot de passe',admin_error:'Identifiants incorrects',admin_server_error:'Erreur de connexion au serveur',admin_submit:'Se connecter',
  },
  en: {
    nav_features:'Features',nav_ai:'AI',nav_pricing:'Pricing',nav_training:'Training',nav_download:'Download',nav_security:'Security',nav_contact:'Contact',nav_register:'Sign Up',nav_download_btn:'Download',
    intro_dev_credit:'Developed by <strong>Dr. Slim Lamouchi</strong> founder of Elyesio',
    hero_badge:'Powered by Artificial Intelligence',hero_title_1:'Manage your',hero_title_2:'sales force',hero_title_3:'with AI',
    hero_desc:'Maydeni AI is the platform powered by <strong>Artificial Intelligence</strong> to manage your field sales force. <strong>100% native</strong> applications (Windows, macOS, Android, iOS) — each company has its own <strong>dedicated server</strong>. Smart GPS, AI anti-fraud, gamification, Excel import, automatic updates and real-time reports.',
    hero_download_app:'Download the App',hero_download_dash:'Download Dashboard',hero_download_brochure:'Download brochure (PDF)',
    hero_stat_ai:'Predictive AI',hero_stat_realtime:'Real-time',hero_stat_fraud:'AI Anti-fraud',hero_stat_game:'Gamification',
    phone_status:'Online — GPS active',phone_score_title:"Today's Score",phone_visit_title:'Visit in progress',phone_gps_title:'GPS Location',
    section_features:'Features',features_title:'Everything you need',features_subtitle:'A complete suite of tools to optimize your field sales force',
    feat_gps_title:'GPS Geolocation',feat_gps_desc:'Real-time tracking of field agents. Smart geofencing adapted to prospect type (pharmacy, depot, clinic).',
    feat_fraud_title:'Advanced Anti-fraud',feat_fraud_desc:'Detection of fake GPS, inconsistent speed, impossible routes. Mandatory photo on anomaly.',
    feat_gamif_title:'Gamification & Scoring',feat_gamif_desc:'Points system, live ranking, combos, perfect day bonus. Maximum team motivation.',
    feat_visits_title:'Automated Visits',feat_visits_desc:'Automatic start and end based on GPS zone. Precise timer, time constraints respected.',
    feat_dash_title:'AI-powered Director Dashboard',feat_dash_desc:'Live map, heatmap, AI alerts, ranking, sales predictions and automated real-time reports.',
    feat_offline_title:'Offline Mode',feat_offline_desc:'The app works without network. All data syncs automatically when signal returns.',
    section_ai_badge:'Artificial Intelligence',ai_title:'Why AI in your Dashboard?',ai_subtitle:'Your sales director no longer relies on intuition — they use AI to manage their teams',
    ai_prediction_title:'Revenue Prediction',ai_prediction_desc:'AI analyzes sales history, seasonality and individual performance to <strong>predict upcoming revenue</strong> and anticipate stock needs.',
    ai_zones_title:'Underexploited Zones',ai_zones_desc:'AI automatically identifies <strong>under-visited geographic zones</strong> and recommends corrective actions to maximize field coverage.',
    ai_probability_title:'Order Probability',ai_probability_desc:'For each prospect, AI calculates a <strong>conversion probability</strong> based on history, visit frequency and purchasing behavior.',
    ai_anomaly_title:'AI Anomaly Detection',ai_anomaly_desc:'AI detects in real-time <strong>suspicious behaviors</strong>: fake GPS, impossible routes, sudden performance drops, with a reliability score.',
    ai_trends_title:'Automatic Trends',ai_trends_desc:'Analysis of <strong>sales trends</strong> over 7/30/90 days with automatic detection of significant increases and decreases by agent, zone or product.',
    ai_reco_title:'Smart Recommendations',ai_reco_desc:'AI generates <strong>actionable recommendations</strong>: reassign an agent, prioritize a prospect, adjust visit frequency — based on field data.',
    ba_badge:'Enterprise Exclusive',ba_title:'Revolutionary Business Analytics',ba_subtitle:'Transform your field data into strategic decisions. One click is enough to generate a complete business analysis — no technical expertise, no configuration.',
    ba_activation_title:'One-click Activation',ba_activation_desc:'Automatically generate KPIs, AI forecasts, RFM segmentation, Pareto analysis and zone ranking — instantly.',
    ba_predictive_title:'Predictive Intelligence',ba_predictive_desc:'Revenue forecasts with linear regression, at-risk client detection, conversion scoring and automatic recommendations.',
    ba_vision_title:'Sales Director Vision',ba_vision_desc:'Dashboard designed for the sales director: agent performance, efficiency, product Pareto, underexploited zones and champion clients.',
    ba_cta:'Get Started with Enterprise',ba_cta_sub:'Trial included • Activation within 24h • Cancel anytime',
    section_pricing:'Pricing',pricing_title:'Choose your plan',pricing_desc:'Secure payment — Save up to <strong>30%</strong> with a longer commitment',
    billing_1:'1 month',billing_3:'3 months',billing_6:'6 months',billing_12:'12 months',
    pricing_currency_label:'Currency:',pricing_up_to:'Up to',pricing_agents:'field agents',pricing_enterprise_agents:'11 and more',pricing_month:'/month',
    pricing_cta_starter:'Get Started',pricing_cta_pro:'Choose Pro',pricing_cta_enterprise:'Choose Enterprise',
    _delegates_starter:'Up to <strong>3</strong> field agents',_delegates_pro:'Up to <strong>5</strong> field agents',_delegates_enterprise:'<strong>6 and more</strong> field agents',
    founder_pill:'FOUNDING CUSTOMER PROGRAM',founder_title:'Join the first 10 companies — lifetime perks',founder_perk1:'License waived',founder_perk2:'First month free',founder_perk3:'Setup & training included',founder_perk4:'Price locked for life',founder_perk5:'60-day money-back guarantee',founder_seats_left:'seats left out of 10',founder_cta:'Claim my seat',
    pricing_badge_popular:'⭐ POPULAR',pricing_badge_ai:'🧠 ADVANCED INTELLIGENCE',pricing_tax_note:'* All prices shown are before tax',
    pf_gps:'Real-time GPS & geofencing',pf_fraud:'Advanced anti-fraud',pf_gamif:'Gamification & scoring',pf_dash:'Director dashboard',pf_mobile:'Native mobile app',pf_reports:'Reports & export',pf_analytics:'Advanced analytics',pf_ai:'Predictive AI',
    pf_all_starter:'Everything in Starter',pf_import:'Excel import prospects & products',pf_drops:'Drop detection',pf_trends:'Trends & PDF reports',pf_heatmap:'Activity heatmap',
    pf_all_pro:'Everything in Pro',pf_ai_full:'Full Predictive AI',pf_forecast:'Revenue & stock forecasts',pf_scoring:'Order probability scoring',pf_zones:'Underexploited zones',
    pf_ba:'Advanced Business Analytics',pf_rfm:'RFM client segmentation',pf_pareto:'Product Pareto analysis',pf_export:'Enriched data export',pf_support:'Priority support',
    how_pricing_title:'How does it work?',
    how_step1_title:'License purchase (one time)',how_step1_desc:'The client purchases a <strong>one-time license</strong> matching their plan. It\'s a one-time payment that activates the account.',
    how_step2_title:'Calibration phase (free)',how_step2_desc:'AI calibrates the client\'s data (prospects, products, sectors). This phase is <strong>100% free</strong> — no billing starts.',
    how_step3_title:'1 free month + subscription',how_step3_desc:'Once calibration is complete, the client gets <strong>1 free month</strong>. Then the monthly subscription starts automatically.',
    license_starter:'Starter License',license_pro:'Pro License',license_enterprise:'Enterprise License',license_one_time:'one-time payment',
    pricing_secure_title:'Secure payment',pricing_secure_desc:'Save up to 30% by choosing a 12-month commitment. Payment details will be provided after registration.',
    pricing_bank_title:'Bank transfer',pricing_bank_subtitle:'Available payment method — Activation within 24h',pricing_bank_beneficiary:'Beneficiary',pricing_bank_bank:'Bank',pricing_bank_note:'Include your company name in the transfer reference. Your workspace will be activated within 24h after receipt.',
    pricing_card_title:'Credit card',pricing_card_soon:'Coming soon',pricing_card_desc:'Visa, MasterCard, e-DINAR — Secure online payment available soon.',
    pricing_activation_title:'Instant activation',pricing_activation_desc:'As soon as your payment is received and confirmed, your workspace is <strong>activated immediately</strong>. You receive your credentials by email and can start using Maydeni AI right away.',
    pricing_reminders_title:'Automatic reminders',pricing_reminders_desc:'5 days before your subscription expires, a renewal reminder is sent daily. If payment is not received by the due date, access is <strong>temporarily suspended</strong> until payment. Service resumes instantly after payment.',
    pricing_total_text:'Total:',pricing_ht_for:'excl. tax for',pricing_months:'months',pricing_you_save:'You save',
    training_badge:'Training included',training_title:'Free & personalized training',training_subtitle:'Offered by the developer in person for every new client',
    training_main_title:'100% free training, live',training_main_desc:'With every new registration, <strong>I personally guide you</strong>: me, the developer of Maydeni AI. Training is conducted via live video call (Google Meet, Zoom or other), at your convenience.',
    training_step1_title:'Guided installation',training_step1_desc:'I guide you step by step to install the native Dashboard on your computer (Windows, Mac) and the mobile app on your field agents\' phones (Android, iOS).',
    training_step2_title:'Workspace setup',training_step2_desc:'Import your prospects from Excel, create field agent accounts, set up geofencing, configure gamification and reports.',
    training_step3_title:'Complete walkthrough',training_step3_desc:'I show you all the features: GPS tracking, dashboard reading, reports, ranking, anti-fraud, predictive AI. I answer all your questions live.',
    training_step4_title:"You're operational!",training_step4_desc:"At the end of training, everything is ready. Your agents just need to open the app and start working. The dashboard updates in real-time from the first visit!",
    training_cta_text:'<strong>Training is included in all plans</strong>, at no extra cost. After training, a <strong>built-in support system</strong> is available directly in your dashboard: schedule a <strong>live meeting</strong> via video call with the developer, or submit your issue to receive a <strong>detailed solution by email</strong> — no delays, no middlemen.',
    training_cta_btn:'Sign up and book my training',
    download_badge:'Downloads',download_title:'Download Maydeni AI',download_subtitle:'Native applications for all platforms. Each company uses its own secure server.<br>Updates are automatically notified within the app.',
    download_dash_heading:'Sales Director Dashboard',download_dash_sub:'Access the dashboard from any browser',
    download_web_title:'Web Dashboard',download_web_version:'Instant access — No installation',download_web_f1:'Windows, macOS, Linux',download_web_f2:'Chrome, Safari, Firefox, Edge',download_web_f3:'Internet connection required',download_web_cta_small:'Open the',download_web_cta:'Director Dashboard',
    download_activation_title:'Activation',download_activation_version:'License key provided at purchase',download_activation_f1:'1 license = 1 company',download_activation_f2:'One-time activation',download_activation_f3:'Credentials sent by email',download_activation_cta_small:'Request a',download_activation_cta:'Activation License',
    download_agent_heading:'Field Agent Application',download_agent_sub:'Mobile application for your sales representatives in the field',
    download_android_title:'Android & iOS',download_android_version:'Progressive Web App (PWA)',download_android_f1:'Android 8.0+ / iOS 14.0+',download_android_f2:'GPS required',download_android_f3:'Works offline',download_android_cta_small:'Open the',download_android_cta:'Field Agent App',
    download_pwa_title:'PWA Installation',download_pwa_version:'Add to Home Screen',download_pwa_f1:'Open the link on mobile',download_pwa_f2:'Menu ⋯ → "Add to Home Screen"',download_pwa_f3:'Icon on desktop like a native app',download_pwa_cta_small:'Install on',download_pwa_cta:'iPhone / iPad / Android',
    section_security_badge:'Security',security_title:'Enterprise-grade Security',security_subtitle:'Your data is protected at every step',
    sec_jwt_title:'JWT Authentication',sec_jwt_desc:'Secure sessions with signed tokens and automatic expiration',
    sec_bcrypt_title:'bcrypt Passwords',sec_bcrypt_desc:'bcrypt hashing with 12 salt rounds',
    sec_gps_title:'GPS Anti-fraud',sec_gps_desc:'Mock location detection, inconsistent speed, invisible logs',
    sec_https_title:'HTTPS / Rate Limiting',sec_https_desc:'Encrypted communications and brute force attack protection',
    sec_log_title:'Security Log',sec_log_desc:'Every anomaly is recorded with timestamp and metadata',
    sec_roles_title:'Roles & Permissions',sec_roles_desc:'Admin, Director, Field Agent — controlled access at every level',
    howit_badge:'How it works',howit_title:'How does it work?',
    howit_step1_title:'Download the apps',howit_step1_desc:'The director installs the native Dashboard (Windows/Mac) and field agents install the mobile app (Android/iOS).',
    howit_step2_title:'Your own server',howit_step2_desc:'Your data stays with you. Each company has its own dedicated, secure and independent server.',
    howit_step3_title:'Your agents in the field',howit_step3_desc:'Automatic GPS, timed visits, real-time orders. AI detects anomalies.',
    howit_step4_title:'Automatic updates',howit_step4_desc:"A notification appears when an update is available. One click to update — that's it!",
    footer_desc:'Smart field supervision platform',footer_rights:'© 2026 Maydeni AI — All rights reserved',
    footer_nav_heading:'Navigation',footer_access_heading:'Access',footer_signup:'Sign up',footer_contact_heading:'Contact',footer_location:'Tunis, Tunisia',footer_admin:'Administration',
    admin_title:'Admin Access',admin_subtitle:'Reserved for Maydeni AI administrators',admin_user_label:'Username',admin_user_placeholder:'Enter your username',admin_pass_label:'Password',admin_pass_placeholder:'Enter your password',admin_error:'Incorrect credentials',admin_server_error:'Server connection error',admin_submit:'Log in',
  }
};

let currentLang = localStorage.getItem('maydeni_lang') || 'fr';

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.fr[key] || key;
}

function switchLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('maydeni_lang', lang);

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = translation;
    } else if (el.hasAttribute('data-i18n-html')) {
      el.innerHTML = translation;
    } else {
      el.textContent = translation;
    }
  });

  // Update lang toggle buttons (fix inline style overrides)
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle('active', isActive);
    btn.style.color = isActive ? '#F3F4F6' : '#9CA3AF';
    btn.style.borderColor = isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';
  });

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Re-apply billing toggle to refresh dynamic pricing text
  var activeBtn = document.querySelector('.billing-btn.active');
  if (activeBtn) activeBtn.click();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  if (currentLang !== 'fr') switchLang(currentLang);
});
