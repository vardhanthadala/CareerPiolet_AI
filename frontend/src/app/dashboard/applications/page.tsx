"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-[#111827]">
          <FileText className="h-6 w-6 text-[#111827]" />
          Applications
        </h1>
        <p className="text-slate-500 mt-1">
          Track your job applications and their real-time statuses.
        </p>
      </div>

      {/* Status Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = key === "SAVED" ? savedJobs.length : 0;
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
            {savedJobs.map((saved: any, i: number) => (
              <motion.div
                key={saved.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-white border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all">
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-slate-100 text-slate-700 border-0 text-[11px]">
                          SAVED
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

                    <div className="flex items-center gap-2 shrink-0">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
