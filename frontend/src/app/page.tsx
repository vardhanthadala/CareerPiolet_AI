"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Target,
  FileText,
  BarChart3,
  Zap,
  ArrowRight,
  Brain,
  ChevronRight,
} from "lucide-react";
import { redirect } from "next/navigation";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: Search,
    title: "Smart Job Discovery",
    description: "Automatically aggregates jobs from Greenhouse, Lever, Ashby, and more. Thousands of opportunities in one place.",
    colSpan: "md:col-span-2",
  },
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Semantic understanding of your skills and experience. Get a compatibility score for every job with clear explanations.",
    colSpan: "md:col-span-1",
  },
  {
    icon: Target,
    title: "Precision Recommendations",
    description: "Multi-stage filtering pipeline: basic filters → embeddings → rule-based scoring → LLM evaluation for top matches.",
    colSpan: "md:col-span-1",
  },
  {
    icon: FileText,
    title: "Tailored Applications",
    description: "AI generates job-specific resumes, cover letters, and application answers. Never send a generic application again.",
    colSpan: "md:col-span-2",
  },
  {
    icon: BarChart3,
    title: "Application Tracker",
    description: "Track every application from saved → applied → interview → offer. Full visibility into your job search.",
    colSpan: "md:col-span-1",
  },
  {
    icon: Zap,
    title: "Skill Gap Analysis",
    description: "Know exactly what skills you're missing and get recommendations to boost your match scores.",
    colSpan: "md:col-span-2",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload Your Resume",
    description: "AI extracts your skills, experience, and preferences automatically with semantic understanding.",
  },
  {
    number: "02",
    title: "Discover Jobs",
    description: "Thousands of premium roles collected from authorized sources, normalized into a single feed.",
  },
  {
    number: "03",
    title: "AI Matching",
    description: "Every job gets a compatibility score with detailed explanations and gap analysis.",
  },
  {
    number: "04",
    title: "Apply with Confidence",
    description: "Generate tailored resumes and cover letters specifically optimized for your top matches.",
  },
];

