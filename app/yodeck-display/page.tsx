'use client';

import { useState, useEffect } from 'react';
import { Wifi, Clock, QrCode } from 'lucide-react';
import { getCurrentWifiCode } from '@/lib/utils';

export default function YodeckDisplay() {
  const [code, setCode] = useState<string>('');
  const [nextChange, setNextChange] = useState<string>('');
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  useEffect(() => {
    updateCode();
    generateQRCode();
    const interval = setInterval(updateCode, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(interval);
  }, []);

  const generateQRCode = () => {
    if (typeof window !== 'undefined') {
      const portalUrl = window.location.origin + '/portal';
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(portalUrl)}&color=92400e&bgcolor=fef3c7`;
      setQrCodeUrl(qrUrl);
    }
  };

  const updateCode = () => {
    const currentCode = getCurrentWifiCode();
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    if (!currentCode || day === 0 || hour < 6 || hour >= 20) {
      setCode('FERMÉ');
      setStatus('closed');
      setNextChange('Ouverture à 6h00');
    } else {
      setCode(currentCode);
      setStatus('open');
      const nextHour = hour < 12 ? 12 : 20;
      setNextChange(`Prochain changement à ${nextHour}h00`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 flex items-center justify-center p-4 lg:p-8 overflow-hidden">
      <div className="text-center w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <div className="text-6xl lg:text-9xl mb-4 lg:mb-8 animate-pulse">🥐</div>
          <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent mb-4 lg:mb-6 px-2 break-words">
            WiFi Boulangerie
          </h1>
          <p className="text-2xl lg:text-4xl text-amber-800 font-semibold px-2">
            Code d'accès du jour
          </p>
        </div>
        
        {/* Main content with code and QR side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-8 lg:mb-12">
          {/* Code WiFi */}
          <div className={`bg-white rounded-2xl lg:rounded-3xl shadow-2xl p-8 lg:p-16 border-4 ${
            status === 'closed' ? 'border-gray-300 bg-gray-100' : 'border-amber-400'
          }`}>
            <div className="mb-4">
              <p className="text-xl lg:text-2xl text-gray-600 mb-2">Code WiFi</p>
            </div>
            <div className={`font-bold mb-6 px-2 whitespace-nowrap text-5xl sm:text-6xl md:text-7xl lg:text-8xl ${
              status === 'closed' ? 'text-gray-500' : 'bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent'
            }`}>
              {code}
            </div>
            <div className="flex items-center justify-center text-amber-700 flex-wrap gap-2">
              <Clock className="w-6 lg:w-8 h-6 lg:h-8" />
              <span className="text-lg lg:text-2xl font-medium break-words">{nextChange}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className={`bg-white rounded-2xl lg:rounded-3xl shadow-2xl p-8 lg:p-16 border-4 flex flex-col items-center justify-center ${
            status === 'closed' ? 'border-gray-300 bg-gray-100' : 'border-blue-400'
          }`}>
            <div className="mb-6">
              <QrCode className={`w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-4 ${
                status === 'closed' ? 'text-gray-500' : 'text-blue-600'
              }`} />
              <p className="text-xl lg:text-2xl text-gray-600 font-semibold">Scannez-moi !</p>
            </div>
            
            {status === 'open' && qrCodeUrl ? (
              <div className="bg-amber-50 p-4 lg:p-6 rounded-2xl shadow-inner">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code WiFi" 
                  className="w-48 h-48 lg:w-64 lg:h-64 mx-auto"
                />
              </div>
            ) : (
              <div className="bg-gray-100 p-4 lg:p-6 rounded-2xl w-48 h-48 lg:w-64 lg:h-64 flex items-center justify-center">
                <p className="text-gray-500 text-center">Fermé</p>
              </div>
            )}
            
            <p className="text-lg lg:text-xl text-gray-600 mt-6 text-center px-2">
              📱 Accès direct avec votre téléphone
            </p>
          </div>
        </div>
        
        {/* Instructions */}
        {status === 'open' && (
          <div className="space-y-6 px-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border-2 border-amber-300">
              <h3 className="text-2xl lg:text-3xl font-bold text-amber-800 mb-6">2 façons de se connecter</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1 */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-600 text-white rounded-full w-10 lg:w-12 h-10 lg:h-12 flex items-center justify-center font-bold text-xl lg:text-2xl flex-shrink-0">
                      1
                    </div>
                    <div className="text-left">
                      <h4 className="text-xl lg:text-2xl font-bold text-amber-900 mb-3">Avec le code</h4>
                      <ol className="text-base lg:text-lg text-gray-700 space-y-2">
                        <li>✓ Connectez-vous au réseau "WiFi-Boulangerie"</li>
                        <li>✓ Entrez le code <span className="font-bold text-amber-700">{code}</span></li>
                        <li>✓ Profitez de 3h d'accès gratuit</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Option 2 */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-10 lg:w-12 h-10 lg:h-12 flex items-center justify-center font-bold text-xl lg:text-2xl flex-shrink-0">
                      2
                    </div>
                    <div className="text-left">
                      <h4 className="text-xl lg:text-2xl font-bold text-blue-900 mb-3">Avec le QR code</h4>
                      <ol className="text-base lg:text-lg text-gray-700 space-y-2">
                        <li>✓ Ouvrez l'appareil photo de votre téléphone</li>
                        <li>✓ Scannez le QR code ci-dessus</li>
                        <li>✓ Remplissez le formulaire en ligne</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {status === 'closed' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border-2 border-gray-300 px-4">
            <p className="text-2xl lg:text-3xl text-gray-600 font-medium">
              Le WiFi est actuellement fermé
            </p>
            <p className="text-lg lg:text-2xl text-gray-500 mt-4">
              Ouverture du lundi au dimanche de 6h à 20h
            </p>
          </div>
        )}
        
        {/* Footer info */}
        <div className="mt-6 lg:mt-8 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-amber-700 flex-wrap px-2">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 lg:w-6 h-5 lg:h-6 flex-shrink-0" />
            <span className="text-base lg:text-lg">3h d'accès gratuit</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 lg:w-6 h-5 lg:h-6 flex-shrink-0" />
            <span className="text-base lg:text-lg">Rafraîchissement auto : 30s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
