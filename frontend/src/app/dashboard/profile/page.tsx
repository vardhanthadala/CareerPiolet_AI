"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Save,
  Loader2,
  Plus,
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Code,
  Target,
  DollarSign,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMyProfile, updateMyProfile, setAuthToken, getMe, uploadAndParseResume, uploadResumeToS3 } from "@/lib/api";
import mammoth from "mammoth";
import { ResumeViewerModal } from "@/components/ResumeViewerModal";

export default function ProfilePage() {
  const [newSkill, setNewSkill] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeDocxHtml, setResumeDocxHtml] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [showResumeModal, setShowResumeModal] = useState(false);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsingResume(true);
      setParseSuccess(false);
      setResumeFileName(file.name);

      const isDocx = file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc");
      const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

      if (isDocx) {
        setResumeUrl(null);
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setResumeDocxHtml(result.value || "<p>Could not format document.</p>");
        } catch {
          const text = await file.text();
          setResumeDocxHtml(`<pre class="whitespace-pre-wrap font-sans text-xs">${text}</pre>`);
        }
      } else if (isPdf) {
        setResumeDocxHtml(null);
        const fileUrl = URL.createObjectURL(file);
        setResumeUrl(fileUrl);
      } else {
        // Plain text / other documents
        setResumeUrl(null);
        const text = await file.text();
        setResumeDocxHtml(`<pre class="whitespace-pre-wrap font-sans text-xs p-4">${text}</pre>`);
      }

      // 1. Upload to AWS S3 in background & save URL to DB
      uploadResumeToS3(file).then((res) => {
        if (res?.resumeUrl) {
          setResumeUrl(res.resumeUrl);
        }
      }).catch((err) => {
        console.warn("AWS S3 upload error (non-fatal):", err);
      });

      // 2. Parse structured data with AI
      const parsed = await uploadAndParseResume(file);

      setExtractedData(parsed);
      setShowPreviewModal(true);

      setForm((prev) => ({
        ...prev,
        headline: parsed.headline || "",
        summary: parsed.summary || "",
        phone: parsed.phone || prev.phone,
        skills: parsed.skills && parsed.skills.length > 0 ? parsed.skills : prev.skills,
        targetRoles: parsed.targetRoles && parsed.targetRoles.length > 0 ? parsed.targetRoles : prev.targetRoles,
        experienceLevel: parsed.experienceLevel || prev.experienceLevel,
        yearsOfExp: parsed.yearsOfExp ?? prev.yearsOfExp,
      }));

      setParseSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to parse resume PDF. Please check if the AI service is running.");
    } finally {
      setIsParsingResume(false);
    }
  };

  const [form, setForm] = useState({
    headline: "",
    summary: "",
    phone: "",
    location: "",
    skills: [] as string[],
    targetRoles: [] as string[],
    experienceLevel: "ENTRY",
    yearsOfExp: 0,
    preferredLocations: [] as string[],
    remotePreference: "FLEXIBLE",
    salaryExpMin: 0,
    salaryExpMax: 0,
    salaryCurrency: "INR",
    noticePeriod: "",
    workAuthorization: "",
  });

  useEffect(() => {
    (async () => {
      try { await getMe(); } catch {}
    })();
  }, []);

  // Lock body scroll and listen to ESC key when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showResumeModal || showPreviewModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowResumeModal(false);
        setShowPreviewModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showResumeModal, showPreviewModal]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        headline: profile.headline || "",
        summary: profile.summary || "",
        phone: profile.phone || "",
        location: profile.location || "",
        skills: profile.skills || [],
        targetRoles: profile.targetRoles || [],
        experienceLevel: profile.experienceLevel || "ENTRY",
        yearsOfExp: profile.yearsOfExp || 0,
        preferredLocations: profile.preferredLocations || [],
        remotePreference: profile.remotePreference || "FLEXIBLE",
        salaryExpMin: profile.salaryExpMin || 0,
        salaryExpMax: profile.salaryExpMax || 0,
        salaryCurrency: profile.salaryCurrency || "INR",
        noticePeriod: profile.noticePeriod || "",
        workAuthorization: profile.workAuthorization || "",
      });
      if (profile.resumeUrl && !resumeUrl) {
        setResumeUrl(profile.resumeUrl);
      }
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => updateMyProfile(data),
  });

  const handleSave = () => {
    mutation.mutate(form);
  };

  const addToList = (
    field: "skills" | "targetRoles" | "preferredLocations",
    value: string,
    setter: (v: string) => void
  ) => {
    if (value.trim() && !form[field].includes(value.trim())) {
      setForm((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
      setter("");
    }
  };

  const removeFromList = (
    field: "skills" | "targetRoles" | "preferredLocations",
    index: number
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
            <User className="h-6 w-6 text-slate-900" />
            Profile
          </h1>
          <p className="text-slate-500 mt-1">
            Your candidate profile for AI matching.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm transition-all"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Profile
        </Button>
      </div>

      {mutation.isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
        >
          ✓ Profile saved successfully!
        </motion.div>
      )}

      {parseSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[14px] font-medium flex items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Resume analyzed! Your profile fields below have been auto-filled by Gemini AI.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreviewModal(true)}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 text-xs h-7 gap-1 shrink-0"
          >
            <Eye className="h-3.5 w-3.5" /> View Extracted AI Data
          </Button>
        </motion.div>
      )}

      {/* Upload Resume AI Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-white border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111827] flex items-center gap-2">
                    Auto-Fill Profile with AI Resume Parser
                  </h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 leading-normal">
                    Upload your PDF resume to extract skills, headline, experience, and target roles automatically.
                  </p>
                  {resumeFileName && (
                    <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {resumeFileName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto flex-wrap md:flex-nowrap">
                {(resumeUrl || resumeDocxHtml || profile?.resumeUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResumeModal(true)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-10 px-3.5 flex items-center gap-1.5 rounded-xl shadow-xs"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                    View Resume
                  </Button>
                )}
                {extractedData && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreviewModal(true)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-10 px-3 flex items-center gap-1.5 rounded-xl shadow-xs"
                  >
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Inspect AI Data
                  </Button>
                )}
                <div className="relative shrink-0 flex-1 md:flex-initial">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleResumeUpload}
                    disabled={isParsingResume}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                  />
                  <Button
                    disabled={isParsingResume}
                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2.5 text-[14px] font-medium border-0 shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isParsingResume ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                        Parsing Resume...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {resumeUrl || profile?.resumeUrl ? "Replace Resume (PDF)" : "Upload Resume (PDF, DOCX)"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Resume Inspection Modal */}
      <AnimatePresence>
        {showPreviewModal && extractedData && (
          <div
            key="ai-preview-modal"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPreviewModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/70 backdrop-blur-xl"
          >
            <motion.div
              key="ai-preview-content"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.25)] border border-slate-200/80 max-w-xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar p-6 md:p-7 space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        AI Extracted Profile
                      </h2>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/80 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        Parsed
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Structured information parsed by Gemini AI from your resume.
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Headline Card */}
              {extractedData.headline && (
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    <span>Headline</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                    {extractedData.headline}
                  </p>
                </div>
              )}

              {/* Summary Card */}
              {extractedData.summary && (
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                    <span>AI Professional Summary</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                    {extractedData.summary}
                  </p>
                </div>
              )}

              {/* Skills Card */}
              {extractedData.skills && extractedData.skills.length > 0 && (
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Code className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Extracted Skills</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {extractedData.skills.length} skills found
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.skills.map((sk: string, idx: number) => (
                      <Badge
                        key={idx}
                        className="bg-white hover:bg-slate-100 text-slate-800 border-slate-200/90 text-xs font-medium px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
                      >
                        {sk}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Roles & Experience Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                    <Target className="h-3.5 w-3.5 text-rose-500" />
                    <span>Target Roles</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.targetRoles?.length > 0 ? (
                      extractedData.targetRoles.map((r: string, idx: number) => (
                        <Badge key={idx} className="bg-white text-slate-800 border-slate-200 text-xs font-medium">
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None detected</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                    <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                    <span>Experience Level</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between">
                    <span>{extractedData.experienceLevel || "ENTRY"}</span>
                    <span className="text-slate-400">~{extractedData.yearsOfExp || 0} years</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-xl border-slate-200/80 text-slate-600 hover:bg-slate-50 text-xs px-4 h-9.5 font-medium transition-all"
                >
                  Close
                </Button>
                <Button
                  disabled={mutation.isPending}
                  onClick={() => {
                    setShowPreviewModal(false);
                    mutation.mutate(form);
                  }}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs px-5 h-9.5 font-medium transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-300" />
                      Saving to Database...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Confirm & Save Profile
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Dedicated Resume PDF / DOCX Viewer Modal */}
        <ResumeViewerModal
          key="resume-viewer-modal"
          isOpen={showResumeModal && Boolean(resumeUrl || resumeDocxHtml || profile?.resumeUrl)}
          onClose={() => setShowResumeModal(false)}
          fileUrl={resumeUrl || profile?.resumeUrl}
          docxHtml={resumeDocxHtml}
          fileName={resumeFileName || (profile?.resumeUrl ? "Resume.pdf" : "Uploaded Resume")}
          isDocx={Boolean(resumeDocxHtml || resumeFileName.toLowerCase().endsWith(".docx") || resumeFileName.toLowerCase().endsWith(".doc"))}
        />
      </AnimatePresence>

      {/* Basic Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-white border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <Briefcase className="h-5 w-5 text-slate-900" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  placeholder="e.g., Full Stack Developer"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="e.g., Hyderabad, India"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                placeholder="Brief professional summary..."
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={3}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label>Work Authorization</Label>
                <Input
                  placeholder="e.g., Indian Citizen"
                  value={form.workAuthorization}
                  onChange={(e) => setForm({ ...form, workAuthorization: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Skills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <Code className="h-5 w-5 text-slate-900" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g., React, Python, SQL)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList("skills", newSkill, setNewSkill);
                  }
                }}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => addToList("skills", newSkill, setNewSkill)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill, i) => (
                <Badge
                  key={i}
                  className="bg-slate-100 text-slate-700 border-slate-200 cursor-pointer hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                  onClick={() => removeFromList("skills", i)}
                >
                  {skill}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Target Roles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <Target className="h-5 w-5 text-slate-900" />
              Target Roles & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Target Roles</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Software Engineer, Frontend Developer..."
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList("targetRoles", newRole, setNewRole);
                    }
                  }}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => addToList("targetRoles", newRole, setNewRole)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.targetRoles.map((role, i) => (
                  <Badge
                    key={i}
                    className="bg-slate-100 text-slate-700 border-slate-200 cursor-pointer hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                    onClick={() => removeFromList("targetRoles", i)}
                  >
                    {role}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select
                  value={form.experienceLevel}
                  onValueChange={(v: string | null) => setForm({ ...form, experienceLevel: v || "ENTRY" })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERN">Intern</SelectItem>
                    <SelectItem value="ENTRY">Entry Level</SelectItem>
                    <SelectItem value="MID">Mid Level</SelectItem>
                    <SelectItem value="SENIOR">Senior</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Remote Preference</Label>
                <Select
                  value={form.remotePreference}
                  onValueChange={(v: string | null) => setForm({ ...form, remotePreference: v || "FLEXIBLE" })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONSITE">Onsite Only</SelectItem>
                    <SelectItem value="REMOTE">Remote Only</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                    <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preferred Locations */}
            <div className="space-y-3">
              <Label>Preferred Locations</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Hyderabad, Bangalore, Remote..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList("preferredLocations", newLocation, setNewLocation);
                    }
                  }}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    addToList("preferredLocations", newLocation, setNewLocation)
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.preferredLocations.map((loc, i) => (
                  <Badge
                    key={i}
                    className="bg-slate-100 text-slate-700 border-slate-200 cursor-pointer hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                    onClick={() => removeFromList("preferredLocations", i)}
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {loc}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Salary & Availability */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <DollarSign className="h-5 w-5 text-slate-900" />
              Salary & Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min Salary</Label>
                <Input
                  type="number"
                  placeholder="e.g., 800000"
                  value={form.salaryExpMin || ""}
                  onChange={(e) =>
                    setForm({ ...form, salaryExpMin: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Salary</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1200000"
                  value={form.salaryExpMax || ""}
                  onChange={(e) =>
                    setForm({ ...form, salaryExpMax: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={form.salaryCurrency}
                  onValueChange={(v: string | null) => setForm({ ...form, salaryCurrency: v || "INR" })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.yearsOfExp || ""}
                  onChange={(e) =>
                    setForm({ ...form, yearsOfExp: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label>Notice Period</Label>
                <Input
                  placeholder="e.g., Immediate, 30 days, 90 days"
                  value={form.noticePeriod}
                  onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm transition-all"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
