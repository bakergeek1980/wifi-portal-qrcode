import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    console.log(`Traduction vers ${targetLang}: "${text.substring(0, 50)}..."`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLang: 'fr',
        targetLangs: [targetLang]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data[targetLang] || text;
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error);
    return text;
  }
}

export async function GET(request: NextRequest) {
  console.log('========= GET MESSAGES TRANSLATE API =========');
  
  try {
    console.log('Récupération de tous les messages...');
    
    const { data, error } = await supabaseAdmin
      .from('custom_messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('ERREUR SUPABASE:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des messages' },
        { status: 500 }
      );
    }
    
    console.log(`SUCCÈS: ${data?.length || 0} messages récupérés`);
    return NextResponse.json(data || []);
    
  } catch (error) {
    console.error('ERREUR CATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('========= POST MESSAGE TRANSLATE API =========');
  
  try {
    const body = await request.json();
    const { titre, message_fr, type_message, date_debut, date_fin, actif, cible_langue, priorite } = body;
    
    console.log('DONNÉES REÇUES:', { titre, message_fr, type_message });
    
    if (!titre || !message_fr) {
      console.log('ERREUR: Titre ou message_fr manquant');
      return NextResponse.json(
        { error: 'Titre et message en français sont requis' },
        { status: 400 }
      );
    }
    
    console.log('DÉBUT DES TRADUCTIONS AUTOMATIQUES...');
    
    const [message_en, message_de, message_it] = await Promise.all([
      translateText(message_fr, 'en'),
      translateText(message_fr, 'de'),
      translateText(message_fr, 'it')
    ]);
    
    console.log('TRADUCTIONS COMPLÉTÉES');
    
    const newMessage = {
      titre,
      message_fr,
      message_en,
      message_de,
      message_it,
      type_message: type_message || 'general',
      date_debut: date_debut ? new Date(date_debut).toISOString() : null,
      date_fin: date_fin ? new Date(date_fin).toISOString() : null,
      actif: actif !== false,
      cible_langue: cible_langue || 'all',
      priorite: priorite || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('INSERTION EN BASE DE DONNÉES...');
    
    const { data, error } = await supabaseAdmin
      .from('custom_messages')
      .insert([newMessage])
      .select()
      .single();
    
    if (error) {
      console.error('ERREUR SUPABASE:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création du message' },
        { status: 500 }
      );
    }
    
    console.log('SUCCÈS: Message créé avec ID:', data?.id);
    
    return NextResponse.json({
      success: true,
      message: data
    }, { status: 201 });
    
  } catch (error) {
    console.error('ERREUR CATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('========= PUT MESSAGE TRANSLATE API =========');
  
  try {
    const body = await request.json();
    const { id, titre, message_fr, type_message, date_debut, date_fin, actif, cible_langue, priorite } = body;
    
    console.log('DONNÉES REÇUES:', { id, titre, message_fr });
    
    if (!id) {
      console.log('ERREUR: ID du message manquant');
      return NextResponse.json(
        { error: 'ID du message est requis' },
        { status: 400 }
      );
    }
    
    if (!titre || !message_fr) {
      console.log('ERREUR: Titre ou message_fr manquant');
      return NextResponse.json(
        { error: 'Titre et message en français sont requis' },
        { status: 400 }
      );
    }
    
    console.log('DÉBUT DES RETRADUCTIONS...');
    
    const [message_en, message_de, message_it] = await Promise.all([
      translateText(message_fr, 'en'),
      translateText(message_fr, 'de'),
      translateText(message_fr, 'it')
    ]);
    
    console.log('RETRADUCTIONS COMPLÉTÉES');
    
    const updatedMessage = {
      titre,
      message_fr,
      message_en,
      message_de,
      message_it,
      type_message: type_message || 'general',
      date_debut: date_debut ? new Date(date_debut).toISOString() : null,
      date_fin: date_fin ? new Date(date_fin).toISOString() : null,
      actif: actif !== false,
      cible_langue: cible_langue || 'all',
      priorite: priorite || 0,
      updated_at: new Date().toISOString()
    };
    
    console.log('MISE À JOUR EN BASE DE DONNÉES...');
    
    const { data, error } = await supabaseAdmin
      .from('custom_messages')
      .update(updatedMessage)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('ERREUR SUPABASE:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la modification du message' },
        { status: 500 }
      );
    }
    
    console.log('SUCCÈS: Message modifié');
    
    return NextResponse.json({
      success: true,
      message: data
    });
    
  } catch (error) {
    console.error('ERREUR CATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log('========= DELETE MESSAGE TRANSLATE API =========');
  
  try {
    const body = await request.json();
    const { id } = body;
    
    console.log('ID À SUPPRIMER:', id);
    
    if (!id) {
      console.log('ERREUR: ID du message manquant');
      return NextResponse.json(
        { error: 'ID du message est requis' },
        { status: 400 }
      );
    }
    
    console.log('SUPPRESSION DU MESSAGE ID:', id);
    
    const { error } = await supabaseAdmin
      .from('custom_messages')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('ERREUR SUPABASE:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du message' },
        { status: 500 }
      );
    }
    
    console.log('SUCCÈS: Message supprimé');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('ERREUR CATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}