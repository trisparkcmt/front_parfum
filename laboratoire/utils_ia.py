import os
import json
import re
import google.generativeai as genai
from django.conf import settings
from catalogue.models import Parfum, Essence, Accessoire, Flacon

def get_catalogue_context():
    """Récupère et formate le catalogue pour l'IA"""
    parfums = Parfum.objects.filter(actif=True).values('id', 'nom', 'contenance_ml', 'description_ia', 'prix_unitaire')
    essences = Essence.objects.filter(actif=True).values('id', 'nom', 'description_ia', 'prix_par_10ml')
    accessoires = Accessoire.objects.filter(actif=True).values('id', 'nom', 'description_courte', 'prix_unitaire')
    flacons = Flacon.objects.filter(actif=True).values('id', 'nom', 'contenance_ml', 'prix_unitaire')
    
    context = "Catalogue actuel de la parfumerie :\n\n"
    
    context += "=== PARFUMS ===\n"
    for p in parfums:
        context += f"- ID: {p['id']}, Nom: {p['nom']}, Contenance: {p['contenance_ml']}ml, Prix: {p['prix_unitaire']} FCFA, Description: {p['description_ia']}\n"
        
    context += "\n=== ESSENCES (pour création sur mesure) ===\n"
    for e in essences:
        context += f"- ID: {e['id']}, Nom: {e['nom']}, Prix/10ml: {e['prix_par_10ml']} FCFA, Description: {e['description_ia']}\n"
    
    context += "\n=== FLACONS (pour création sur mesure) ===\n"
    for f in flacons:
        context += f"- ID: {f['id']}, Nom: {f['nom']}, Contenance: {f['contenance_ml']}ml, Prix: {f['prix_unitaire']} FCFA\n"
        
    context += "\n=== ACCESSOIRES ===\n"
    for a in accessoires:
        context += f"- ID: {a['id']}, Nom: {a['nom']}, Prix: {a['prix_unitaire']} FCFA, Description: {a['description_courte']}\n"
        
    return context

def demander_recommandation_ia(prompt_utilisateur):
    """Envoie le prompt à Gemini et retourne une réponse formatée"""
    # Configuration de l'API avec la clé
    api_key = os.environ.get('GEMINI_API_KEY') or getattr(settings, 'GEMINI_API_KEY', None)
    
    if not api_key:
        return {"error": "Clé API Gemini manquante. Veuillez configurer GEMINI_API_KEY."}
        
    genai.configure(api_key=api_key)
    
    # On utilise un modèle Gemini disponible pour la version d'API actuelle
    model = genai.GenerativeModel('models/gemini-flash-latest')
    
    catalogue_context = get_catalogue_context()
    
    system_prompt = f"""Tu es un expert parfumeur pour la boutique Accessoire Exclusif.
Un client va te faire une demande avec potentiellement :
- Une quantité désirée en ml (ex: "30ml", "50ml")
- Un budget maximum (ex: "moins de 50000 FCFA", "budget: 100000")

Tu dois analyser sa demande, extraire :
1. La quantité en ml demandée (sinon proposer 50ml par défaut)
2. Le budget maximum en FCFA s'il est spécifié (sinon laisser à 0 = pas de limite)

Puis recommander :
1. Des parfums existants qui correspondent à la contenance demandée et respectent le budget
2. Un flacon adapté à la quantité
3. Des essences avec les quantités précises en ml pour un mélange totalisant exactement la quantité
4. Des accessoires complémentaires
5. S'assurer que le coût total (flacon + essences + accessoires) respecte le budget si spécifié

Voici notre catalogue :
{catalogue_context}

IMPORTANT : Tu DOIS répondre UNIQUEMENT au format JSON strict (sans Markdown autour) :
{{
    "message": "Ton message d'explication chaleureux et professionnel pour le client (max 3 phrases)",
    "quantite_demandee_ml": 50,
    "budget_max_fcfa": 0,
    "flacon_id": 1,
    "parfums": [liste des IDs entiers des parfums ayant la contenance exacte, max 3],
    "essences": [
        {{"id": 1, "quantite_ml": 15}},
        {{"id": 2, "quantite_ml": 20}},
        {{"id": 3, "quantite_ml": 15}}
    ],
    "accessoires": [liste des IDs entiers des accessoires recommandés, max 3]
}}

RÈGLES CRITIQUES :
- Les essences doivent totaliser EXACTEMENT la quantité demandée (ex: si 30ml: 10+8+12=30)
- Le flacon_id doit correspondre à un flacon avec contenance adaptée
- Les parfums doivent avoir la contenance exacte demandée
- Si budget_max_fcfa > 0, s'assurer que le coût total respecte ce budget
- Si quantité non spécifiée, utiliser 50ml par défaut
- Si budget non spécifié, utiliser 0 (pas de limite)
- Ne mets AUCUN texte avant ou après le JSON.
"""
    
    try:
        # On utilise une température basse pour que l'IA reste factuelle et respecte le JSON
        response = model.generate_content(
            f"{system_prompt}\n\nDemande du client : {prompt_utilisateur}",
            generation_config=genai.types.GenerationConfig(temperature=0.2)
        )
        
        # Nettoyage de la réponse (au cas où Gemini ajoute des backticks markdown ````json ... ````)
        reponse_texte = response.text.strip()
        if reponse_texte.startswith("```json"):
            reponse_texte = reponse_texte[7:]
        if reponse_texte.startswith("```"):
            reponse_texte = reponse_texte[3:]
        if reponse_texte.endswith("```"):
            reponse_texte = reponse_texte[:-3]
            
        reponse_json = json.loads(reponse_texte.strip())
        return reponse_json
        
    except json.JSONDecodeError:
        return {"error": "L'IA a généré une réponse qui n'est pas un JSON valide."}
    except Exception as e:
        return {"error": f"Erreur de l'API IA : {str(e)}"}
