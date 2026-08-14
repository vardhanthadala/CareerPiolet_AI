"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Lightbulb,
  Brain,
  Send,
  Bookmark,
  TrendingUp,
  Building2,
  ArrowRight,
  Loader2,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getJobStats, getMe, getMyProfile, fetchAdzunaJobs } from "@/lib/api";
import Link from "next/link";

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

export default function DashboardPage() {
  const [isFetchingAdzuna, setIsFetchingAdzuna] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await getMe();
      } catch { }
    })();
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["job-stats"],
    queryFn: getJobStats,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  const hasProfile = profile && profile.skills && profile.skills.length > 0;

  const statCards = [
    {
      label: "Jobs Indexed",
      value: stats?.totalJobs || 0,
      icon: BriefcaseBusiness,
      trend: "+12% this week",
      delay: 0.1
    },
    {
      label: "Companies",
      value: stats?.totalCompanies || 0,
      icon: Building2,
      trend: "Across 4 regions",
      delay: 0.2
    },
    {
      label: "AI Recommended",
      value: hasProfile ? `${Math.min(Math.floor((stats?.totalJobs || 0) * 0.12) || 12, 45)} matches` : "—",
      icon: Lightbulb,
      trend: hasProfile ? `${profile.skills.length} skills matched` : "Awaiting profile setup",
      delay: 0.3
    },
    {
      label: "Applications Sent",
      value: 0,
      icon: Send,
      trend: "0 pending responses",
      delay: 0.4
    },
  ];

  return (
    <div className="w-full space-y-10 py-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="text-3xl font-medium tracking-tight text-[#111827]">
          Welcome back, <br />
          <span className="text-slate-400">Let's find your next role.</span>
        </h1>
      </motion.div>

      {/* Primary Focus Bento */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Main large stat card */}
        <motion.div variants={fadeIn} className="md:col-span-2 group">
          <div className="h-full rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] p-8 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/60 bg-[#FAFAFA] text-[12px] text-slate-600 font-medium mb-6">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Live Job Feed
              </div>
              <h2 className="text-5xl font-medium text-[#111827] tracking-tight mb-2">
                {isLoading ? <Loader2 className="h-10 w-10 animate-spin text-slate-300" /> : stats?.totalJobs || 0}
              </h2>
              <p className="text-slate-500 text-[15px]">Total active opportunities in our network right now.</p>
            </div>

            <div className="relative z-10 mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center"><Building2 className="h-3 w-3 text-slate-400" /></div>
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center"><Building2 className="h-3 w-3 text-slate-400" /></div>
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center"><Building2 className="h-3 w-3 text-slate-400" /></div>
                </div>
                <span className="text-[13px] text-slate-500 font-medium">{stats?.totalCompanies || 0} companies hiring</span>
              </div>
              <Link href="/dashboard/jobs" className="group/btn inline-flex items-center gap-2 text-[13px] font-medium text-[#111827] hover:text-blue-600 transition-colors">
                Explore Feed <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Action card */}
        <motion.div variants={fadeIn} className="group cursor-pointer">
          <Link href="/dashboard/profile">
            <div className="h-full rounded-2xl bg-[#111827] text-white p-8 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
              <div className="relative z-10">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-medium tracking-tight mb-2">Enhance your AI Profile</h3>
                <p className="text-slate-400 text-[14px] leading-relaxed">Let CareerPilot understand your experience to generate high-precision matches.</p>
              </div>
              <div className="relative z-10 mt-8 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                <span className="text-[13px] font-medium">Update Profile</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + stat.delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-xl bg-white border border-slate-200/60 p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-500"><stat.icon className="h-5 w-5" /></div>
              </div>
              <div className="text-2xl font-medium text-[#111827] tracking-tight mb-1">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-300" /> : stat.value}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-slate-600">{stat.label}</p>
                <p className="text-[12px] text-slate-400">{stat.trend}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions (Minimal List) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid md:grid-cols-2 gap-6"
      >
        <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
          <h3 className="text-[15px] font-medium text-[#111827] mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              disabled={isFetchingAdzuna}
              onClick={async () => {
                try {
                  setIsFetchingAdzuna(true);
                  const queries = ["Data Scientist", "UI/UX Designer", "Product Manager", "Backend Engineer", "DevOps Engineer"];
                  const randomQuery = queries[Math.floor(Math.random() * queries.length)];
                  await fetchAdzunaJobs(randomQuery);
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                  setIsFetchingAdzuna(false);
                }
              }}
              className={`w-full text-left group flex items-center justify-between p-3 rounded-lg transition-colors border border-transparent ${isFetchingAdzuna ? 'bg-blue-50/50 cursor-not-allowed opacity-70' : 'hover:bg-blue-50 hover:border-blue-100'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 transition-all ${isFetchingAdzuna ? 'animate-pulse' : 'group-hover:bg-white group-hover:shadow-sm'}`}><TrendingUp className="h-4 w-4" /></div>
                <span className="text-[14px] font-medium text-blue-700">{isFetchingAdzuna ? "Fetching New Jobs..." : "Fetch Live Jobs (Adzuna)"}</span>
              </div>
              <ChevronRight className={`h-4 w-4 text-blue-300 transition-colors ${isFetchingAdzuna ? '' : 'group-hover:text-blue-600'}`} />
            </button>
            <Link href="/dashboard/jobs" className="group flex items-center justify-between p-3 rounded-lg hover:bg-[#FAFAFA] transition-colors border border-transparent hover:border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all"><BriefcaseBusiness className="h-4 w-4" /></div>
                <span className="text-[14px] font-medium text-slate-700">Browse Jobs Database</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </Link>
            <Link href="/dashboard/saved" className="group flex items-center justify-between p-3 rounded-lg hover:bg-[#FAFAFA] transition-colors border border-transparent hover:border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all"><Bookmark className="h-4 w-4" /></div>
                <span className="text-[14px] font-medium text-slate-700">View Saved Opportunities</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Source Breakdown (Minimalized) */}
        {stats?.bySource && stats.bySource.length > 0 && (
          <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] flex flex-col">
            <h3 className="text-[15px] font-medium text-[#111827] mb-6">Jobs by Source</h3>
            <div className="space-y-4 flex-1 justify-center flex flex-col">
              {stats.bySource.map((src: { source: string; count: number }) => (
                <div key={src.source} className="flex items-center gap-4">
                  <div className="w-24 text-[13px] font-medium capitalize text-slate-600">
                    {src.source}
                  </div>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full"
                      style={{ width: `${Math.min((src.count / stats.totalJobs) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="w-12 text-[13px] text-slate-400 text-right font-medium">
                    {src.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
