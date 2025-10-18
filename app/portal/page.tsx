'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { isValidEmail, sanitizeInput } from '@/lib/utils';

const translations = {
  fr: {
    title: 'Bienvenue',
    subtitle: 'Connectez-vous gratuitement',
    welcomeBack: 'Bon retour',
    quickConnect: 'Connexion rapide',
    prenom: 'Prénom',
    email: 'Email',
    birth: 'Date de naissance (optionnel)',
    consent: 'J\'accepte que mes données soient collectées conformément au',
    consentLink: 'RGPD',
    submit: 'Continuer',
    code: 'Code WiFi (6 chiffres)',
    codeHint: 'Regardez l\'écran pour voir le code',
    connect: 'Se connecter',
    success: 'Connexion réussie !',
    successMsg: 'Vous êtes maintenant connecté pour 3 heures',
    errorConsent: 'Vous devez accepter les conditions RGPD',
    errorCode: 'Code incorrect',
    errorEmail: 'Email invalide',
    errorRequired: 'Ce champ est requis',
    newDevice: 'Nouvel appareil ?',
    rgpdTitle: 'Politique RGPD',
    rgpdSubtitle: 'Protection des données personnelles',
    backToLogin: 'Retour à la connexion',
    understood: 'J\'ai lu et compris'
  },
  en: {
    title: 'Welcome',
    subtitle: 'Connect for free',
    welcomeBack: 'Welcome back',
    quickConnect: 'Quick connect',
    prenom: 'First name',
    email: 'Email',
    birth: 'Birth date (optional)',
    consent: 'I accept that my data is collected in accordance with',
    consentLink: 'GDPR',
    submit: 'Continue',
    code: 'WiFi Code (6 digits)',
    codeHint: 'Look at the screen for the code',
    connect: 'Connect',
    success: 'Connection successful!',
    successMsg: 'You are now connected for 3 hours',
    errorConsent: 'You must accept GDPR terms',
    errorCode: 'Incorrect code',
    errorEmail: 'Invalid email',
    errorRequired: 'This field is required',
    newDevice: 'New device?',
    rgpdTitle: 'GDPR Policy',
    rgpdSubtitle: 'Personal data protection',
    backToLogin: 'Back to login',
    understood: 'I have read and understood'
  },
  de: {
    title: 'Willkommen',
    subtitle: 'Kostenlos verbinden',
    welcomeBack: 'Willkommen zurück',
    quickConnect: 'Schnellverbindung',
    prenom: 'Vorname',
    email: 'E-Mail',
    birth: 'Geburtsdatum (optional)',
    consent: 'Ich akzeptiere, dass meine Daten gemäß',
    consentLink: 'DSGVO',
    submit: 'Weiter',
    code: 'WiFi-Code (6 Ziffern)',
    codeHint: 'Schauen Sie auf den Bildschirm für den Code',
    connect: 'Verbinden',
    success: 'Verbindung erfolgreich!',
    successMsg: 'Sie sind jetzt für 3 Stunden verbunden',
    errorConsent: 'Sie müssen die DSGVO-Bedingungen akzeptieren',
    errorCode: 'Falscher Code',
    errorEmail: 'Ungültige E-Mail',
    errorRequired: 'Dieses Feld ist erforderlich',
    newDevice: 'Neues Gerät?',
    rgpdTitle: 'DSGVO-Politik',
    rgpdSubtitle: 'Schutz personenbezogener Daten',
    backToLogin: 'Zurück zum Login',
    understood: 'Ich habe gelesen und verstanden'
  },
  it: {
    title: 'Benvenuto',
    subtitle: 'Connettiti gratuitamente',
    welcomeBack: 'Ben tornato',
    quickConnect: 'Connessione rapida',
    prenom: 'Nome',
    email: 'Email',
    birth: 'Data di nascita (opzionale)',
    consent: 'Accetto che i miei dati siano raccolti in conformità con',
    consentLink: 'GDPR',
    submit: 'Continua',
    code: 'Codice WiFi (6 cifre)',
    codeHint: 'Guarda lo schermo per il codice',
    connect: 'Connetti',
    success: 'Connessione riuscita!',
    successMsg: 'Ora sei connesso per 3 ore',
    errorConsent: 'Devi accettare i termini GDPR',
    errorCode: 'Codice errato',
    errorEmail: 'Email non valida',
    errorRequired: 'Questo campo è obbligatorio',
    newDevice: 'Nuovo dispositivo?',
    rgpdTitle: 'Politica GDPR',
    rgpdSubtitle: 'Protezione dei dati personali',
    backToLogin: 'Torna al login',
    understood: 'Ho letto e compreso'
  }
};

