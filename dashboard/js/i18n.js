/**
 * Maydeni AI — Dashboard Internationalization (i18n)
 * Supports: fr (French), en (English)
 * Usage: t('key') or data-i18n="key" attribute
 */

const LANG = {
  fr: {
    // ─── Nav ─────────────────────────────────────
    'nav.overview': 'Vue d\'ensemble',
    'nav.map': 'Carte Live',
    'nav.leaderboard': 'Classement',
    'nav.delegues': 'Agents',
    'nav.prospects': 'Prospects',
    'nav.assignments': 'Affectations',
    'nav.planning': 'Planning',
    'nav.visits': 'Visites',
    'nav.alerts': 'Alertes',
    'nav.trends': 'Tendances',
    'nav.predictions': 'IA Prédictive',
    'nav.analytics': 'Business Analytics',
    'nav.points': 'Points',
    'nav.order-validation': 'Valid. Commandes',
    'nav.import': 'Import IA',
    'nav.subscription': 'Abonnement',
    'nav.settings': 'Paramètres',
    'nav.pending': 'Inscriptions',
    'nav.payments': 'Paiements',
    'nav.tenants': 'Sociétés',
    'nav.subscriptions': 'Abonnements',
    'nav.platform': 'Plateforme',
    'nav.demo-simulation': 'Démo / Simulation',

    // ─── Login ───────────────────────────────────
    'login.title': 'Connexion Dashboard',
    'login.username': 'Identifiant',
    'login.password': 'Mot de passe',
    'login.submit': 'Se connecter',
    'login.error': 'Identifiant ou mot de passe incorrect',
    'login.change_password': 'Changer mon mot de passe',
    'login.back': 'Retour à la connexion',
    'login.current_password': 'Mot de passe actuel',
    'login.new_password': 'Nouveau mot de passe',
    'login.confirm_password': 'Confirmer le nouveau mot de passe',
    'login.min_chars': 'Min. 6 caractères',
    'login.change_btn': 'Changer le mot de passe',
    'login.admin_id': 'Identifiant Admin',
    'login.admin_code': 'Code d\'accès',
    'login.admin_access': 'Accéder',

    // ─── Section Headers ─────────────────────────
    'section.overview': 'Vue d\'ensemble',
    'section.map': 'Carte Live',
    'section.leaderboard': 'Classement & Gamification',
    'section.delegues': 'Gestion des Agents',
    'section.prospects': 'Prospects',
    'section.assignments': 'Affectation des Prospects',
    'section.planning': 'Planning des Visites',
    'section.visits': 'Visites',
    'section.alerts': 'Journal de Sécurité',
    'section.trends': 'Tendances & Historique Prix',
    'section.predictions': 'Tableau de Bord IA Prédictif',
    'section.analytics': 'Business Analytics',
    'section.points': 'Gestion des Points',
    'section.order-validation': 'Validation des Commandes',
    'section.import': 'Import Intelligent des Données',
    'section.settings': 'Paramètres Geofencing',
    'section.subscription': 'Mon Abonnement',
    'section.pending': 'Inscriptions en attente',
    'section.tenants': 'Gestion des Sociétés',
    'section.subscriptions': 'Forfaits & Abonnements',
    'section.platform': 'Vue Plateforme',
    'section.demo': 'Démo / Simulation',

    // ─── Stats ───────────────────────────────────
    'stat.delegues': 'Agents actifs',
    'stat.visits': 'Visites aujourd\'hui',
    'stat.suspect': 'Visites suspectes',
    'stat.orders': 'Commandes',
    'stat.revenue': 'Chiffre du jour',
    'stat.online': 'En ligne',

    // ─── Common ──────────────────────────────────
    'common.loading': 'Chargement...',
    'common.search': 'Rechercher...',
    'common.all_cities': 'Toutes villes',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.export': 'Exporter',
    'common.generate': 'Générer',
    'common.refresh': 'Actualiser',
    'common.close': 'Fermer',
    'common.confirm': 'Confirmer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.active': 'Actif',
    'common.inactive': 'Inactif',
    'common.deactivate': 'Désactiver',
    'common.activate': 'Activer',
    'common.none': 'Aucun',
    'common.all': 'Tous',
    'common.disconnect': 'Déconnexion',
    'common.director': 'Directeur',
    'common.update': 'Mettre à jour',
    'common.later': 'Plus tard',
    'common.download': 'Télécharger',

    // ─── Agents ──────────────────────────────────
    'agents.new': '+ Nouvel Agent',
    'agents.select': '-- Sélectionner un Agent --',
    'agents.choose': '-- Choisir un Agent --',
    'agents.unlimited': 'Agents illimités',
    'agents.field': 'Agents',
    'agents.none': 'Aucun Agent trouvé',
    'agents.select_one': 'Sélectionnez un Agent',

    // ─── Prospects ───────────────────────────────
    'prospects.none': 'Aucun prospect trouvé',
    'prospects.no_data': 'Aucun prospect dans la base',
    'prospects.no_assigned': 'Aucun prospect affecté',
    'prospects.select_agent_first': 'Cet agent n\'a aucun prospect affecté. Allez dans Affectations d\'abord.',

    // ─── Visits ──────────────────────────────────
    'visits.planned': 'Planifiée',
    'visits.done': 'Effectuée',
    'visits.missed': 'Manquée',
    'visits.completed': 'Terminée',
    'visits.in_progress': 'En cours',
    'visits.none': 'Aucune visite trouvée',
    'visits.all_agents': 'Tous les agents',
    'visits.all_statuses': 'Tous statuts',
    'visits.plan': 'Planifier des visites',
    'visits.create_plan': 'Créer le planning',
    'visits.select_both': 'Sélectionnez un agent et une date',
    'visits.select_prospects': 'Sélectionnez au moins un prospect',
    'visits.delete_confirm': 'Supprimer cette visite du planning ?',
    'visits.today': 'Visites aujourd\'hui',
    'visits.suspect_only': 'Suspectes uniquement',

    // ─── Orders ──────────────────────────────────
    'orders.title': 'Commandes',
    'orders.pending': 'En attente',
    'orders.approved': 'Approuvées',
    'orders.rejected': 'Refusées',
    'orders.all': 'Toutes',
    'orders.validated': 'Validées',

    // ─── Map ─────────────────────────────────────
    'map.last_position': 'Dernière position',
    'map.accuracy': 'Précision',
    'map.heatmap': 'Heatmap',
    'map.hide_heatmap': 'Masquer Heatmap',
    'map.no_agents': 'Aucun agent localisé',

    // ─── Reports ─────────────────────────────────
    'reports.start_date': 'Date début',
    'reports.end_date': 'Date fin',
    'reports.format': 'Format',
    'reports.generate': 'Générer le rapport',
    'reports.file_downloaded': 'Fichier téléchargé avec succès',

    // ─── Leaderboard ─────────────────────────────
    'leaderboard.none': 'Aucune donnée de classement',
    'leaderboard.rank': '#',
    'leaderboard.agent': 'Agent',
    'leaderboard.total_score': 'Score total',
    'leaderboard.today_visits': 'Visites aujourd\'hui',
    'leaderboard.today_score': 'Score du jour',
    'leaderboard.combo': 'Combo',

    // ─── Points ──────────────────────────────────
    'points.add': 'Ajouter des Points',
    'points.penalty': 'Pénalité Manuelle',
    'points.schedule': 'Barème des Points',
    'points.conversion': 'Taux de Conversion',
    'points.conversion_requests': 'Demandes de Conversion',
    'points.reason': 'Raison (optionnel)',
    'points.rate': 'points = 1 {currency}',
    'points.rate_updated': 'Taux mis à jour !',
    'points.apply_penalty': 'Appliquer la pénalité',
    'points.no_requests': 'Aucune demande',
    'points.recalculate': 'Recalculer',

    // ─── Points schedule labels ──────────────────
    'points.order_validated': 'Commande validée',
    'points.short_visit': 'Visite trop courte',
    'points.gps_anomaly': 'Anomalie GPS détectée',
    'points.inactivity': 'Inactivité prolongée',
    'points.out_of_zone': 'Visite hors zone autorisée',
    'points.fraud_repeat': 'Récidive de fraude',

    // ─── Alerts ──────────────────────────────────
    'alerts.none': 'Aucune alerte récente',
    'alerts.no_security': 'Aucune alerte de sécurité',

    // ─── Import ──────────────────────────────────
    'import.title': 'Import IA — Glissez n\'importe quel fichier',
    'import.desc': 'L\'IA analyse automatiquement votre fichier et détecte s\'il s\'agit de prospects, produits ou commandes.',
    'import.formats': 'Formats acceptés : Excel (.xlsx, .xls), CSV, PDF, JSON, TXT',
    'import.drop': 'Cliquez ou glissez votre fichier ici',
    'import.drop_sub': 'N\'importe quel format — l\'IA comprendra',
    'import.analyze': 'Analyser & Importer',
    'import.analyzing': 'L\'IA analyse votre fichier...',
    'import.imported': 'Importé(e)s',
    'import.skipped': 'Ignoré(e)s',
    'import.rows_read': 'Lignes lues',
    'import.confidence': 'Confiance',

    // ─── Trends / Predictions ────────────────────
    'trends.3months': '3 mois',
    'trends.6months': '6 mois',
    'trends.12months': '12 mois',
    'trends.24months': '24 mois',
    'trends.no_data': 'Pas encore de données. Les graphiques apparaîtront avec les premières visites.',
    'predictions.no_data': 'L\'IA a besoin de données historiques pour ses prédictions.',
    'predictions.forecast': 'Prévision IA',
    'predictions.trend': 'Tendance',
    'predictions.under_exploited': 'Sous-exploitée',
    'predictions.exploited': 'Exploitée',
    'predictions.high': 'Élevé',

    // ─── Analytics ───────────────────────────────
    'analytics.no_product_data': 'Aucune donnée produit disponible',
    'analytics.no_agent_data': 'Aucune donnée Agent',
    'analytics.no_zone_data': 'Aucune donnée de zone',
    'analytics.no_decline': 'Aucune baisse significative détectée',

    // ─── Settings ────────────────────────────────
    'settings.gps_saved': 'Planning GPS enregistré avec succès',
    'settings.saved': 'Paramètres sauvegardés avec succès',
    'settings.type_name_min': 'Entrez un nom de type (min 2 caractères)',
    'settings.type_added': 'ajouté avec succès',

    // ─── Password ────────────────────────────────
    'password.min_chars': 'Le nouveau mot de passe doit contenir au moins 6 caractères',
    'password.changed': 'Mot de passe modifié avec succès !',
    'password.mismatch': 'Les mots de passe ne correspondent pas',

    // ─── Update ──────────────────────────────────
    'update.available': 'Mise à jour disponible',
    'update.updating': 'Mise à jour en cours...',
    'update.downloading': 'Téléchargement de la nouvelle version...',
    'update.success': 'Mise à jour terminée avec succès !',

    // ─── Admin ───────────────────────────────────
    'admin.open_panel': 'Ouvrir le Dashboard Admin',
    'admin.new_tenant': '+ Nouvelle Société',
    'admin.no_access': 'Accès réservé aux administrateurs',

    // ─── Subscription ────────────────────────────
    'subscription.upgrade': 'Mettre à niveau',
    'subscription.disabled': 'Disponible dans le forfait Pro',

    // ─── Charts ──────────────────────────────────
    'charts.revenue_evolution': 'Évolution du Chiffre d\'Affaires',
    'charts.revenue_by_product': 'CA par Produit',
    'charts.revenue_by_agent': 'CA par Agent',
    'charts.revenue_by_zone': 'CA par Zone Géographique',
    'charts.order_decline': 'Détection des Baisses de Commandes',
    'charts.revenue_forecast': 'Prévision du CA — Mois en cours',
    'charts.under_exploited_zones': 'Zones Sous-exploitées',
    'charts.order_probability': 'Scoring Probabilité de Commande par Prospect',
    'charts.stock_forecast': 'Prévision de Rupture de Stock',
    'charts.monthly_trend': 'Tendance Mensuelle',
    'charts.daily_perf': 'Performance par Jour',
    'charts.agent_perf': 'Performance Agents',
    'charts.agent_efficiency': 'Efficacité Agents',
    'charts.pareto': 'Analyse Pareto — Produits',
    'charts.commercial_zones': 'Zones Commerciales',
    'charts.rfm': 'Segmentation RFM Clients',
    'charts.top_clients': 'Top 20 Clients',
    'charts.at_risk': 'Clients à Risque',
    'charts.ai_forecast': 'Prévisions IA',
    'charts.top5_agents': 'Top 5 Agents aujourd\'hui',
    'charts.recent_alerts': 'Dernières alertes',
    'charts.dt_per_day': 'DT/jour',
    'charts.orders': 'commandes',

    // ─── Intro ───────────────────────────────────
    'intro.author': 'Développé par le Dr. Slim Lamouchi fondateur d\\'Elyesio',
    'intro.tagline': 'SMART FIELD OPERATIONS',
    'footer.credit': 'Développé par Maydeni AI',
  },

  en: {
    // ─── Nav ─────────────────────────────────────
    'nav.overview': 'Overview',
    'nav.map': 'Live Map',
    'nav.leaderboard': 'Leaderboard',
    'nav.delegues': 'Agents',
    'nav.prospects': 'Prospects',
    'nav.assignments': 'Assignments',
    'nav.planning': 'Planning',
    'nav.visits': 'Visits',
    'nav.alerts': 'Alerts',
    'nav.trends': 'Trends',
    'nav.predictions': 'AI Predictions',
    'nav.analytics': 'Business Analytics',
    'nav.points': 'Points',
    'nav.order-validation': 'Order Validation',
    'nav.import': 'AI Import',
    'nav.subscription': 'Subscription',
    'nav.settings': 'Settings',
    'nav.pending': 'Registrations',
    'nav.payments': 'Payments',
    'nav.tenants': 'Companies',
    'nav.subscriptions': 'Subscriptions',
    'nav.platform': 'Platform',
    'nav.demo-simulation': 'Demo / Simulation',

    // ─── Login ───────────────────────────────────
    'login.title': 'Dashboard Login',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.error': 'Invalid username or password',
    'login.change_password': 'Change my password',
    'login.back': 'Back to login',
    'login.current_password': 'Current password',
    'login.new_password': 'New password',
    'login.confirm_password': 'Confirm new password',
    'login.min_chars': 'Min. 6 characters',
    'login.change_btn': 'Change password',
    'login.admin_id': 'Admin ID',
    'login.admin_code': 'Access code',
    'login.admin_access': 'Access',

    // ─── Section Headers ─────────────────────────
    'section.overview': 'Overview',
    'section.map': 'Live Map',
    'section.leaderboard': 'Leaderboard & Gamification',
    'section.delegues': 'Agent Management',
    'section.prospects': 'Prospects',
    'section.assignments': 'Prospect Assignment',
    'section.planning': 'Visit Planning',
    'section.visits': 'Visits',
    'section.alerts': 'Security Log',
    'section.trends': 'Trends & Price History',
    'section.predictions': 'AI Predictive Dashboard',
    'section.analytics': 'Business Analytics',
    'section.points': 'Points Management',
    'section.order-validation': 'Order Validation',
    'section.import': 'Smart Data Import',
    'section.settings': 'Geofencing Settings',
    'section.subscription': 'My Subscription',
    'section.pending': 'Pending Registrations',
    'section.tenants': 'Company Management',
    'section.subscriptions': 'Plans & Subscriptions',
    'section.platform': 'Platform Overview',
    'section.demo': 'Demo / Simulation',

    // ─── Stats ───────────────────────────────────
    'stat.delegues': 'Active Agents',
    'stat.visits': 'Visits today',
    'stat.suspect': 'Suspect visits',
    'stat.orders': 'Orders',
    'stat.revenue': 'Today\'s revenue',
    'stat.online': 'Online',

    // ─── Common ──────────────────────────────────
    'common.loading': 'Loading...',
    'common.search': 'Search...',
    'common.all_cities': 'All cities',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.export': 'Export',
    'common.generate': 'Generate',
    'common.refresh': 'Refresh',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.deactivate': 'Deactivate',
    'common.activate': 'Activate',
    'common.none': 'None',
    'common.all': 'All',
    'common.disconnect': 'Logout',
    'common.director': 'Director',
    'common.update': 'Update',
    'common.later': 'Later',
    'common.download': 'Download',

    // ─── Agents ──────────────────────────────────
    'agents.new': '+ New Agent',
    'agents.select': '-- Select an agent --',
    'agents.choose': '-- Choose an agent --',
    'agents.unlimited': 'Unlimited agents',
    'agents.field': 'Agents',
    'agents.none': 'No agents found',
    'agents.select_one': 'Select an Agent',

    // ─── Prospects ───────────────────────────────
    'prospects.none': 'No prospects found',
    'prospects.no_data': 'No prospects in database',
    'prospects.no_assigned': 'No prospects assigned',
    'prospects.select_agent_first': 'This agent has no assigned prospects. Go to Assignments first.',

    // ─── Visits ──────────────────────────────────
    'visits.planned': 'Planned',
    'visits.done': 'Completed',
    'visits.missed': 'Missed',
    'visits.completed': 'Completed',
    'visits.in_progress': 'In progress',
    'visits.none': 'No visits found',
    'visits.all_agents': 'All agents',
    'visits.all_statuses': 'All statuses',
    'visits.plan': 'Plan visits',
    'visits.create_plan': 'Create plan',
    'visits.select_both': 'Select an agent and a date',
    'visits.select_prospects': 'Select at least one prospect',
    'visits.delete_confirm': 'Delete this planned visit?',
    'visits.today': 'Visits today',
    'visits.suspect_only': 'Suspect only',

    // ─── Orders ──────────────────────────────────
    'orders.title': 'Orders',
    'orders.pending': 'Pending',
    'orders.approved': 'Approved',
    'orders.rejected': 'Rejected',
    'orders.all': 'All',
    'orders.validated': 'Validated',

    // ─── Map ─────────────────────────────────────
    'map.last_position': 'Last position',
    'map.accuracy': 'Accuracy',
    'map.heatmap': 'Heatmap',
    'map.hide_heatmap': 'Hide Heatmap',
    'map.no_agents': 'No agent localized',

    // ─── Reports ─────────────────────────────────
    'reports.start_date': 'Start date',
    'reports.end_date': 'End date',
    'reports.format': 'Format',
    'reports.generate': 'Generate report',
    'reports.file_downloaded': 'File downloaded successfully',

    // ─── Leaderboard ─────────────────────────────
    'leaderboard.none': 'No ranking data',
    'leaderboard.rank': '#',
    'leaderboard.agent': 'Agent',
    'leaderboard.total_score': 'Total Score',
    'leaderboard.today_visits': 'Visits Today',
    'leaderboard.today_score': 'Today\'s Score',
    'leaderboard.combo': 'Combo',

    // ─── Points ──────────────────────────────────
    'points.add': 'Add Points',
    'points.penalty': 'Manual Penalty',
    'points.schedule': 'Points Schedule',
    'points.conversion': 'Conversion Rate',
    'points.conversion_requests': 'Conversion Requests',
    'points.reason': 'Reason (optional)',
    'points.rate': 'points = 1 {currency}',
    'points.rate_updated': 'Rate updated!',
    'points.apply_penalty': 'Apply penalty',
    'points.no_requests': 'No requests',
    'points.recalculate': 'Recalculate',

    // ─── Points schedule labels ──────────────────
    'points.order_validated': 'Validated order',
    'points.short_visit': 'Short visit',
    'points.gps_anomaly': 'GPS anomaly detected',
    'points.inactivity': 'Extended inactivity',
    'points.out_of_zone': 'Visit out of zone',
    'points.fraud_repeat': 'Repeat fraud',

    // ─── Alerts ──────────────────────────────────
    'alerts.none': 'No recent alerts',
    'alerts.no_security': 'No security alerts',

    // ─── Import ──────────────────────────────────
    'import.title': 'AI Import — Drop any file',
    'import.desc': 'AI automatically analyzes your file and detects if it\'s prospects, products, or orders.',
    'import.formats': 'Accepted formats: Excel (.xlsx, .xls), CSV, PDF, JSON, TXT',
    'import.drop': 'Click or drag your file here',
    'import.drop_sub': 'Any format — AI will understand',
    'import.analyze': 'Analyze & Import',
    'import.analyzing': 'AI is analyzing your file...',
    'import.imported': 'Imported',
    'import.skipped': 'Skipped',
    'import.rows_read': 'Rows read',
    'import.confidence': 'Confidence',

    // ─── Trends / Predictions ────────────────────
    'trends.3months': '3 months',
    'trends.6months': '6 months',
    'trends.12months': '12 months',
    'trends.24months': '24 months',
    'trends.no_data': 'No data yet. Charts will appear with the first visits.',
    'predictions.no_data': 'AI needs historical data for predictions.',
    'predictions.forecast': 'AI Forecast',
    'predictions.trend': 'Trend',
    'predictions.under_exploited': 'Underexploited',
    'predictions.exploited': 'Exploited',
    'predictions.high': 'High',

    // ─── Analytics ───────────────────────────────
    'analytics.no_product_data': 'No product data available',
    'analytics.no_agent_data': 'No Agent data',
    'analytics.no_zone_data': 'No zone data',
    'analytics.no_decline': 'No significant decline detected',

    // ─── Settings ────────────────────────────────
    'settings.gps_saved': 'GPS schedule saved successfully',
    'settings.saved': 'Settings saved successfully',
    'settings.type_name_min': 'Enter a type name (min 2 characters)',
    'settings.type_added': 'added successfully',

    // ─── Password ────────────────────────────────
    'password.min_chars': 'New password must be at least 6 characters',
    'password.changed': 'Password changed successfully!',
    'password.mismatch': 'Passwords do not match',

    // ─── Update ──────────────────────────────────
    'update.available': 'Update available',
    'update.updating': 'Updating...',
    'update.downloading': 'Downloading new version...',
    'update.success': 'Update completed successfully!',

    // ─── Admin ───────────────────────────────────
    'admin.open_panel': 'Open Admin Dashboard',
    'admin.new_tenant': '+ New Company',
    'admin.no_access': 'Admin access only',

    // ─── Subscription ────────────────────────────
    'subscription.upgrade': 'Upgrade',
    'subscription.disabled': 'Available in Pro plan',

    // ─── Charts ──────────────────────────────────
    'charts.revenue_evolution': 'Revenue Evolution',
    'charts.revenue_by_product': 'Revenue by Product',
    'charts.revenue_by_agent': 'Revenue by Agent',
    'charts.revenue_by_zone': 'Revenue by Zone',
    'charts.order_decline': 'Order Decline Detection',
    'charts.revenue_forecast': 'Revenue Forecast — This Month',
    'charts.under_exploited_zones': 'Underexploited Zones',
    'charts.order_probability': 'Order Probability Score per Prospect',
    'charts.stock_forecast': 'Stock Rupture Forecast',
    'charts.monthly_trend': 'Monthly Trend',
    'charts.daily_perf': 'Daily Performance',
    'charts.agent_perf': 'Agent Performance',
    'charts.agent_efficiency': 'Agent Efficiency',
    'charts.pareto': 'Pareto Analysis — Products',
    'charts.commercial_zones': 'Commercial Zones',
    'charts.rfm': 'RFM Client Segmentation',
    'charts.top_clients': 'Top 20 Clients',
    'charts.at_risk': 'At-Risk Clients',
    'charts.ai_forecast': 'AI Forecast',
    'charts.top5_agents': 'Top 5 Agents Today',
    'charts.recent_alerts': 'Recent Alerts',
    'charts.dt_per_day': 'DT/day',
    'charts.orders': 'orders',

    // ─── Intro ───────────────────────────────────
    'intro.author': 'Developed by Dr. Slim Lamouchi founder of Elyesio',
    'intro.tagline': 'SMART FIELD OPERATIONS',
    'footer.credit': 'Powered by Maydeni AI',
  },
};

// ─── i18n Engine ─────────────────────────────────

let currentLang = localStorage.getItem('maydeni_lang') || 'fr';

function t(key) {
  return (LANG[currentLang] && LANG[currentLang][key]) || (LANG.fr[key]) || key;
}

function getLang() {
  return currentLang;
}

function getDateLocale() {
  return currentLang === 'fr' ? 'fr-FR' : 'en-US';
}

function setLang(lang) {
  if (!LANG[lang]) return;
  currentLang = lang;
  localStorage.setItem('maydeni_lang', lang);
  applyTranslations();
  // Dispatch event so dynamic content can re-render
  document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
}

function toggleLang() {
  setLang(currentLang === 'fr' ? 'en' : 'fr');
}

function applyTranslations() {
  // Translate elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });

  // Translate elements with data-i18n-html attribute (allows HTML)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });

  // Update lang attribute
  document.documentElement.lang = currentLang;

  // Update language toggle button text
  const btn = document.getElementById('lang-toggle');
  if (btn) {
    btn.textContent = currentLang === 'fr' ? 'EN' : 'FR';
    btn.title = currentLang === 'fr' ? 'Switch to English' : 'Passer en français';
  }
}
