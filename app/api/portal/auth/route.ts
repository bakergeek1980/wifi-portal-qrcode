import { NextRequest, NextResponse } from 'next/server';

// Configuration Omada Cloud
const OMADA_CLOUD_URL = 'https://euw1-omada-cloud.tplinkcloud.com';
const OMADA_USERNAME = process.env.TPLINK_OMADA_EMAIL; // info@lapromenade.ch
const OMADA_PASSWORD = process.env.TPLINK_OMADA_PASSWORD;

interface OmadaAuthResponse {
  result: number;
  token: string;
}

interface OmadaLoginRequest {
  username: string;
  password: string;
}

/**
 * Authentifie auprès d'Omada Cloud et récupère un token
 */
async function getOmadaToken(): Promise<string> {
  try {
    const response = await fetch(`${OMADA_CLOUD_URL}/api/v2/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: OMADA_USERNAME,
        password: OMADA_PASSWORD,
      } as OmadaLoginRequest),
    });

    if (!response.ok) {
      throw new Error(`Omada login failed: ${response.statusText}`);
    }

    const data = (await response.json()) as OmadaAuthResponse;
    
    if (data.result !== 0 || !data.token) {
      throw new Error(`Omada authentication failed: ${data.result}`);
    }

    return data.token;
  } catch (error) {
    console.error('Error getting Omada token:', error);
    throw error;
  }
}

/**
 * Valide le code WiFi avec la logique locale (génération basée sur date + période)
 */
async function validateWifiCode(code: string): Promise<boolean> {
  try {
    const { isValidWifiCode } = await import('@/lib/utils');
    const isValid = await isValidWifiCode(code);
    
    if (!isValid) {
      console.error('Code is invalid or WiFi is closed');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating wifi code:', error);
    return false;
  }
}

/**
 * Autorise le client auprès d'Omada Cloud
 */
async function authorizeClientWithOmada(
  token: string,
  clientMac: string,
  apMac: string,
  site: string
): Promise<boolean> {
  try {
    // Appel à l'API Omada pour autoriser le client
    const response = await fetch(
      `${OMADA_CLOUD_URL}/api/v2/hotspot/extPortal/auth`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientMac,
          apMac,
          site,
          // Paramètres supplémentaires optionnels
          duration: 1440, // 24h en minutes
        }),
      }
    );

    if (!response.ok) {
      console.error(
        'Omada authorization failed:',
        response.status,
        await response.text()
      );
      return false;
    }

    const data = await response.json();
    console.log('Omada authorization response:', data);

    return data.result === 0; // 0 = succès
  } catch (error) {
    console.error('Error authorizing client with Omada:', error);
    return false;
  }
}

/**
 * Enregistre la connexion dans Supabase
 */
async function recordConnection(
  code: string,
  clientMac: string,
  apMac: string,
  userAgent?: string,
  clientIp?: string
): Promise<void> {
  try {
    // Calculer la date d'expiration (24h après)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Enregistrer la connexion
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    await supabaseAdmin.from('connections').insert({
      user_id: null, // Pas d'utilisateur identifié
      date_connexion: new Date().toISOString(),
      date_expiration: expiresAt.toISOString(),
      duree_minutes: 1440, // 24h
      code_utilise: code,
      adresse_ip: clientIp || null,
      user_agent: userAgent || null,
      statut: 'actif',
    });

    console.log('Connection recorded successfully');
  } catch (error) {
    console.error('Error recording connection:', error);
    // Ne pas lever l'erreur, l'authentification a déjà réussi
  }
}

/**
 * API Route - Authentification du portail captif
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      clientMac,
      apMac,
      site,
      originUrl = 'https://www.google.com',
    } = body;

    // Valider les paramètres obligatoires
    if (!code || !clientMac || !apMac || !site) {
      return NextResponse.json(
        {
          errorCode: -41500,
          message: 'Missing required parameters: code, clientMac, apMac, site',
        },
        { status: 400 }
      );
    }

    // Valider le code WiFi
    const isCodeValid = await validateWifiCode(code);
    if (!isCodeValid) {
      return NextResponse.json(
        {
          errorCode: -41502,
          message: 'Invalid or expired WiFi code',
        },
        { status: 401 }
      );
    }

    // Obtenir un token Omada
    let omadaToken: string;
    try {
      omadaToken = await getOmadaToken();
    } catch (error) {
      console.error('Failed to get Omada token:', error);
      return NextResponse.json(
        {
          errorCode: -1,
          message: 'Authentication service temporarily unavailable',
        },
        { status: 503 }
      );
    }

    // Autoriser le client auprès d'Omada
    const isAuthorized = await authorizeClientWithOmada(
      omadaToken,
      clientMac,
      apMac,
      site
    );

    if (!isAuthorized) {
      return NextResponse.json(
        {
          errorCode: -41501,
          message: 'Failed to authorize client with TP-Link controller',
        },
        { status: 500 }
      );
    }

    // Enregistrer la connexion
    await recordConnection(
      code,
      clientMac,
      apMac,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || request.ip || undefined
    );

    // Succès ! Retourner l'URL de redirection
    return NextResponse.json({
      errorCode: 0,
      message: 'Authentication successful',
      result: originUrl, // URL de redirection
    });
  } catch (error) {
    console.error('Error in portal auth:', error);
    return NextResponse.json(
      {
        errorCode: -1,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}