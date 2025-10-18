import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface AppConfig {
  cle: string;
  valeur: string;
}

export async function GET() {
  try {
    console.log('========= GET WIFI HOURS =========');

    // Récupérer les horaires
    const { data, error } = await supabaseAdmin
      .from('app_config')
      .select('cle, valeur')
      .in('cle', ['wifi_open_hour', 'wifi_close_hour', 'wifi_days']);

    if (error) {
      console.error('Erreur:', error);
      return NextResponse.json(
        { error: 'Erreur récupération horaires' },
        { status: 500 }
      );
    }

    // Parser les données
    let wifiHours = {
      openHour: 6,
      closeHour: 20,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    };

    data?.forEach((item: AppConfig) => {
      if (item.cle === 'wifi_open_hour') {
        wifiHours.openHour = parseInt(item.valeur) || 6;
      }
      if (item.cle === 'wifi_close_hour') {
        wifiHours.closeHour = parseInt(item.valeur) || 20;
      }
      if (item.cle === 'wifi_days') {
        try {
          const days = JSON.parse(item.valeur);
          wifiHours = { ...wifiHours, ...days };
        } catch (e) {
          console.error('Erreur parsing days:', e);
        }
      }
    });

    console.log('Horaires récupérés:', wifiHours);

    return NextResponse.json(wifiHours);

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('========= POST WIFI HOURS =========');

    const body = await request.json();
    const { openHour, closeHour, monday, tuesday, wednesday, thursday, friday, saturday, sunday } = body;

    console.log('Données reçues:', body);

    // Valider les heures
    if (openHour < 0 || openHour > 23 || closeHour < 0 || closeHour > 23) {
      return NextResponse.json(
        { error: 'Heures invalides' },
        { status: 400 }
      );
    }

    // Sauvegarder les heures d'ouverture et fermeture
    const { error: hourError } = await supabaseAdmin
      .from('app_config')
      .upsert([
        {
          cle: 'wifi_open_hour',
          valeur: openHour.toString(),
          type_valeur: 'integer',
          updated_at: new Date().toISOString()
        },
        {
          cle: 'wifi_close_hour',
          valeur: closeHour.toString(),
          type_valeur: 'integer',
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'cle' });

    if (hourError) {
      console.error('Erreur heures:', hourError);
      return NextResponse.json(
        { error: 'Erreur sauvegarde heures' },
        { status: 500 }
      );
    }

    // Sauvegarder les jours
    const days = {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday
    };

    const { error: dayError } = await supabaseAdmin
      .from('app_config')
      .upsert([
        {
          cle: 'wifi_days',
          valeur: JSON.stringify(days),
          type_valeur: 'json',
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'cle' });

    if (dayError) {
      console.error('Erreur jours:', dayError);
      return NextResponse.json(
        { error: 'Erreur sauvegarde jours' },
        { status: 500 }
      );
    }

    console.log('SUCCESS: Horaires sauvegardés');

    return NextResponse.json({
      success: true,
      message: 'Horaires sauvegardés avec succès'
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}