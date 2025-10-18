import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // Si une clé spécifique est demandée
    if (key) {
      const { data, error } = await supabaseAdmin
        .from('app_config')
        .select('*')
        .eq('cle', key)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Config non trouvée', valeur: '' },
          { status: 200 }
        );
      }

      return NextResponse.json(data);
    }

    // Sinon, retourner toute la config
    const { data, error } = await supabaseAdmin
      .from('app_config')
      .select('*');
    
    if (error) {
      console.error('Error fetching config:', error);
      return NextResponse.json(
        { error: 'Error fetching configuration' },
        { status: 500 }
      );
    }
    
    const config = data.reduce((acc: Record<string, any>, item: any) => {
      let value: any = item.valeur;
      
      switch (item.type_valeur) {
        case 'integer':
          value = parseInt(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            value = item.valeur;
          }
          break;
      }
      
      acc[item.cle] = value;
      return acc;
    }, {} as Record<string, any>);
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in config GET:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.key && body.valeur !== undefined) {
      const { data, error } = await supabaseAdmin
        .from('app_config')
        .update({ 
          valeur: String(body.valeur),
          updated_at: new Date().toISOString()
        })
        .eq('cle', body.key)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Erreur mise à jour' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data
      });
    }

    const updates = body;
    for (const [cle, valeur] of Object.entries(updates)) {
      await supabaseAdmin
        .from('app_config')
        .update({ 
          valeur: String(valeur),
          updated_at: new Date().toISOString()
        })
        .eq('cle', cle);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Error updating configuration' },
      { status: 500 }
    );
  }
}