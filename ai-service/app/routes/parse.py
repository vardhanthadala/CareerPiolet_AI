from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import fitz
import io
import json
import os
import re
import asyncio
from google import genai
from app.core.config import get_settings

router = APIRouter(prefix="/ai", tags=["Resume Parsing"])
settings = get_settings()
COMMON_SKILLS = [
    "React", "Next.js", "JavaScript", "TypeScript", "Python", "Java", "SQL",
    "FastAPI", "Express.js", "Node.js", "PostgreSQL", "MongoDB", "MySQL",
    "Tailwind CSS", "HTML", "CSS", "LLMs", "LangChain", "Hugging Face",
    "Prompt Engineering", "RAG", "Git", "GitHub", "VS Code", "Postman",
    "REST APIs", "GraphQL", "Docker", "AWS", "C++", "C#"
]

from datetime import datetime
import math

MONTHS_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
}

def calculate_experience(text: str) -> tuple[int, str]:
    """Calculates total experience in months by parsing date ranges (e.g. Nov 2025 – Apr 2026)."""
    pattern = r'([A-Za-z]{3})\s+(\d{4})\s*[\u2013\u2014\-]\s*(([A-Za-z]{3})\s+(\d{4})|[Pp]resent)'
    matches = re.findall(pattern, text)
    
    total_months = 0
    now = datetime.now()

    for m in matches:
        start_m_str, start_y_str, end_raw, end_m_str, end_y_str = m
        start_m = MONTHS_MAP.get(start_m_str.lower()[:3], 1)
        start_y = int(start_y_str)

        if "present" in end_raw.lower():
            end_m = now.month
            end_y = now.year
        else:
            end_m = MONTHS_MAP.get(end_m_str.lower()[:3], 1)
            end_y = int(end_y_str)

        months = (end_y - start_y) * 12 + (end_m - start_m)
        if months > 0:
            total_months += months

    years = max(1, round(total_months / 12)) if total_months > 0 else 1

    if total_months <= 12:
        level = "ENTRY"
    elif total_months <= 36:
        level = "MID"
    elif total_months <= 72:
        level = "SENIOR"
    else:
        level = "LEAD"

    return years, level


def fallback_extract(text: str) -> dict:
    """Minimal fallback: only extract what regex can reliably find (email, phone, skills)."""
    # Email & Phone regex — the only things regex can reliably extract
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    phone_match = re.search(r'\+?\d[\d\s-]{8,14}\d', text)

    email = email_match.group(0) if email_match else ""
    phone = phone_match.group(0).strip() if phone_match else ""

    # Skills extraction via keyword matching — reliable enough
    found_skills = []
    text_lower = text.lower()
    for sk in COMMON_SKILLS:
        if re.search(r'\b' + re.escape(sk.lower()) + r'\b', text_lower):
            found_skills.append(sk)

    # Date range experience calculation
    years, exp_level = calculate_experience(text)

    return {
        "name": "",
        "email": email,
        "phone": phone,
        "headline": "",
        "summary": "",
        "skills": list(set(found_skills)),
        "targetRoles": [],
        "experienceLevel": exp_level,
        "yearsOfExp": years,
    }


import zipfile
import xml.etree.ElementTree as ET

def read_docx(contents: bytes) -> str:
    """Extract text from DOCX/DOC files while preserving paragraph structure and newlines."""
    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            paragraphs = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paragraphs.append("".join(texts))
            if paragraphs:
                return "\n".join(paragraphs)
            texts = [node.text for node in tree.iter() if node.text]
            return "\n".join(texts)
    except Exception as e:
        print(f"read_docx error: {e}")
        return ""


