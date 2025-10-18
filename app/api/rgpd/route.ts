import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Récupérer le contenu RGPD
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rgpd_content')
      .select('content, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      const defaultContent = `Politique de confidentialité et protection des données

1. COLLECTE DES DONNÉES
En vous connectant à notre réseau WiFi, nous collectons les informations suivantes :
• Adresse MAC de votre appareil
• Prénom et adresse email
• Date de naissance (optionnel)
• Horodatage de connexion et durée d'utilisation
• Langue de préférence

2. FINALITÉ DU TRAITEMENT
Ces données sont collectées et utilisées pour :
• Gérer l'accès au réseau WiFi
• Assurer la sécurité de notre réseau
• Vous envoyer des offres personnalisées
• Respecter nos obligations légales
• Organiser des tirages au sort mensuels

3. BASE LÉGALE
Le traitement repose sur :
• Votre consentement explicite
• L'exécution d'un contrat
• Le respect d'obligations légales
• Notre intérêt légitime

4. CONSERVATION DES DONNÉES
• Données de connexion : 1 an (obligation légale)
• Informations personnelles : durée d'utilisation + 3 ans

5. VOS DROITS RGPD
Vous disposez des droits suivants :
✓ Droit d'accès
✓ Droit de rectification
✓ Droit à l'effacement
✓ Droit à la limitation
✓ Droit d'opposition
✓ Droit à la portabilité

Pour exercer vos droits : info@lapromenade.ch

6. SÉCURITÉ DES DONNÉES
Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées.

7. PARTAGE DES DONNÉES
Vos données ne sont jamais vendues. Elles peuvent être partagées uniquement avec notre prestataire WiFi.

8. RÉCLAMATION
Vous pouvez déposer une réclamation auprès du Préposé fédéral à la protection des données (PFPDT).

Contact : info@lapromenade.ch

Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}`;

      return NextResponse.json({ 
        content: defaultContent,
        isDefault: true 
      });
    }

    return NextResponse.json({ 
      content: data.content,
      isDefault: false,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Error fetching RGPD content:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du contenu RGPD' },
      { status: 500 }
    );
  }
}

// POST - Sauvegarder le contenu RGPD
export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Le contenu RGPD est requis et doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    // Vérifier si une entrée existe déjà
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('rgpd_content')
      .select('id')
      .limit(1);

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const now = new Date().toISOString();
    let result;

    if (existing && existing.length > 0) {
      // Mettre à jour l'entrée existante
      result = await supabaseAdmin
        .from('rgpd_content')
        .update({ 
          content,
          updated_at: now
        })
        .eq('id', existing[0].id);
    } else {
      // Créer une nouvelle entrée
      result = await supabaseAdmin
        .from('rgpd_content')
        .insert([{ 
          content,
          created_at: now,
          updated_at: now
        }]);
    }

    if (result.error) throw result.error;

    return NextResponse.json({ 
      success: true,
      message: 'Contenu RGPD sauvegardé avec succès',
      updatedAt: now
    });
  } catch (error) {
    console.error('Error saving RGPD content:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde du contenu RGPD' },
      { status: 500 }
    );
  }
}