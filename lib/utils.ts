// Configuration par défaut
const DEFAULT_CONFIG = {
  openHour: 6,
  closeHour: 20,
  days: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true
  }
};

// Cache pour éviter trop d'appels à Supabase
let configCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getWifiConfig() {
  // Vérifier le cache
  if (configCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return configCache;
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    const { data, error } = await supabaseAdmin
      .from('app_config')
      .select('cle, valeur')
      .in('cle', ['wifi_open_hour', 'wifi_close_hour', 'wifi_days']);

    if (error || !data) {
      console.warn('Erreur récupération config, utilisation des valeurs par défaut');
      return DEFAULT_CONFIG;
    }

    let config = { ...DEFAULT_CONFIG };

    data.forEach((item: { cle: string; valeur: string }) => {
      if (item.cle === 'wifi_open_hour') {
        config.openHour = parseInt(item.valeur) || DEFAULT_CONFIG.openHour;
      }
      if (item.cle === 'wifi_close_hour') {
        config.closeHour = parseInt(item.valeur) || DEFAULT_CONFIG.closeHour;
      }
      if (item.cle === 'wifi_days') {
        try {
          config.days = JSON.parse(item.valeur);
        } catch (e) {
          console.error('Erreur parsing jours:', e);
        }
      }
    });

    // Mettre en cache
    configCache = config;
    cacheTimestamp = Date.now();

    return config;
  } catch (error) {
    console.error('Erreur chargement config:', error);
    return DEFAULT_CONFIG;
  }
}

// Fonction principale pour générer le code WiFi automatiquement
export async function getCurrentWifiCode() {
  const config = await getWifiConfig();
  
  // Utilise le fuseau horaire de la Suisse (Europe/Zurich)
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  const hour = now.getHours();
  const day = now.getDay();
  
  // Vérifier les jours d'ouverture
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayName = dayNames[day];
  const isDayOpen = config.days[currentDayName as keyof typeof config.days];
  
  // Vérifier les heures d'ouverture
  const isTimeOpen = hour >= config.openHour && hour < config.closeHour;
  
  if (!isDayOpen || !isTimeOpen) {
    return null; // Pas de code disponible
  }
  
  // Déterminer la période (matin ou après-midi)
  const midPoint = 12; // Changement de code à midi
  const period = hour < midPoint ? 'morning' : 'afternoon';
  const seed = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${period}`;
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Générer un code à 6 chiffres
  const code = Math.abs(hash % 900000 + 100000).toString();
  
  return code;
}

// Fonction pour obtenir l'objet code complet
export async function getCurrentCode() {
  const config = await getWifiConfig();
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  const hour = now.getHours();
  const day = now.getDay();
  const code = await getCurrentWifiCode();
  
  const period = hour < 12 ? 'morning' : 'afternoon';
  
  // Calculer le prochain changement
  let nextChange = new Date(now);
  if (hour < 12) {
    // Si le matin, le prochain changement est à midi
    nextChange.setHours(12, 0, 0, 0);
  } else if (hour < config.closeHour) {
    // Si l'après-midi mais avant fermeture, le prochain changement est demain matin
    nextChange.setDate(nextChange.getDate() + 1);
    nextChange.setHours(config.openHour, 0, 0, 0);
  } else {
    // Si après les heures de fermeture, le prochain changement est demain matin
    nextChange.setDate(nextChange.getDate() + 1);
    nextChange.setHours(config.openHour, 0, 0, 0);
  }
  
  return {
    code: code || '',
    status: code ? 'available' : 'closed',
    period: period,
    nextChange: nextChange
  };
}

// Fonction pour obtenir le mois courant
export function getCurrentMonth() {
  const now = new Date();
  return now.getMonth() + 1;
}

// Fonction pour valider un code
export async function isValidWifiCode(inputCode: string): Promise<boolean> {
  const currentCode = await getCurrentWifiCode();
  
  if (!currentCode) {
    return false; // WiFi fermé
  }
  
  return inputCode === currentCode;
}

// Fonctions utilitaires
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function getConfig(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase');
    const { data, error } = await supabaseAdmin
      .from('app_config')
      .select('valeur')
      .eq('cle', key)
      .single();
    
    if (error || !data) {
      return defaultValue;
    }
    return data.valeur;
  } catch (error) {
    console.error('Erreur récupération config:', error);
    return defaultValue;
  }
}