export default function LandingPage() {
  // Hide the landing page by redirecting to the dashboard
  redirect("/dashboard");

  return (
    <div className="flex flex-col min-h-screen text-[#111827] font-sans antialiased selection:bg-slate-200 overflow-hidden relative bg-[#FAFAFA]">
      
      {/* Absolute Dot Pattern Background overlaying the whole page softly */}
      <div className="absolute inset-0 z-0 bg-dot-pattern opacity-50 pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#E5E7EB]/50 bg-[#FAFAFA]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded-md bg-[#111827] flex items-center justify-center transition-transform group-hover:scale-105 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)]">
              <span className="text-[10px] font-bold text-white tracking-tighter">CP</span>
            </div>
            <span className="text-[15px] font-medium tracking-tight text-[#111827]">
              CareerPilot<span className="text-slate-400 font-normal">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-[13px] font-medium text-slate-500 hover:text-[#111827] transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/dashboard">
              <button className="h-8 px-4 rounded-full bg-[#111827] text-white font-medium text-[13px] hover:bg-[#1F2937] transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15),0_1px_4px_-1px_rgba(0,0,0,0.1)] active:scale-95 flex items-center justify-center gap-1.5">
                Dashboard
                <ChevronRight className="h-3.5 w-3.5 opacity-70" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex flex-1 w-full flex-col z-10">
        {/* Hero Section */}
        <section className="w-full relative min-h-[90vh] pt-32 pb-16 flex items-center justify-center">
          <motion.div
            style={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col justify-center items-center relative z-10"
          >
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto w-full">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/60 bg-white/50 text-[12px] text-slate-600 backdrop-blur-md shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] font-medium">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  CareerPilot AI is now in Beta
                </div>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl sm:text-6xl md:text-8xl font-medium text-[#111827] tracking-[-0.04em] leading-[1.05] sm:leading-[1] mb-8 font-sans text-center"
              >
                Find work that <br />
                <span className="text-slate-400">actually matters.</span>
              </motion.h1>

              {/* Subtitle Paragraph */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-slate-500 text-[17px] sm:text-[19px] font-normal max-w-2xl leading-[1.6] mb-10 px-2 tracking-[-0.01em]"
              >
                Upload your resume once. CareerPilot AI discovers roles, scores compatibility, and crafts tailored applications—working as your dedicated career agent 24/7.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto"
              >
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto h-12 px-8 rounded-full bg-[#111827] text-white font-medium text-[15px] hover:bg-[#1F2937] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] hover:-translate-y-[1px] active:scale-95 flex items-center justify-center gap-2">
                    Start your journey
                    <ArrowRight className="h-4 w-4 opacity-70" />
                  </button>
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto flex items-center justify-center h-12 px-8 rounded-full bg-white text-[#111827] border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition-all text-[15px] font-medium shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                >
                  Explore features
                </a>
              </motion.div>
            </div>

            {/* Subtle Abstract Mockup Graphic */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-5xl mx-auto mt-20 px-6 hidden sm:block relative"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] to-transparent z-10 h-full w-full pointer-events-none" />
              <div className="w-full h-64 md:h-96 rounded-t-3xl border border-slate-200/60 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden relative">
                <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="flex-1 flex items-start justify-center pt-12 opacity-40">
                  <div className="w-3/4 h-32 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-4 p-6">
                    <div className="h-4 w-1/3 bg-slate-200 rounded-md" />
                    <div className="h-4 w-full bg-slate-100 rounded-md" />
                    <div className="h-4 w-2/3 bg-slate-100 rounded-md" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section (Bento Grid) */}
        <section id="features" className="w-full bg-white py-32 border-t border-slate-200/60 relative z-10">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#111827] mb-6">
                Intelligence designed for <br />
                <span className="text-slate-400">your career growth.</span>
              </h2>
              <p className="text-slate-500 text-lg max-w-2xl font-normal leading-relaxed tracking-[-0.01em]">
                An entire suite of AI tools working together to simplify your job hunt. High-precision matching, tailored applications, and robust tracking.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className={`group p-8 rounded-3xl bg-[#FAFAFA] border border-slate-200/60 hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500 ${feature.colSpan}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div
                    className="inline-flex p-3 rounded-xl bg-white border border-slate-200/60 mb-6 text-slate-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-[19px] font-medium text-[#111827] mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-500 text-[15px] leading-relaxed tracking-[-0.01em]">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works (Minimalist Steps) */}
        <section className="w-full bg-[#FAFAFA] py-32 border-t border-slate-200/60 relative z-10">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#111827]">
                Four steps to hired.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-12">
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  className="flex flex-col items-start border-l-2 border-slate-200/60 pl-6 relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Subtle node marker */}
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-300" />
                  
                  <div className="text-[13px] font-medium text-slate-400 mb-4 tracking-widest uppercase">
                    Step {step.number}
                  </div>
                  <h3 className="text-[17px] font-medium text-[#111827] mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-slate-500 text-[14px] leading-relaxed tracking-[-0.01em]">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full bg-white py-32 border-t border-slate-200/60 relative z-10 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-dot-pattern opacity-50 pointer-events-none" />
          <motion.div
            className="max-w-4xl mx-auto text-center px-6 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#111827] mb-8 leading-[1.1]">
              Transform your <br />
              <span className="text-slate-400">job search today.</span>
            </h2>
            <Link href="/dashboard" className="inline-block">
              <button className="h-14 px-8 rounded-full bg-[#111827] text-white font-medium text-[15px] hover:bg-[#1F2937] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-[1px] active:scale-95 flex items-center justify-center gap-2">
                Start using CareerPilot AI
                <ArrowRight className="h-4 w-4 opacity-70" />
              </button>
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/60 bg-[#FAFAFA] py-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-[#111827] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white tracking-tighter">CP</span>
            </div>
            <span className="text-[#111827]">CareerPilot AI</span>
          </div>
          <p>© {new Date().getFullYear()} CareerPilot AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