export default function Portal() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'loading' | 'returning' | 'form' | 'code' | 'success' | 'rgpd'>('loading');
  const [lang, setLang] = useState<'fr' | 'en' | 'de' | 'it'>('fr');
  const [returningUser, setReturningUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    prenom: '',
    email: '',
    dateNaissance: '',
    consentement: false
  });
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [rgpdContent, setRgpdContent] = useState('');

  // Paramètres TP-Link
  const [tpLinkParams, setTpLinkParams] = useState({
    clientMac: '',
    clientIp: '',
    redirectUrl: '',
    apMac: '',
    site: '',
    radioId: '',
    t: ''
  });

  const t = translations[lang];

  useEffect(() => {
    // Récupérer les paramètres TP-Link de l'URL
    const clientMac = searchParams.get('clientMac') || '';
    const clientIp = searchParams.get('clientIp') || '';
    const redirectUrl = searchParams.get('redirectUrl') ? decodeURIComponent(searchParams.get('redirectUrl')!) : '';
    const apMac = searchParams.get('apMac') || '';
    const site = searchParams.get('site') || '';
    const radioId = searchParams.get('radioId') || '';
    const tParam = searchParams.get('t') || '';

    setTpLinkParams({
      clientMac,
      clientIp,
      redirectUrl,
      apMac,
      site,
      radioId,
      t: tParam
    });

    console.log('Paramètres TP-Link reçus:', { clientMac, clientIp, redirectUrl });

    checkReturningUser(clientMac);
    fetchRGPDContent();
  }, [searchParams]);

  const fetchRGPDContent = async () => {
    try {
      const response = await fetch('/api/rgpd');
      if (response.ok) {
        const data = await response.json();
        setRgpdContent(data.content);
      }
    } catch (error) {
      console.error('Error fetching RGPD content:', error);
      setRgpdContent(`Politique de confidentialité et protection des données

En vous connectant à notre réseau WiFi, vous acceptez que nous collections certaines données personnelles conformément au RGPD.

Pour plus d'informations, contactez-nous.`);
    }
  };

  const checkReturningUser = async (clientMac: string) => {
    try {
      const storedMac = getStoredMacAddress();
      
      if (storedMac || clientMac) {
        const macToCheck = clientMac || storedMac;
        const response = await fetch('/api/users/check-mac', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ macAddress: macToCheck })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            setReturningUser(data.user);
            setUserId(data.user.id);
            setLang(data.user.langue || 'fr');
            setStep('returning');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking returning user:', error);
    }
    
    setStep('form');
  };

  const getStoredMacAddress = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('device_mac') || null;
    }
    return null;
  };

  const generateDeviceId = (): string => {
    if (tpLinkParams.clientMac) {
      return tpLinkParams.clientMac;
    }

    const nav = window.navigator;
    const screen = window.screen;
    let deviceId = nav.userAgent + screen.height + screen.width + screen.colorDepth;
    
    let hash = 0;
    for (let i = 0; i < deviceId.length; i++) {
      const char = deviceId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return 'MAC-' + Math.abs(hash).toString(16).toUpperCase();
  };

  const handleSubmitForm = async () => {
    setError('');

    if (!formData.prenom.trim()) {
      setError(t.errorRequired);
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError(t.errorEmail);
      return;
    }
    if (!formData.consentement) {
      setError(t.errorConsent);
      return;
    }

    setLoading(true);

    try {
      const macAddress = generateDeviceId();
      
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: sanitizeInput(formData.prenom),
          email: formData.email.toLowerCase(),
          dateNaissance: formData.dateNaissance || null,
          langue: lang,
          consentement: formData.consentement,
          macAddress
        })
      });

      const data = await response.json();

      if (response.ok) {
        setUserId(data.userId);
        localStorage.setItem('device_mac', macAddress);
        setStep('code');
      } else {
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConnect = () => {
    setStep('code');
  };

  const handleNewDevice = () => {
    localStorage.removeItem('device_mac');
    setReturningUser(null);
    setStep('form');
  };

  const handleSubmitCode = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeInput,
          userId,
          clientMac: tpLinkParams.clientMac || generateDeviceId(),
          clientIp: tpLinkParams.clientIp
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
        const redirectUrl = data.redirectUrl || tpLinkParams.redirectUrl || 'https://www.lapromenade.ch';
        console.log('Redirection vers:', redirectUrl);
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 3000);
      } else {
        setError(data.error || t.errorCode);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'rgpd') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-amber-200">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6">
              <button
                onClick={() => setStep('form')}
                className="flex items-center text-white hover:text-amber-100 transition mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {t.backToLogin}
              </button>
              <div className="flex items-center justify-center">
                <Shield className="w-12 h-12 text-white mr-4" />
                <div>
                  <h1 className="text-3xl font-bold text-white">{t.rgpdTitle}</h1>
                  <p className="text-amber-100">{t.rgpdSubtitle}</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {rgpdContent || 'Chargement de la politique RGPD...'}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep('form')}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition shadow-lg"
                >
                  {t.understood}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🥐</div>
          <p className="text-amber-700 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fade-in border-2 border-amber-200">
        <div className="flex justify-end mb-4 gap-2">
          {(['fr', 'en', 'de', 'it'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded transition ${
                lang === l
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🥐</div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
            {returningUser && step === 'returning' ? t.welcomeBack : t.title}
          </h2>
          <p className="text-amber-700 font-medium">
            {returningUser && step === 'returning' 
              ? `${returningUser.prenom} !` 
              : t.subtitle
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 'returning' && returningUser && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-4">
              <p className="text-green-800 text-center font-semibold">
                ✅ Appareil reconnu
              </p>
              <p className="text-green-700 text-sm text-center mt-1">
                Vous avez déjà utilisé ce WiFi avec cet appareil
              </p>
            </div>

            <button
              onClick={handleQuickConnect}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition shadow-lg"
            >
              ⚡ {t.quickConnect}
            </button>

            <button
              onClick={handleNewDevice}
              className="w-full bg-amber-100 text-amber-800 py-2 rounded-lg text-sm hover:bg-amber-200 transition"
            >
              {t.newDevice}
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder={t.prenom}
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-500 bg-white"
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder={t.email}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-500 bg-white"
                required
              />
            </div>
            <div>
              <input
                type="date"
                placeholder={t.birth}
                value={formData.dateNaissance}
                onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
              />
            </div>
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consentement}
                onChange={(e) => setFormData({ ...formData, consentement: e.target.checked })}
                className="mt-1 mr-3 w-5 h-5 accent-amber-600"
                required
              />
              <span className="text-sm text-gray-600">
                {t.consent}{' '}
                <button
                  type="button"
                  onClick={() => setStep('rgpd')}
                  className="text-amber-600 hover:text-amber-700 underline font-semibold"
                >
                  {t.consentLink}
                </button>
              </span>
            </label>
            <button
              onClick={handleSubmitForm}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : t.submit}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4 text-center font-medium">{t.codeHint}</p>
            <div>
              <input
                type="text"
                placeholder={t.code}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg text-center text-3xl tracking-widest focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-900 placeholder-amber-400 bg-amber-50 font-bold"
                maxLength={6}
                autoFocus
              />
            </div>
            <button
              onClick={handleSubmitCode}
              disabled={loading || codeInput.length !== 6}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Vérification...' : t.connect}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{t.success}</h3>
            <p className="text-gray-600">{t.successMsg}</p>
            <div className="animate-pulse text-sm text-gray-500">
              Redirection en cours...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}