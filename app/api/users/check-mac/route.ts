import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { macAddress } = await request.json();
    
    if (!macAddress) {
      return NextResponse.json(
        { exists: false },
        { status: 400 }
      );
    }
    
    // Chercher l'utilisateur avec cette adresse MAC
    const { data: user, error } = await supabaseAdmin
      .from('wifi_users')
      .select('id, prenom, email, langue, consentement')
      .eq('adresse_mac', macAddress)
      .eq('consentement', true)
      .single();
    
    if (error || !user) {
      return NextResponse.json({
        exists: false
      });
    }
    
    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        prenom: user.prenom,
        email: user.email,
        langue: user.langue
      }
    });
  } catch (error) {
    console.error('Error checking MAC address:', error);
    return NextResponse.json(
      { exists: false },
      { status: 500 }
    );
  }
}