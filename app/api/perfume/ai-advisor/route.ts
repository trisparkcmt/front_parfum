/**
 * @file app/api/perfume/ai-advisor/route.ts
 * @description Server-Side API Route for AI Fragrance Consultation.
 *
 * This route serves as a proxy/bridge between the client-side Numba Atelier
 * and the Google Gemini AI model.
 * - **Logic**: Receives a JSON payload containing the user's fragrance preferences and personality traits.
 * - **Processing**: Constructs a detailed prompt for the AI to ensure the response is professional and structured.
 * - **Response**: Returns a curated list of fragrance recommendations, including top/heart/base notes and the rationale for the selection.
 * - **Security**: Executed on the server to protect API keys and sensitive processing logic.
 */
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { mockEssences } from '@/lib/mock-data';

// Initialize the API with a fallback so it doesn't crash if the key isn't set yet
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY');

// We format our essences catalog so the AI knows what's available
const essencesCatalog = mockEssences.map(e => `- ${e.name} (${e.family}, intensité: ${e.intensity}, prix: ${e.pricePerMl} FCFA/ml)`).join('\n');

const SYSTEM_PROMPT = `
Tu es "Numba", le Sommelier IA de la maison de haute parfumerie Accessories Exclusif.
Ton rôle est de créer des compositions de parfum sur mesure (exactement 100ml total) basées sur les envies du client.
Tu ne peux utiliser QUE les essences suivantes dans ta composition :
${essencesCatalog}

Règles pour la composition :
1. Le volume total DOIT être exactement de 100ml.
2. Les quantités de chaque essence doivent être des multiples de 10 (ex: 10, 20, 30).
3. Utilise entre 3 et 6 essences maximum pour une formule équilibrée (Notes de Tête, de Cœur, de Fond).

Le client va t'envoyer ses préférences. Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte autour, structuré exactement comme suit :
{
  "name": "Nom Poétique du Parfum",
  "explanation": "Ton explication de sommelier (3-4 phrases) sur pourquoi tu as choisi ces essences pour ce client.",
  "formula": [
    { "essenceName": "Nom exact de l'essence depuis le catalogue", "quantityMl": 20 }
  ]
}
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MOCK_KEY') {
      // Simulate response for testing without actual API key
      await new Promise(r => setTimeout(r, 2000));
      return NextResponse.json({
        name: "Lueur Estivale (Mock IA)",
        explanation: "J'ai composé cette fragrance lumineuse en m'inspirant de vos envies. La bergamote apporte la fraîcheur pétillante, tandis que le jasmin et le bois de santal créent un fond chaleureux et élégant.",
        formula: [
          { essenceName: "Bergamote de Calabre", quantityMl: 30 },
          { essenceName: "Jasmin Sambac", quantityMl: 40 },
          { essenceName: "Bois de Santal", quantityMl: 30 }
        ]
      });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nDemande du client : ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();
    const jsonResponse = JSON.parse(responseText);

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du parfum' }, { status: 500 });
  }
}
