import google.generativeai as genai
import os
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# gemini-2.5-flash: confirmed available on billing-enabled key, fast + low cost
model = genai.GenerativeModel('gemini-2.5-flash')

class GeminiService:
    async def classify_violation(
        self,
        asset_filename: str,
        org_name: str,
        infringing_url: str,
        platform: str,
        sharer_handle: str,
        detection_signal: str,
        whitelist: list,
        asset_labels: list
    ) -> dict:
        prompt = f"""
You are an AI assistant specializing in sports media copyright law and 
digital rights management. Analyze the following potential copyright 
violation and provide a structured assessment.

PROTECTED ASSET INFORMATION:
- Asset: {asset_filename}
- Rights holder: {org_name}
- Content type detected: {', '.join([l.get('description', '') for l in asset_labels[:5]]) if asset_labels else 'Unknown'}
- Detection method: {detection_signal}

DETECTED VIOLATION:
- Platform: {platform}
- Infringing URL: {infringing_url}
- Sharer handle/account: {sharer_handle}

AUTHORIZED SHARERS WHITELIST:
{json.dumps(whitelist) if whitelist else "No authorized sharers defined"}

Provide your assessment as a valid JSON object with exactly these fields:
{{
  "violationType": "one of: unauthorized_redistribution, modified_repost, commercial_use, potential_fair_use, licensed_use",
  "severity": "one of: low, medium, high, critical",
  "reasoning": "2-3 sentence explanation of the violation and why this severity was assigned",
  "isWhitelisted": true or false (whether sharer is on the whitelist),
  "recommendedAction": "one of: send_dmca, monitor, contact_directly, no_action_required",
  "estimatedImpact": "one of: minimal, moderate, significant, severe",
  "sportContext": "brief note about sports media rights context relevant to this case"
}}

Return ONLY the JSON object. No markdown. No explanation. No backticks.
"""
        try:
            logger.info(f"Classify Prompt: {prompt}")
            response = model.generate_content(prompt)
            logger.info(f"Classify Response: {response.text}")
            
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            return json.loads(clean_text)
        except Exception as e:
            logger.error(f"Failed to parse Gemini response for classify_violation: {e}")
            return {
                "violationType": "unauthorized_redistribution",
                "severity": "medium",
                "reasoning": f"Failed to parse AI response. Error: {str(e)}. Defaulting to medium severity.",
                "isWhitelisted": False,
                "recommendedAction": "monitor",
                "estimatedImpact": "moderate",
                "sportContext": "Could not determine context due to processing error."
            }

    async def generate_dmca_notice(
        self,
        org_name: str,
        org_email: str,
        asset_filename: str,
        asset_id: str,
        protected_url: str,
        infringing_url: str,
        platform: str,
        sharer_handle: str,
        violation_type: str,
        detected_at: str
    ) -> str:
        prompt = f"""
You are a legal document generator specializing in DMCA takedown notices 
for sports media copyright violations. Generate a complete, professionally 
formatted DMCA takedown notice.

RIGHTS HOLDER INFORMATION:
- Organization: {org_name}
- Contact email: {org_email}

COPYRIGHTED WORK:
- Asset filename: {asset_filename}
- Asset ID (internal reference): {asset_id}
- Original protected work URL: {protected_url}

INFRINGING CONTENT:
- Platform: {platform}
- Infringing URL: {infringing_url}
- Account/handle: {sharer_handle}
- Violation type: {violation_type}
- First detected: {detected_at}

Generate a complete DMCA Section 512(c) takedown notice. The notice must 
include:
1. Subject line
2. Identification of the copyrighted work
3. Identification of the infringing material and its location
4. Contact information block
5. Statement of good faith belief
6. Statement of accuracy and authority under penalty of perjury
7. Electronic signature block

Format as a properly structured legal document with clear sections.
Make it complete and ready to send to the platform's designated DMCA agent.
Use [SIGNATURE] as a placeholder for the electronic signature.
"""
        try:
            response = model.generate_content(prompt)
            logger.info(f"DMCA generated for asset_id: {asset_id}")
            return response.text
        except Exception as e:
            logger.error(f"Failed to generate DMCA notice for asset {asset_id}: {e}")
            return "Error: Failed to generate DMCA notice. Please check the logs or try again later."

    async def analyze_propagation(
        self,
        violations: list,
        asset_filename: str
    ) -> dict:
        prompt = f"""
You are an expert in viral content propagation and digital threat intelligence.
Analyze the following list of detected copyright violations for the asset: {asset_filename}.

VIOLATIONS DATA:
{json.dumps(violations, indent=2)}

Please analyze the spread pattern and provide your assessment as a valid JSON object with exactly these fields:
{{
  "primarySource": "Identify the likely first sharer or original source based on timestamps",
  "spreadPattern": "A description of how the content appears to have spread across platforms",
  "highRiskPlatforms": ["platform1", "platform2"],
  "totalReach": "A descriptive estimate of the total reach/impact",
  "urgency": "one of: low, medium, high, critical"
}}

Return ONLY the JSON object. No markdown. No explanation. No backticks.
"""
        try:
            response = model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            return json.loads(clean_text)
        except Exception as e:
            logger.error(f"Failed to analyze propagation for {asset_filename}: {e}")
            return {
                "primarySource": "Unknown",
                "spreadPattern": "Could not determine pattern due to analysis error.",
                "highRiskPlatforms": [],
                "totalReach": "Unknown",
                "urgency": "medium"
            }

gemini_service = GeminiService()
