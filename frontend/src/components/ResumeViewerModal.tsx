"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  X,
  ExternalLink,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl?: string | null;
  docxHtml?: string | null;
  fileName?: string;
  isDocx?: boolean;
}

export function ResumeViewerModal({
  isOpen,
  onClose,
  fileUrl,
  docxHtml,
  fileName = "Resume",
  isDocx = false,
}: ResumeViewerModalProps) {
  const [scale, setScale] = useState<number>(1.2);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lock background body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load PDF with pdfjs-dist
  useEffect(() => {
    if (!isOpen || isDocx || !fileUrl) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const loadPdf = async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // Robust CDN worker URL
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        // Fetch ArrayBuffer directly to avoid browser CORS / URL streaming issues
        const res = await fetch(fileUrl);
        const arrayBuffer = await res.arrayBuffer();

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: "https://unpkg.com/pdfjs-dist@latest/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to load PDF via pdfjs-dist arrayBuffer:", err);
        if (isMounted) {
          setLoading(false);
          setPdfDoc(null);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fileUrl, isDocx]);

  // Render PDF pages on canvas
  useEffect(() => {
    if (!pdfDoc || isDocx) return;

    let isCancelled = false;

    const renderPages = async () => {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (isCancelled) break;
        try {
          const page = await pdfDoc.getPage(i);
          const canvas = canvasRefs.current[i - 1];
          if (!canvas) continue;

          const context = canvas.getContext("2d");
          if (!context) continue;

          const viewport = page.getViewport({ scale });
          const outputScale = window.devicePixelRatio || 1;

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

          await page.render({
            canvasContext: context,
            viewport,
            transform,
          }).promise;
        } catch (e) {
          console.error(`Error rendering page ${i}:`, e);
        }
      }
    };

    renderPages();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, scale, isDocx]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.18)] border border-slate-200/80 max-w-5xl w-full h-[92vh] max-h-[92vh] min-h-0 flex flex-col overflow-hidden text-slate-900"
        >
          {/* Topbar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-white/95 backdrop-blur-md shrink-0">
            {/* Title & Metadata */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-slate-900 truncate">
                    {fileName}
                  </h3>
                  <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {isDocx ? "DOCX" : "PDF"}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  {numPages > 0 ? `${numPages} Page${numPages > 1 ? "s" : ""} • ` : ""}
                  AWS S3 Verified
                </p>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              {!isDocx && pdfDoc && (
                <div className="flex items-center bg-slate-100/80 rounded-xl p-0.5 border border-slate-200/60 mr-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setScale((s) => Math.max(0.8, Number((s - 0.15).toFixed(2))))}
                    className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[11px] font-medium text-slate-600 px-2 min-w-[3rem] text-center select-none">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setScale((s) => Math.min(2.0, Number((s + 0.15).toFixed(2))))}
                    className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={fileName}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8.5 px-3 text-xs font-medium gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Open in Tab</span>
                  </Button>
                </a>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 h-8.5 w-8.5 transition-all ml-1"
              >
                <X className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>

          {/* Workspace Viewer Body */}
          <div
            ref={containerRef}
            tabIndex={0}
            className="flex-1 min-h-0 w-full bg-slate-100/80 overflow-y-auto overflow-x-auto custom-scrollbar p-4 md:p-8 pb-16 flex flex-col items-center gap-6 touch-pan-y overscroll-contain focus:outline-none"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <p className="text-xs font-medium">Rendering document preview...</p>
              </div>
            ) : isDocx ? (
              <div className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl border border-slate-200/90 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.08)] p-10 md:p-14 prose prose-slate max-w-none text-[13px] leading-relaxed font-sans min-h-[70vh] shrink-0 mb-8">
                <div dangerouslySetInnerHTML={{ __html: docxHtml || "<p>Document ready</p>" }} />
              </div>
            ) : pdfDoc ? (
              // Canvas-based crisp PDF sheets with shrink-0 to prevent flex compression
              <div className="flex flex-col items-center gap-6 w-full shrink-0 pb-12">
                {Array.from({ length: numPages }, (_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.09)] overflow-hidden transition-transform duration-150 flex justify-center shrink-0"
                  >
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[index] = el;
                      }}
                      className="block shrink-0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Fallback iframe with framed container
              <div className="w-full max-w-4xl h-full min-h-[75vh] bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden shrink-0">
                <iframe
                  src={`${fileUrl || ""}#view=FitH&toolbar=0&navpanes=0`}
                  title="Resume Document"
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
