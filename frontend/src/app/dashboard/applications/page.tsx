"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  Send,
  MessageSquare,
  Trophy,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusConfig: Record<string, { icon: any; color: string; label: string; bg: string; text: string }> = {
  SAVED: { icon: Clock, color: "text-slate-400", label: "Saved", bg: "bg-slate-50", text: "text-slate-500" },
  PREPARING: { icon: FileText, color: "text-yellow-500", label: "Preparing", bg: "bg-yellow-50", text: "text-yellow-700" },
  APPLIED: { icon: Send, color: "text-blue-500", label: "Applied", bg: "bg-blue-50", text: "text-blue-700" },
  ASSESSMENT: { icon: FileText, color: "text-purple-500", label: "Assessment", bg: "bg-purple-50", text: "text-purple-700" },
  INTERVIEW: { icon: MessageSquare, color: "text-cyan-500", label: "Interview", bg: "bg-cyan-50", text: "text-cyan-700" },
  OFFER: { icon: Trophy, color: "text-green-500", label: "Offer", bg: "bg-green-50", text: "text-green-700" },
  REJECTED: { icon: XCircle, color: "text-red-500", label: "Rejected", bg: "bg-red-50", text: "text-red-700" },
};

export default function ApplicationsPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-[#111827]">
          <FileText className="h-6 w-6 text-[#111827]" />
          Applications
        </h1>
        <p className="text-slate-500 mt-1">
          Track your job applications and their statuses.
        </p>
      </div>

      {/* Status Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => (
          <Card
            key={key}
            className="bg-white border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <CardContent className="p-4 text-center flex flex-col items-center justify-center">
              <div className={`p-2 rounded-lg ${config.bg} mb-2`}>
                <config.icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="text-2xl font-medium text-[#111827] tracking-tight">0</div>
              <div className="text-[13px] font-medium text-slate-500 mt-1">
                {config.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
          <CardContent className="py-20 text-center">
            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Send className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-[17px] font-medium text-[#111827] tracking-tight mb-2">
              No applications yet
            </h3>
            <p className="text-slate-500 text-[14px] max-w-md mx-auto leading-relaxed">
              When you apply to jobs through CareerPilot AI, they'll appear
              here with real-time status tracking.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
