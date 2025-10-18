'use client';

import Link from 'next/link';
import { Wifi, Settings, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-8">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          🍵 WiFi Tea-Room
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Portail Captif - Système de Gestion WiFi
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/yodeck-display"
            className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <Globe className="w-16 h-16 mx-auto text-amber-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Affichage Yodeck
            </h2>
            <p className="text-gray-600">
              Code du jour sur écran
            </p>
          </Link>
          
          <Link
            href="/portal"
            className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <Wifi className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Portail Utilisateur
            </h2>
            <p className="text-gray-600">
              Connexion client
            </p>
          </Link>
          
          <Link
            href="/admin"
            className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <Settings className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Administration
            </h2>
            <p className="text-gray-600">
              Gestion & statistiques
            </p>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Version 1.0.0 - © 2025 Tea-Room</p>
        </div>
      </div>
    </div>
  );
}