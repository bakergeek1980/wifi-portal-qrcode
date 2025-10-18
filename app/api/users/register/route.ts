import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { prenom, email, dateNaissance, langue, consentement, macAddress } = await request.json();
    
    // Validation
    if (!consentement) {
      return NextResponse.json(
        { error: 'GDPR consent required' },
        { status: 400 }
      );
    }
    
    if (!prenom || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Vérifier si l'utilisateur existe déjà par email
    const { data: existingByEmail } = await supabaseAdmin
      .from('wifi_users')
      .select('id, adresse_mac')
      .eq('email', email)
      .single();
    
    if (existingByEmail) {
      // Mettre à jour l'adresse MAC si elle a changé
      if (macAddress && existingByEmail.adresse_mac !== macAddress) {
        await supabaseAdmin
          .from('wifi_users')
          .update({ adresse_mac: macAddress })
          .eq('id', existingByEmail.id);
      }
      
      return NextResponse.json({
        success: true,
        userId: existingByEmail.id,
        existing: true
      });
    }
    
    // Vérifier si l'utilisateur existe par adresse MAC
    if (macAddress) {
      const { data: existingByMac } = await supabaseAdmin
        .from('wifi_users')
        .select('id')
        .eq('adresse_mac', macAddress)
        .single();
      
      if (existingByMac) {
        // Mettre à jour les infos de l'utilisateur
        await supabaseAdmin
          .from('wifi_users')
          .update({
            prenom,
            email,
            date_anniversaire: dateNaissance || null,
            langue: langue || 'fr',
            consentement,
            consentement_date: new Date().toISOString()
          })
          .eq('id', existingByMac.id);
        
        return NextResponse.json({
          success: true,
          userId: existingByMac.id,
          existing: true
        });
      }
    }
    
    // Créer le nouvel utilisateur
    const { data: user, error } = await supabaseAdmin
      .from('wifi_users')
      .insert({
        prenom,
        email,
        date_anniversaire: dateNaissance || null,
        langue: langue || 'fr',
        consentement,
        consentement_date: new Date().toISOString(),
        adresse_mac: macAddress || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Error during registration' },
        { status: 500 }
      );
    }
    
    // Envoyer email de bienvenue (asynchrone, ne pas attendre)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome',
        userId: user.id,
        email: user.email,
        prenom: user.prenom,
        langue: user.langue
      })
    }).catch(err => console.error('Error sending welcome email:', err));
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      existing: false
    });
  } catch (error) {
    console.error('Error in user registration:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}