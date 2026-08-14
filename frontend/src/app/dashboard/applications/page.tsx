"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Sparkles,
  CheckCircle2,
  X,
  Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSavedJobs, unsaveJob } from "@/lib/api";
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
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: getSavedJobs,
  });

  const handleUnsave = async (jobId: string) => {
    try {
      await unsaveJob(jobId);
      refetch();
    } catch {}
  };

  const savedJobs = Array.isArray(data) ? data : [];

  const getJobStatus = (jobId: string) => statusMap[jobId] || "SAVED";

  const setJobStatus = (jobId: string, status: string) => {
    setStatusMap((prev) => ({ ...prev, [jobId]: status }));
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
                            setSelectedJob(saved.job);
                          }}
                          className="border-slate-200 hover:bg-yellow-50 hover:text-yellow-700 transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
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
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6"
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

              {/* AI Tailored Resume Highlights */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" /> Tailored Resume Bullet Points
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        `• Engineered scalable ${selectedJob.title} features using React & Node.js matching requirements.\n• Optimized database performance for high-throughput API endpoints.\n• Led cross-functional sprint deliveries ensuring quality code standard.`,
                        "bullets"
                      )
                    }
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    {copiedType === "bullets" ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy Bullets
                      </>
                    )}
                  </Button>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li>Engineered scalable {selectedJob.title} features matching company technical stack requirements.</li>
                  <li>Optimized database & API query performance for high-throughput user interactions.</li>
                  <li>Collaborated in agile sprint deliveries to ship production-ready features.</li>
                </ul>
              </div>

              {/* AI Tailored Cover Letter */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" /> AI Tailored Cover Letter
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        `Dear Hiring Team at ${selectedJob.company?.name || "the company"},\n\nI am writing to express my strong enthusiasm for the ${selectedJob.title} position. With my expertise in full-stack software development and problem solving, I am confident in delivering high impact for your team.`,
                        "cover"
                      )
                    }
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    {copiedType === "cover" ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy Letter
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-mono bg-white p-3 rounded-lg border border-slate-200">
                  Dear Hiring Team at {selectedJob.company?.name || "the company"},<br /><br />
                  I am writing to express my strong enthusiasm for the <strong>{selectedJob.title}</strong> position. With my background in software engineering and track record of building reliable software, I am confident in contributing immediately to your core product goals.
                </p>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Update Status:</span>
                  {["PREPARING", "APPLIED", "INTERVIEW"].map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={getJobStatus(selectedJob.id) === st ? "default" : "outline"}
                      onClick={() => setJobStatus(selectedJob.id, st)}
                      className="text-xs h-8"
                    >
                      {st}
                    </Button>
                  ))}
                </div>

                {selectedJob.applicationUrl && (
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
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
