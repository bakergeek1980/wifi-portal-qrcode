import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Récupérer le secret du header
    const secret = request.headers.get('x-cron-secret');
    
    // Comparer avec ta variable d'environnement
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Secret invalide ou manquant' },
        { status: 401 }
      );
    }
    
    // Si le secret est correct, exécuter la tâche
    console.log('Tâche cron exécutée avec succès');
    
    return NextResponse.json({
      success: true,
      message: 'Tâche exécutée'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}