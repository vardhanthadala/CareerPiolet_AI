"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
import { getMyProfile, updateMyProfile, setAuthToken, getMe, uploadAndParseResume } from "@/lib/api";

export default function ProfilePage() {
  const [newSkill, setNewSkill] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsingResume(true);
      setParseSuccess(false);
      const parsed = await uploadAndParseResume(file);

      setForm((prev) => ({
        ...prev,
        headline: parsed.headline || prev.headline,
        summary: parsed.summary || prev.summary,
        phone: parsed.phone || prev.phone,
        skills: Array.from(new Set([...prev.skills, ...(parsed.skills || [])])),
        targetRoles: Array.from(new Set([...prev.targetRoles, ...(parsed.targetRoles || [])])),
        experienceLevel: parsed.experienceLevel || prev.experienceLevel,
        yearsOfExp: parsed.yearsOfExp || prev.yearsOfExp,
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
          className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 text-sm flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-blue-500" />
          Resume analyzed! Your profile fields below have been auto-filled by Google Gemini AI.
        </motion.div>
      )}

      {/* Upload Resume AI Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/80 border border-blue-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    Auto-Fill Profile with AI Resume Parser
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload your PDF resume to extract skills, headline, experience, and target roles automatically using Gemini AI.
                  </p>
                </div>
              </div>

              <div className="relative shrink-0 w-full md:w-auto">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  disabled={isParsingResume}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                />
                <Button
                  disabled={isParsingResume}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {isParsingResume ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing with Gemini AI...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Resume (PDF)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
