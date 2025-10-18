import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('========= DÉBUT LOGIN API =========');
  
  try {
    const { email, password } = await request.json();
    
    console.log('EMAIL REÇU:', email);
    console.log('PASSWORD REÇU:', password);
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SERVICE_KEY présent:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('SERVICE_KEY longueur:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    
    // TEST CONNEXION
    console.log('TEST: Récupération de tous les admins...');
    const test = await supabaseAdmin.from('admins').select('*');
    console.log('TEST RÉSULTAT:', JSON.stringify(test, null, 2));
    
    if (!email || !password) {
      console.log('ERREUR: Email ou password manquant');
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }
    
    console.log('RECHERCHE ADMIN avec email:', email);
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('actif', true)
      .single();
    
    console.log('ADMIN TROUVÉ:', admin);
    console.log('ERREUR SUPABASE:', error);
    
    if (error || !admin) {
      console.log('ÉCHEC: Admin non trouvé dans la DB');
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }
    
    console.log('SUCCESS: Admin trouvé!');
    console.log('PASSWORD DB:', admin.password);
    console.log('PASSWORD REÇU:', password);
    console.log('MATCH:', admin.password === password);
    
    if (admin.password !== password) {
      console.log('ÉCHEC: Mot de passe incorrect');
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }
    
    console.log('SUCCESS: Connexion réussie!');
    const token = `${admin.id}-${Date.now()}`;
    
    await supabaseAdmin.from('admins').update({ dernier_login: new Date().toISOString() }).eq('id', admin.id);
    
    return NextResponse.json({
      success: true,
      token,
      admin: { id: admin.id, email: admin.email, nom: admin.nom, role: admin.role }
    });
    
  } catch (error) {
    console.error('ERREUR CATCH:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
