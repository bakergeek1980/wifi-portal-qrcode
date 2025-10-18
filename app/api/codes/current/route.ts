// /app/api/codes/current/route.ts

import { NextResponse } from 'next/server';
// 1. Correction du nom de la fonction importée
import { getCurrentWifiCode } from '@/lib/utils';

export async function GET() {
  try {
    // 2. Appel de la fonction correcte
    const code = getCurrentWifiCode();
    
    // 3. Logique pour gérer la réponse (string ou null)
    if (code) {
      // Si un code est retourné, le service est ouvert
      return NextResponse.json({
        code: code,
        status: 'open'
        // Note: les propriétés 'period' et 'nextChange' ne sont pas
        // retournées par votre fonction, donc elles sont omises ici.
      });
    } else {
      // Si null est retourné, le service est fermé
      return NextResponse.json({
        code: null,
        status: 'closed'
      });
    }

  } catch (error) {
    console.error('Error getting current code:', error);
    return NextResponse.json(
      { error: 'Error retrieving current code' },
      { status: 500 }
    );
  }
}