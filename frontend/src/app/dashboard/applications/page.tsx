"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  Send,
  MessageSquare,
  Trophy,
  XCircle,
  Building2,
  MapPin,
  ExternalLink,
  Loader2,
  Trash2,
  FileEdit,
  Sparkles,
  CheckCircle2,
  X,
  Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSavedJobs, unsaveJob, getMyApplications, updateApplicationStatus, getMyProfile, getJob, tailorApplication } from "@/lib/api";
import Link from "next/link";

const statusConfig: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  SAVED: { icon: Clock, color: "text-slate-400", label: "Saved", bg: "bg-slate-50" },
  PREPARING: { icon: FileText, color: "text-yellow-500", label: "Preparing", bg: "bg-yellow-50" },
  APPLIED: { icon: Send, color: "text-blue-500", label: "Applied", bg: "bg-blue-50" },
  ASSESSMENT: { icon: FileText, color: "text-purple-500", label: "Assessment", bg: "bg-purple-50" },
  INTERVIEW: { icon: MessageSquare, color: "text-cyan-500", label: "Interview", bg: "bg-cyan-50" },
  OFFER: { icon: Trophy, color: "text-green-500", label: "Offer", bg: "bg-green-50" },
  REJECTED: { icon: XCircle, color: "text-red-500", label: "Rejected", bg: "bg-red-50" },
};

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [tailorData, setTailorData] = useState<any>(null);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: getSavedJobs,
  });

  // Load candidate profile
  const { data: profileData } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  // Load real application statuses from DB
  const { data: applicationsData, refetch: refetchApplications } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

  // Build a map jobId -> status from real DB data
  const dbStatusMap: Record<string, string> = {};
  if (Array.isArray(applicationsData)) {
    applicationsData.forEach((app: any) => {
      if (app.jobId) dbStatusMap[app.jobId] = app.status;
    });
  }

  // Mutation to persist status to backend
  const statusMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      updateApplicationStatus(jobId, status),
    onSuccess: () => {
      refetchApplications();
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
  });

  // Trigger AI tailoring when a job is selected for preparation
  const handlePrepare = async (job: any) => {
    setSelectedJob(job);
    setTailorData(null);
    setTailorError(null);
    setTailorLoading(true);

    try {
      // Fetch full job details (with description)
      const fullJob = await getJob(job.id);
      const jd = fullJob.descriptionPlain || fullJob.description || "";
      // Strip HTML tags from description
      const plainJd = jd.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

      const profile = profileData || {};
      const result = await tailorApplication({
        jobTitle: fullJob.title || job.title,
        jobCompany: fullJob.company?.name || job.company?.name || "",
        jobDescription: plainJd,
        jobLocation: fullJob.location || job.location || "",
        candidateName: profile.user?.name || profile.user?.email || "",
        candidateHeadline: profile.headline || "",
        candidateSummary: profile.summary || "",
        candidateSkills: profile.skills || [],
        candidateExperience: profile.experience || [],
        candidateProjects: profile.projects || [],
        candidateEducation: profile.education || [],
      });
      setTailorData(result);
    } catch (err: any) {
      console.error("AI tailor error:", err);
      setTailorError(err?.response?.data?.detail || err?.message || "AI tailoring failed. Please try again.");
    } finally {
      setTailorLoading(false);
    }
  };

  const handleUnsave = async (jobId: string) => {
    try {
      await unsaveJob(jobId);
      refetch();
    } catch {}
  };

  const savedJobs = Array.isArray(data) ? data : [];

  const getJobStatus = (jobId: string) => dbStatusMap[jobId] || "SAVED";

  const setJobStatus = (jobId: string, status: string) => {
    statusMutation.mutate({ jobId, status });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-[#111827]">
          <FileText className="h-6 w-6 text-[#111827]" />
          Applications
        </h1>
        <p className="text-slate-500 mt-1">
          Track your job applications, prepare AI materials, and manage your pipeline.
        </p>
      </div>

      {/* Status Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = savedJobs.filter(
            (s: any) => getJobStatus(s.job.id) === key
          ).length;
          return (
            <Card
              key={key}
              className="bg-white border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <CardContent className="p-4 text-center flex flex-col items-center justify-center">
                <div className={`p-2 rounded-lg ${config.bg} mb-2`}>
                  <config.icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="text-2xl font-medium text-[#111827] tracking-tight">{count}</div>
                <div className="text-[13px] font-medium text-slate-500 mt-1">
                  {config.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Job List / Empty State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : savedJobs.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
            <CardContent className="py-20 text-center">
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Send className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-[17px] font-medium text-[#111827] tracking-tight mb-2">
                No applications yet
              </h3>
              <p className="text-slate-500 text-[14px] max-w-md mx-auto leading-relaxed mb-6">
                Browse jobs and click the bookmark icon or apply button to track them here in real-time.
              </p>
              <Link href="/dashboard/jobs">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5">
                  Browse Jobs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">Active Pipeline ({savedJobs.length})</h2>
          <div className="grid gap-4">
            {savedJobs.map((saved: any, i: number) => {
              const currentStatus = getJobStatus(saved.job.id);
              const statusInfo = statusConfig[currentStatus] || statusConfig.SAVED;

              return (
                <motion.div
                  key={saved.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-white border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all">
                    <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${statusInfo.bg} ${statusInfo.color} border-0 text-[11px] font-semibold`}>
                            {statusInfo.label.toUpperCase()}
                          </Badge>
                        </div>
                        <Link
                          href={`/dashboard/jobs/${saved.job.id}`}
                          className="text-lg font-semibold text-[#111827] hover:text-blue-600 transition-colors"
                        >
                          {saved.job.title}
                        </Link>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {saved.job.company?.name || "Company"}
                          </span>
                          {saved.job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {saved.job.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setJobStatus(saved.job.id, "PREPARING");
                            handlePrepare(saved.job);
                          }}
                          className="border-slate-200 hover:bg-yellow-50 hover:text-yellow-700 transition-all flex items-center gap-1.5"
                        >
                          <FileEdit className="h-3.5 w-3.5 text-yellow-500" />
                          Prepare Application
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnsave(saved.job.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {saved.job.applicationUrl && (
                          <a
                            href={saved.job.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setJobStatus(saved.job.id, "APPLIED")}
                          >
                            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg">
                              Apply
                              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Application Preparation Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar p-6 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 mb-2">
                    PREPARING APPLICATION
                  </Badge>
                  <h2 className="text-xl font-bold text-[#111827]">
                    {selectedJob.title}
                  </h2>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4" /> {selectedJob.company?.name || "Company"} • {selectedJob.location || "Remote"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedJob(null)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Loading State */}
              {tailorLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                  <p className="text-sm font-medium text-slate-600">AI is analyzing the job description & tailoring your resume...</p>
                  <p className="text-xs text-slate-400">This may take 5-10 seconds</p>
                </div>
              )}

              {/* Error State */}
              {tailorError && !tailorLoading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 font-medium">⚠️ {tailorError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-red-200 text-red-600 hover:bg-red-100"
                    onClick={() => handlePrepare(selectedJob)}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* AI Generated Content */}
              {tailorData && !tailorLoading && (
                <>
                  {/* Match Score */}
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div className={`text-3xl font-bold tracking-tight ${
                      tailorData.matchScore >= 80 ? "text-emerald-600" :
                      tailorData.matchScore >= 60 ? "text-yellow-600" : "text-red-500"
                    }`}>
                      {tailorData.matchScore}%
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Match Score</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tailorData.matchScore >= 80 ? "Excellent match — strong alignment with JD requirements" :
                         tailorData.matchScore >= 60 ? "Good match — most key skills align" :
                         "Partial match — consider upskilling in missing areas"}
                      </p>
                    </div>
                  </div>

                  {/* Skill Analysis */}
                  {(tailorData.keySkillMatches?.length > 0 || tailorData.missingSkills?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tailorData.keySkillMatches?.length > 0 && (
                        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60">
                          <h4 className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Matching Skills
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {tailorData.keySkillMatches.map((skill: string, i: number) => (
                              <Badge key={i} className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {tailorData.missingSkills?.length > 0 && (
                        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
                          <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> Skills to Develop
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {tailorData.missingSkills.map((skill: string, i: number) => (
                              <Badge key={i} className="bg-amber-100 text-amber-700 border-0 text-[10px]">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Tailored Professional Summary */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500" /> Tailored Professional Summary
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(tailorData.professionalSummary, "summary")}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        {copiedType === "summary" ? (
                          <><CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1" /> Copied!</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      {tailorData.professionalSummary}
                    </p>
                  </div>

                  {/* AI Tailored Experience Bullets */}
                  {tailorData.experienceBullets?.length > 0 && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-500" /> Tailored Experience Bullets
                        </h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(tailorData.experienceBullets.map((b: string) => `• ${b}`).join("\n"), "expBullets")}
                          className="text-xs text-slate-600 hover:text-slate-900"
                        >
                          {copiedType === "expBullets" ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1" /> Copied!</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5 mr-1" /> Copy Bullets</>
                          )}
                        </Button>
                      </div>
                      <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside bg-white p-3 rounded-lg border border-slate-200">
                        {tailorData.experienceBullets.map((bullet: string, i: number) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Tailored Project Highlights */}
                  {tailorData.projectBullets?.length > 0 && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-500" /> Tailored Project Highlights
                        </h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(tailorData.projectBullets.map((b: string) => `• ${b}`).join("\n"), "projBullets")}
                          className="text-xs text-slate-600 hover:text-slate-900"
                        >
                          {copiedType === "projBullets" ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1" /> Copied!</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5 mr-1" /> Copy Projects</>
                          )}
                        </Button>
                      </div>
                      <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside bg-white p-3 rounded-lg border border-slate-200">
                        {tailorData.projectBullets.map((bullet: string, i: number) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Tailored Cover Letter */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" /> AI Tailored Cover Letter
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(tailorData.coverLetter, "cover")}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        {copiedType === "cover" ? (
                          <><CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1" /> Copied!</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5 mr-1" /> Copy Letter</>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-mono bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-line">
                      {tailorData.coverLetter}
                    </p>
                  </div>
                </>
              )}

              {/* Stage-Specific AI Tools */}
              {getJobStatus(selectedJob.id) === "ASSESSMENT" && (
                <div className="space-y-3 bg-purple-50/70 p-4 rounded-xl border border-purple-200/60">
                  <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" /> AI Online Assessment & Technical Test Prep
                  </h3>
                  <ul className="text-xs text-purple-800 space-y-1.5 list-disc list-inside">
                    <li><strong>Key Topics:</strong> Data Structures, Algorithms, Async Code & SQL Performance.</li>
                    <li><strong>Timed Coding Challenge Tip:</strong> Write clean, modular functions and test edge cases (null inputs, empty arrays).</li>
                    <li><strong>AI Practice Q:</strong> &quot;Explain how you would optimize a slow SQL join query across 100k records.&quot;</li>
                  </ul>
                </div>
              )}

              {getJobStatus(selectedJob.id) === "INTERVIEW" && (
                <div className="space-y-3 bg-cyan-50/70 p-4 rounded-xl border border-cyan-200/60">
                  <h3 className="text-sm font-semibold text-cyan-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-cyan-600" /> AI Mock Interview & Behavioral Questions
                  </h3>
                  <div className="text-xs text-cyan-800 space-y-2">
                    <p><strong>1. Tell me about a time you solved a complex technical problem.</strong></p>
                    <p className="bg-white p-2.5 rounded-lg border border-cyan-100 font-mono text-[11px]">
                      Structure: Situation → Task → Action → Result (STAR method). Highlight your role in architecture design and performance gains.
                    </p>
                    <p><strong>2. Why do you want to work at {selectedJob.company?.name || "this company"}?</strong></p>
                    <p className="bg-white p-2.5 rounded-lg border border-cyan-100 font-mono text-[11px]">
                      Mention their technical stack, market impact, and your passion for building high-quality product features.
                    </p>
                  </div>
                </div>
              )}

              {getJobStatus(selectedJob.id) === "OFFER" && (
                <div className="space-y-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/60">
                  <h3 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-emerald-600" /> AI Salary & Offer Negotiation Assistant
                  </h3>
                  <p className="text-xs text-emerald-800">
                    🎉 Congratulations on receiving an offer for <strong>{selectedJob.title}</strong>!
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-2">
                    <div className="font-semibold text-emerald-800">Sample Counter-Offer Email:</div>
                    <p className="font-mono text-[11px] leading-relaxed">
                      &quot;Thank you so much for extending this offer! Based on recent market data for {selectedJob.title} roles in {selectedJob.location || "this region"} and my hands-on experience, I am requesting a base salary adjustment to align with industry standard.&quot;
                    </p>
                  </div>
                </div>
              )}

              {getJobStatus(selectedJob.id) === "REJECTED" && (
                <div className="space-y-3 bg-red-50/70 p-4 rounded-xl border border-red-200/60">
                  <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" /> Application Archived & Post-Mortem Notes
                  </h3>
                  <p className="text-xs text-red-800">
                    Keep track of feedback to refine future applications. Stay persistent—every application brings you closer to your target offer!
                  </p>
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">Pipeline Stage:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["SAVED", "PREPARING", "APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED"].map((st) => (
                      <Button
                        key={st}
                        size="sm"
                        variant={getJobStatus(selectedJob.id) === st ? "default" : "outline"}
                        onClick={() => setJobStatus(selectedJob.id, st)}
                        className={`text-[11px] h-7 px-2.5 rounded-lg ${
                          getJobStatus(selectedJob.id) === st ? "bg-slate-900 text-white" : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {st}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedJob.applicationUrl && (
                  <div className="flex justify-end pt-2">
                    <a
                      href={selectedJob.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setJobStatus(selectedJob.id, "APPLIED");
                        setSelectedJob(null);
                      }}
                    >
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs h-9">
                        Apply Now <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