class ParseResumeResponse(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    headline: str = ""
    summary: str = ""
    skills: list[str] = []
    targetRoles: list[str] = []
    experienceLevel: str = "ENTRY"
    yearsOfExp: int = 1

@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse a resume in PDF, DOCX, DOC, or TXT format using smart text parsing + Google Gemini AI.
    """
    filename_lower = file.filename.lower()
    allowed_exts = (".pdf", ".docx", ".doc", ".txt")
    if not filename_lower.endswith(allowed_exts):
        raise HTTPException(status_code=400, detail="Supported formats: PDF, DOCX, DOC, TXT.")

    try:
        contents = await file.read()
        extracted_text = ""

        if filename_lower.endswith((".docx", ".doc")):
            extracted_text = read_docx(contents)
        elif filename_lower.endswith(".txt"):
            extracted_text = contents.decode("utf-8", errors="ignore")
        else:
            with fitz.open(stream=contents, filetype="pdf") as doc:
                for page in doc:
                    extracted_text += page.get_text("text") + "\n"

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from file.")

        # First run smart fallback extraction from text
        smart_data = fallback_extract(extracted_text)

        if not settings.gemini_api_key:
            return ParseResumeResponse(**smart_data)

        try:
            client = genai.Client(api_key=settings.gemini_api_key)

            prompt = f"""
            You are an expert resume parser. Extract structured profile data from this resume text accurately.
            
            EXTRACTION RULES:
            1. summary: Extract the EXACT verbatim text from the candidate's "Profile Summary", "Professional Summary", "About Me", or "Summary" section in their resume. DO NOT summarize, condense, or rewrite it into 2-3 sentences. Copy their exact words directly. If no summary section exists, provide a concise summary based on their experience.
            2. headline: Extract the exact professional headline / role title directly under their name (e.g. "Software Engineer — Full Stack Developer — GenAI Engineer").
            3. name: Full name of the candidate.
            4. email: Candidate's email address.
            5. phone: Candidate's phone number.
            6. skills: Array of all technical skills, programming languages, frameworks, libraries, tools, and databases mentioned in the resume.
            7. targetRoles: Array of relevant target job titles matching their headline and background (e.g. ["Software Engineer", "Full Stack Developer", "GenAI Engineer"]).
            8. experienceLevel: Must be one of: "ENTRY", "MID", "SENIOR", "LEAD".
            9. yearsOfExp: Integer representing total estimated years of experience.

            Resume Text:
            {extracted_text[:4000]}
            """
            
            # Use application/json mode for 100% reliable JSON generation
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-3.5-flash",
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                ),
                timeout=30.0
            )
            text_resp = response.text.strip()
            if text_resp.startswith("```json"):
                text_resp = text_resp[7:]
            if text_resp.startswith("```"):
                text_resp = text_resp[3:]
            if text_resp.endswith("```"):
                text_resp = text_resp[:-3]

            parsed_data = json.loads(text_resp.strip())

            # Backfill any missing fields from fallback regex
            if not parsed_data.get("email") and smart_data.get("email"):
                parsed_data["email"] = smart_data["email"]
            if not parsed_data.get("phone") and smart_data.get("phone"):
                parsed_data["phone"] = smart_data["phone"]
            if not parsed_data.get("summary") and smart_data.get("summary"):
                parsed_data["summary"] = smart_data["summary"]
            if (not parsed_data.get("skills") or len(parsed_data.get("skills", [])) == 0) and smart_data.get("skills"):
                parsed_data["skills"] = smart_data["skills"]

            return ParseResumeResponse(**parsed_data)

        except Exception as gemini_err:
            print(f"Gemini API parse error on primary model: {gemini_err}")
            # Try secondary model
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        client.models.generate_content,
                        model="gemini-flash-latest",
                        contents=prompt,
                        config=genai.types.GenerateContentConfig(
                            response_mime_type="application/json"
                        )
                    ),
                    timeout=20.0
                )
                parsed_data = json.loads(response.text.strip())
                return ParseResumeResponse(**parsed_data)
            except Exception as fb_err:
                print(f"Fallback model error: {fb_err}")
                return ParseResumeResponse(**smart_data)

    except Exception as e:
        print(f"PDF extract error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


