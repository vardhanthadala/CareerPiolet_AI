"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  ExternalLink,
  Bookmark,
  Globe,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getJob, setAuthToken } from "@/lib/api";
import Link from "next/link";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Job not found</h2>
      </div>
    );
  }

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Back button */}
      <Link href="/dashboard/jobs">
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
      </Link>

      {/* Job Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#e947f5] to-[#7a95e6]" />
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    {job.company?.name || "Unknown Company"}
                  </span>
                  {job.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                  )}
                  {job.postedAt && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {formatDate(job.postedAt)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {job.workplaceType && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      {job.workplaceType}
                    </Badge>
                  )}
                  {job.department && (
                    <Badge variant="secondary">{job.department}</Badge>
                  )}
                  {job.commitment && (
                    <Badge variant="secondary">{job.commitment}</Badge>
                  )}
                  {job.source && (
                    <Badge variant="outline" className="capitalize">
                      via {job.source}
                    </Badge>
                  )}
                </div>

                {(job.salaryMin || job.salaryMax) && (
                  <div className="mt-4 text-lg font-semibold text-emerald-600">
                    {job.salaryCurrency || "$"}
                    {job.salaryMin?.toLocaleString()}
                    {job.salaryMax ? ` – ${job.salaryMax.toLocaleString()}` : "+"}
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon">
                  <Bookmark className="h-4 w-4" />
                </Button>
                {job.applicationUrl && (
                  <a
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm transition-all">
                      Apply Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Job Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-slate prose-sm max-w-none
                prose-headings:text-slate-900 prose-headings:font-semibold
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-li:text-slate-600
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-900"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Job URL */}
      {job.jobUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Globe className="h-4 w-4 text-slate-500" />
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline truncate"
              >
                {job.jobUrl}
              </a>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
