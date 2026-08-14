"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bookmark,
  Building2,
  MapPin,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSavedJobs, unsaveJob, setAuthToken } from "@/lib/api";
import Link from "next/link";

export default function SavedJobsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: getSavedJobs,
  });

  const handleUnsave = async (jobId: string) => {
    try {
      await unsaveJob(jobId);
      refetch();
    } catch {
      // handle error
    }
  };

  const savedJobs = Array.isArray(data) ? data : [];

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
          <Bookmark className="h-6 w-6 text-slate-900" />
          Saved Jobs
        </h1>
        <p className="text-slate-500">
          {savedJobs.length} saved {savedJobs.length === 1 ? "job" : "jobs"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : savedJobs.length === 0 ? (
        <Card className="bg-white border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
          <CardContent className="py-16 text-center">
            <Bookmark className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-slate-900">No saved jobs yet</h3>
            <p className="text-slate-500 text-sm mb-4">
              Browse jobs and click the bookmark icon to save them here.
            </p>
            <Link href="/dashboard/jobs">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm transition-all">
                Browse Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {savedJobs.map((saved: any, i: number) => (
            <motion.div
              key={saved.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-white border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/jobs/${saved.job.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {saved.job.title}
                    </Link>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {saved.job.company?.name}
                      </span>
                      {saved.job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {saved.job.location}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {saved.job.workplaceType && (
                        <Badge variant="secondary" className="text-xs">
                          {saved.job.workplaceType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
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
                        <Button size="sm" variant="outline">
                          Apply
                          <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
