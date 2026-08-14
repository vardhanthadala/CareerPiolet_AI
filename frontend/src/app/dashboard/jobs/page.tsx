"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Building2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchJobs, saveJob, unsaveJob, getSavedJobs, getMyApplications, setAuthToken } from "@/lib/api";
import Link from "next/link";

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [workplaceType, setWorkplaceType] = useState("");
  const [postedWithin, setPostedWithin] = useState("");
  const [page, setPage] = useState(1);
  const [hideApplied, setHideApplied] = useState(false);

  const { data: savedData } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: getSavedJobs,
  });

  // Fetch real application statuses from the Applications table
  const { data: applicationsData } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

  // Map jobId -> application status (e.g. "APPLIED", "INTERVIEW", "OFFER")
  const applicationStatusMap = new Map<string, string>();
  if (Array.isArray(applicationsData)) {
    applicationsData.forEach((app: any) => {
      if (app.jobId) applicationStatusMap.set(app.jobId, app.status);
    });
  }

  // Saved job IDs (bookmarks) — separate from applied status
  const savedJobIds = new Set<string>();
  if (Array.isArray(savedData)) {
    savedData.forEach((s: any) => {
      const id = s.jobId || s.job?.id;
      if (id) savedJobIds.add(id);
    });
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["jobs", query, location, workplaceType, postedWithin, page],
    queryFn: () =>
      searchJobs({
        ...(query && { query }),
        ...(location && { location }),
        ...(workplaceType && { workplaceType }),
        ...(postedWithin && { postedWithin }),
        page: String(page),
        limit: "12",
      }),
  });

  const rawJobs = data?.jobs || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  // Filter out or sort applied jobs to bottom
  let displayJobs = [...rawJobs];
  if (hideApplied) {
    displayJobs = displayJobs.filter((job: any) => {
      const st = applicationStatusMap.get(job.id);
      return !st || st === "SAVED" || st === "PREPARING";
    });
  }

  // Sort unapplied jobs first
  displayJobs.sort((a: any, b: any) => {
    const aApplied = ["APPLIED", "INTERVIEW", "OFFER", "ASSESSMENT"].includes(applicationStatusMap.get(a.id) || "");
    const bApplied = ["APPLIED", "INTERVIEW", "OFFER", "ASSESSMENT"].includes(applicationStatusMap.get(b.id) || "");
    if (aApplied && !bApplied) return 1;
    if (!aApplied && bApplied) return -1;
    return 0;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const toggleSave = async (jobId: string) => {
    try {
      if (savedJobIds.has(jobId)) {
        await unsaveJob(jobId);
      } else {
        await saveJob(jobId);
      }
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    } catch (e) {
      console.error("Save job error:", e);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Browse Jobs</h1>
        <p className="text-slate-500 mt-1">
          {pagination.total > 0
            ? `${pagination.total.toLocaleString()} jobs available`
            : "Search across all indexed positions"}
        </p>
      </div>

      {/* Search & Filters */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Job title, skills, or keywords..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="relative flex-1 md:max-w-[200px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <Select
              value={workplaceType}
              onValueChange={(v: string | null) => {
                setWorkplaceType(!v || v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[160px] h-10 bg-slate-50 border-slate-200 text-slate-900">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Work Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="REMOTE">Remote</SelectItem>
                <SelectItem value="ONSITE">Onsite</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={postedWithin}
              onValueChange={(v: string | null) => {
                setPostedWithin(!v || v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[160px] h-10 bg-slate-50 border-slate-200 text-slate-900">
                <Clock className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Date Posted" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Time</SelectItem>
                <SelectItem value="today">Past 24 Hours</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={hideApplied ? "default" : "outline"}
              onClick={() => setHideApplied(!hideApplied)}
              className={`h-10 text-xs font-medium rounded-lg transition-all ${
                hideApplied
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "border-slate-200/80 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {hideApplied ? "Showing Unapplied Jobs" : "Hide Applied Jobs"}
            </Button>
            <Button
              type="submit"
              className="h-10 px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all font-medium rounded-lg"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Job List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : displayJobs.length === 0 ? (
        <Card className="bg-white border-slate-200/60 shadow-sm">
          <CardContent className="py-20 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-[17px] font-medium text-[#111827] mb-2 tracking-tight">No jobs found</h3>
            <p className="text-slate-500 text-[14px] max-w-md mx-auto">
              {pagination.total === 0 && !query
                ? "No jobs have been indexed yet. Seed companies and fetch jobs from the backend to get started."
                : "Try adjusting your search filters or keywords."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {displayJobs.map((job: any, i: number) => {
            const stage = applicationStatusMap.get(job.id);
            const isApplied = ["APPLIED", "INTERVIEW", "OFFER", "ASSESSMENT"].includes(stage || "");

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`bg-white border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group ${isApplied ? "opacity-75 bg-slate-50/50" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link
                            href={`/dashboard/jobs/${job.id}`}
                            className="text-[17px] font-medium text-[#111827] hover:text-blue-600 transition-colors truncate tracking-tight"
                          >
                            {job.title}
                          </Link>
                          {isApplied && (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold px-2 py-0.5 flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              {stage}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[13px] font-medium text-slate-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {job.company?.name || job.source}
                          </span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                          )}
                          {job.postedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(job.postedAt)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {job.workplaceType && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent font-medium"
                            >
                              {job.workplaceType}
                            </Badge>
                          )}
                          {job.department && (
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent font-medium">
                              {job.department}
                            </Badge>
                          )}
                          {job.commitment && (
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent font-medium">
                              {job.commitment}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="text-xs capitalize text-slate-500 border-slate-200"
                          >
                            {job.source}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSave(job.id)}
                          className="h-9 w-9"
                        >
                          {savedJobIds.has(job.id) ? (
                            <BookmarkCheck className="h-4 w-4 text-[#111827]" />
                          ) : (
                            <Bookmark className="h-4 w-4 text-slate-400 group-hover:text-[#111827] transition-colors" />
                          )}
                        </Button>
                        {job.applicationUrl && (
                          <a
                            href={job.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm transition-all font-medium"
                            >
                              Apply
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-500 px-4 font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
