import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Total utilisateurs
    const { count: totalUsers } = await supabaseAdmin
      .from('wifi_users')
      .select('*', { count: 'exact', head: true });
    
    // Connexions aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const { count: connectionsToday } = await supabaseAdmin
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .gte('date_connexion', today);
    
    // Durée moyenne
    const { data: avgData } = await supabaseAdmin
      .from('connections')
      .select('duree_minutes')
      .limit(1000);
    
    const avgDuration = avgData?.length 
      ? Math.round(avgData.reduce((sum: number, c: any) => sum + c.duree_minutes, 0) / avgData.length)
      : 0;
    
    // Connexions actives
    const { count: activeConnections } = await supabaseAdmin
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'active')
      .gt('date_expiration', new Date().toISOString());
    
    // Statistiques par langue
    const { data: languageStats } = await supabaseAdmin
      .from('wifi_users')
      .select('langue')
      .limit(1000);
    
    const languageCount = languageStats?.reduce((acc: Record<string, number>, user: any) => {
      acc[user.langue] = (acc[user.langue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Anniversaires du mois
    const currentMonth = new Date().getMonth() + 1;
    const { count: birthdaysThisMonth } = await supabaseAdmin
      .from('wifi_users')
      .select('*', { count: 'exact', head: true })
      .not('date_anniversaire', 'is', null)
      .filter('date_anniversaire', 'gte', `2000-${String(currentMonth).padStart(2, '0')}-01`)
      .filter('date_anniversaire', 'lt', `2000-${String(currentMonth + 1).padStart(2, '0')}-01`);
    
    return NextResponse.json({
      totalUsers: totalUsers || 0,
      connectionsToday: connectionsToday || 0,
      avgDuration,
      activeConnections: activeConnections || 0,
      languageStats: languageCount || {},
      birthdaysThisMonth: birthdaysThisMonth || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error fetching statistics' },
      { status: 500 }
    );
  }
}
