import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentMonth } from '@/lib/utils';

export async function POST(request: NextRequest) {
  console.log('========= POST LOTTERY EXECUTE API =========');
  
  try {
    const body = await request.json();
    const mois = body.mois || getCurrentMonth();
    const annee = body.annee || new Date().getFullYear();
    const lot = body.lot;
    
    console.log('PARAMÈTRES:', { mois, annee, lot });
    
    // Vérifier si un tirage existe déjà pour ce mois
    const { data: existing } = await supabaseAdmin
      .from('lotteries')
      .select('id')
      .eq('mois', mois)
      .eq('annee', annee)
      .single();
    
    if (existing) {
      console.log('ERREUR: Un tirage existe déjà pour ce mois');
      return NextResponse.json(
        { error: 'Un tirage existe déjà pour ce mois' },
        { status: 400 }
      );
    }
    
    console.log('Récupération des utilisateurs éligibles...');
    
    // Récupérer tous les utilisateurs éligibles (avec consentement)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('wifi_users')
      .select('id, prenom, email, langue')
      .eq('consentement', true);
    
    if (usersError || !users || users.length === 0) {
      console.log('ERREUR: Aucun participant éligible');
      return NextResponse.json(
        { error: 'Aucun participant éligible' },
        { status: 400 }
      );
    }
    
    console.log('Participants trouvés:', users.length);
    
    // Sélectionner un gagnant aléatoire
    const winner = users[Math.floor(Math.random() * users.length)];
    console.log('Gagnant sélectionné:', winner.prenom);
    
    // Récupérer le lot par défaut si non spécifié
    const { data: configLot } = await supabaseAdmin
      .from('app_config')
      .select('valeur')
      .eq('cle', 'lot_par_defaut')
      .single();
    
    const prizeLot = lot || configLot?.valeur || 'Café croissant offert';
    console.log('Lot du tirage:', prizeLot);
    
    // Créer l'entrée du tirage
    console.log('Création du tirage en base de données...');
    
    const { data: lottery, error: lotteryError } = await supabaseAdmin
      .from('lotteries')
      .insert({
        mois,
        annee,
        gagnant_id: winner.id,
        lot: prizeLot,
        participants_count: users.length
      })
      .select()
      .single();
    
    if (lotteryError) {
      console.error('ERREUR SUPABASE:', lotteryError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du tirage' },
        { status: 500 }
      );
    }
    
    console.log('SUCCÈS: Tirage créé avec ID:', lottery?.id);
    
    // Envoyer email au gagnant (asynchrone)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'lottery_winner',
        userId: winner.id,
        email: winner.email,
        prenom: winner.prenom,
        langue: winner.langue,
        lot: prizeLot
      })
    })
      .then(() => {
        console.log('Email envoyé au gagnant');
        return supabaseAdmin
          .from('lotteries')
          .update({ 
            email_envoye: true, 
            date_envoi_email: new Date().toISOString() 
          })
          .eq('id', lottery.id);
      })
      .catch(err => console.error('Erreur envoi email:', err));
    
    return NextResponse.json({
      success: true,
      lottery,
      winner: {
        id: winner.id,
        prenom: winner.prenom,
        email: winner.email
      },
      lot: prizeLot,
      participants: users.length
    });
    
  } catch (error) {
    console.error('ERREUR CATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}