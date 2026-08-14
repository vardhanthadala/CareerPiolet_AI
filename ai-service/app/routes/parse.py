from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import PyPDF2
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
    """Smart text extraction from raw resume PDF text."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Name & Headline from top lines
    name = lines[0] if lines else "Candidate"
    headline = ""
    if len(lines) > 1:
        headline = lines[1]
        if len(lines) > 2 and ("Engineer" in lines[2] or "Developer" in lines[2]):
            headline += " — " + lines[2]

    # Email & Phone regex
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    phone_match = re.search(r'\+?\d[\d\s-]{8,14}\d', text)

    email = email_match.group(0) if email_match else None
    phone = phone_match.group(0) if phone_match else None

    # Summary extraction
    summary = ""
    if "Profile Summary" in text:
        after_sum = text.split("Profile Summary", 1)[1]
        summary = after_sum.split("Professional Experience")[0].strip()
    elif len(lines) > 3:
        summary = " ".join(lines[2:6])[:500]

    # Skills extraction
    found_skills = []
    text_lower = text.lower()
    for sk in COMMON_SKILLS:
        if re.search(r'\b' + re.escape(sk.lower()) + r'\b', text_lower):
            found_skills.append(sk)

    # Target Roles
    target_roles = []
    if "Full Stack" in text or "Developer" in text:
        target_roles.append("Full Stack Developer")
    if "AI" in text or "GenAI" in text or "LLMs" in text:
        target_roles.append("GenAI Engineer")
    if "Software Engineer" in text:
        target_roles.append("Software Engineer")

    # Date range experience calculation
    years, exp_level = calculate_experience(text)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "headline": headline or "Software Engineer & Full Stack Developer",
        "summary": summary or text[:250],
        "skills": list(set(found_skills)),
        "targetRoles": target_roles or ["Software Engineer"],
        "experienceLevel": exp_level,
        "yearsOfExp": years,
    }


import zipfile
import xml.etree.ElementTree as ET

def read_docx(contents: bytes) -> str:
    """Extract text from DOCX/DOC files using standard library zipfile & ET."""
    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            texts = [node.text for node in tree.iter() if node.text]
            return " ".join(texts)
    except Exception:
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
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() or ""

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from file.")

        # First run smart fallback extraction from text
        smart_data = fallback_extract(extracted_text)

        if not settings.gemini_api_key:
            return ParseResumeResponse(**smart_data)

        try:
            client = genai.Client(api_key=settings.gemini_api_key)

            prompt = f"""
            Extract structured profile data from this resume text.
            Return ONLY a valid JSON object matching this schema:
            {{
              "name": "full name",
              "email": "email address",
              "phone": "phone number",
              "headline": "exact professional headline e.g. Software Engineer — Full Stack Developer — GenAI Engineer",
              "summary": "2-3 sentence professional summary",
              "skills": ["skill1", "skill2"],
              "targetRoles": ["role1", "role2"],
              "experienceLevel": "ENTRY" | "MID" | "SENIOR" | "LEAD",
              "yearsOfExp": 1
            }}

            Resume Text:
            {extracted_text[:4000]}
            """
            # Run in thread with 10.0 second strict timeout to prevent hangs
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-3-flash-preview",
                    contents=prompt,
                ),
                timeout=10.0
            )
            text_resp = response.text.strip()
            if text_resp.startswith("```json"):
                text_resp = text_resp[7:]
            if text_resp.startswith("```"):
                text_resp = text_resp[3:]
            if text_resp.endswith("```"):
                text_resp = text_resp[:-3]

            parsed_data = json.loads(text_resp.strip())
            # Merge with smart_data to ensure no fields are lost
            for key in ["headline", "summary", "skills", "targetRoles", "phone", "email"]:
                if not parsed_data.get(key) and smart_data.get(key):
                    parsed_data[key] = smart_data[key]

            return ParseResumeResponse(**parsed_data)

        except Exception as gemini_err:
            print(f"Gemini API parse timeout or error: {gemini_err}")
            return ParseResumeResponse(**smart_data)

    except Exception as e:
        print(f"PDF extract error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


