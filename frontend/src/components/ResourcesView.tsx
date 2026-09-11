import React, { useState, useEffect } from "react";
import { Folder, FileText, ExternalLink, Search, Video, File, ChevronDown, PlayCircle, Eye, Tag, Library, Layers, ChevronLeft, ChevronRight, Sparkles, Volume2, BookOpen } from "lucide-react";
import { LearnHubModule, LearnHubSourceFile, Batch, LearnHubParagraph, LearnHubSlide, ScheduledMeeting } from "./../types";

export interface ResourcesViewProps {
  batch: Batch;
  modules: LearnHubModule[];
  scheduledMeetings?: ScheduledMeeting[];
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ batch, modules, scheduledMeetings = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<"files" | "text" | "recordings" | null>("files");

  const filteredModules = modules.filter(m => 
    (m.batchId === batch.id) &&
    (m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Text folder state
  const [selectedTextModuleId, setSelectedTextModuleId] = useState<string>("");
  const [selectedTextSlideId, setSelectedTextSlideId] = useState<string>("module");
  const [hoveredTag, setHoveredTag] = useState<{ term: string, definition: string, x: number, y: number } | null>(null);

  // Initialize selected module
  useEffect(() => {
    if (!selectedTextModuleId && filteredModules.length > 0) {
      setSelectedTextModuleId(filteredModules[0].id);
      
      const firstMod = filteredModules[0];
      if (firstMod.slides && firstMod.slides.length > 0) {
        setSelectedTextSlideId(firstMod.slides[0].id);
      } else {
        setSelectedTextSlideId("module");
      }
    }
  }, [filteredModules, selectedTextModuleId]);

  // Handle module change
  const handleModuleChange = (moduleId: string) => {
    setSelectedTextModuleId(moduleId);
    const mod = filteredModules.find(m => m.id === moduleId);
    if (mod && mod.slides && mod.slides.length > 0) {
      setSelectedTextSlideId(mod.slides[0].id);
    } else {
      setSelectedTextSlideId("module");
    }
  };

  // Collect all files
  const allFiles: { module: LearnHubModule, file: LearnHubSourceFile }[] = [];
  filteredModules.forEach(m => {
    if (m.sourceFile) allFiles.push({ module: m, file: m.sourceFile });
    if (m.sourceFiles) m.sourceFiles.forEach(f => allFiles.push({ module: m, file: f }));
  });

  const getTagClass = (cssClass: string) => {
    if (cssClass.includes("orange")) return "bg-orange-100 text-orange-800 border-orange-200";
    if (cssClass.includes("blue")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (cssClass.includes("green")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (cssClass.includes("purple")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (cssClass.includes("rose")) return "bg-rose-100 text-rose-800 border-rose-200";
    if (cssClass.includes("indigo")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const handleTagHover = (e: React.MouseEvent, term: string, definition: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredTag({
      term,
      definition,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const selectedTextModule = filteredModules.find(m => m.id === selectedTextModuleId) || filteredModules[0];
  const slides = selectedTextModule?.slides || [];
  const currentSlideIndex = slides.findIndex(s => s.id === selectedTextSlideId);
  const currentSlide = currentSlideIndex !== -1 ? slides[currentSlideIndex] : null;

  let activeParagraphs: LearnHubParagraph[] = [];
  if (selectedTextSlideId === "module") {
    if (selectedTextModule?.paragraphs) activeParagraphs = selectedTextModule.paragraphs;
  } else if (currentSlide) {
    if (currentSlide.paragraphs) activeParagraphs = currentSlide.paragraphs;
  }

  return (
    <div className="flex-1 bg-slate-50 h-full overflow-y-auto relative">
      
      {/* Tooltip for highlighted tags */}
      {hoveredTag && (
        <div 
          className="fixed z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl max-w-xs text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ top: hoveredTag.y, left: hoveredTag.x }}
        >
          <div className="font-bold mb-1 text-indigo-300">{hoveredTag.term}</div>
          <div className="text-slate-300 leading-relaxed">{hoveredTag.definition || "No definition provided."}</div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Library className="w-10 h-10 text-indigo-600" />
              Resources Hub
            </h1>
            <p className="mt-2 text-slate-500 font-medium max-w-2xl text-base sm:text-lg">
              Centralized repository for {batch.name} - {batch.programType}
            </p>
          </div>
        </div>

        {/* Global Bootcamp Folder */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200 bg-slate-50">
            <button 
              onClick={() => setActiveFolder("files")}
              className={`p-4 flex items-center justify-center gap-3 font-bold transition-colors ${activeFolder === "files" ? "bg-white text-indigo-700 border-b-2 border-indigo-600" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <FileText className="w-5 h-5" />
              Uploaded Documents ({allFiles.length})
            </button>
            <button 
              onClick={() => setActiveFolder("text")}
              className={`p-4 flex items-center justify-center gap-3 font-bold transition-colors ${activeFolder === "text" ? "bg-white text-orange-700 border-b-2 border-orange-600" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <Tag className="w-5 h-5" />
              Text Materials & Tags
            </button>
            <button 
              onClick={() => setActiveFolder("recordings")}
              className={`p-4 flex items-center justify-center gap-3 font-bold transition-colors ${activeFolder === "recordings" ? "bg-white text-emerald-700 border-b-2 border-emerald-600" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <Video className="w-5 h-5" />
              Class Recordings ({batch.zoomConfig?.recordingUrl ? 1 : 0})
            </button>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50/50 min-h-[500px]">
            
            {/* 1. UPLOADED FILES FOLDER */}
            {activeFolder === "files" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-indigo-500" /> All Presentations & Documents
                </h3>
                {allFiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allFiles.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between group">
                        <div>
                          <div className="flex items-start gap-3 overflow-hidden mb-4">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                              <File className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate" title={item.file.name}>{item.file.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.file.type} • {item.file.size}</p>
                            </div>
                          </div>
                          <div className="px-3 py-1.5 bg-slate-50 rounded-md text-xs font-medium text-slate-500 truncate mb-4">
                            Module: {item.module.title}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (item.file.previewUrl) {
                              const cleanUrl = item.file.previewUrl.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
                              window.open(cleanUrl, '_blank');
                            } else {
                              alert('Open Learn Hub to preview full file contents inline.');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 py-2.5 rounded-lg text-sm font-bold transition-colors border border-slate-200 hover:border-indigo-200 cursor-pointer"
                        >
                          {item.file.previewUrl ? <ExternalLink className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          Preview File
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No documents uploaded to this bootcamp yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. TEXT MATERIALS & TAGS FOLDER */}
            {activeFolder === "text" && (
              <div className="space-y-6">
                
                {/* Module Dropdown Area (Above Slide Card) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1 max-w-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Select Module
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTextModuleId}
                        onChange={(e) => handleModuleChange(e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        {filteredModules.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* SLIDE NAVIGATION BAR (Exactly like LearnHub) */}
                {selectedTextModule && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Slide:
                      </span>

                      <button
                        disabled={currentSlideIndex <= 0}
                        onClick={() => {
                          if (currentSlideIndex > 0) {
                            setSelectedTextSlideId(slides[currentSlideIndex - 1].id);
                          } else if (currentSlideIndex === 0) {
                            setSelectedTextSlideId("module");
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition flex-shrink-0 cursor-pointer"
                        title="Previous Slide"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Slide Dropdown Selector */}
                      <div className="relative flex-1 min-w-[200px] sm:max-w-md">
                        <select
                          value={selectedTextSlideId}
                          onChange={(e) => setSelectedTextSlideId(e.target.value)}
                          className="w-full appearance-none bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-900 text-xs sm:text-sm font-bold rounded-xl py-2 pl-3 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm transition truncate"
                        >
                          <option value="module">Main Module Description</option>
                          {slides.map((s) => (
                            <option key={s.id} value={s.id}>
                              Slide {s.slideNumber}: {s.title} {s.badge ? `• ${s.badge}` : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>

                      <button
                        disabled={currentSlideIndex === slides.length - 1}
                        onClick={() => {
                          if (selectedTextSlideId === "module" && slides.length > 0) {
                            setSelectedTextSlideId(slides[0].id);
                          } else if (currentSlideIndex >= 0 && currentSlideIndex < slides.length - 1) {
                            setSelectedTextSlideId(slides[currentSlideIndex + 1].id);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition flex-shrink-0 cursor-pointer"
                        title="Next Slide"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <div className="hidden sm:flex items-center justify-center px-3 py-1.5 bg-slate-100/80 rounded-lg text-xs font-bold text-slate-500 flex-shrink-0 border border-slate-200/50">
                        {selectedTextSlideId === "module" ? "Intro" : `${currentSlideIndex + 1} of ${slides.length}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* THE SLIDE CARD ITSELF */}
                {selectedTextModule && (
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col p-8 sm:p-12 relative min-h-[500px]">
                    
                    {/* Top Header Row with Badge, Arrows & Read Aloud */}
                    <div className="flex items-center justify-between gap-3 mb-8">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-extrabold text-xs tracking-wider uppercase">
                          <Sparkles className="w-3.5 h-3.5" />
                          {currentSlide?.badge || selectedTextModule.badge || (currentSlide ? `SLIDE ${currentSlideIndex + 1} • CORE CONCEPTS` : "MODULE INTRO")}
                        </div>

                        {slides.length > 0 && (
                          <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/70">
                            <button
                              disabled={currentSlideIndex <= 0}
                              onClick={() => {
                                if (currentSlideIndex > 0) {
                                  setSelectedTextSlideId(slides[currentSlideIndex - 1].id);
                                } else if (currentSlideIndex === 0) {
                                  setSelectedTextSlideId("module");
                                }
                              }}
                              className="p-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-extrabold text-slate-700 px-1.5">
                              {selectedTextSlideId === "module" ? "Intro" : `${currentSlideIndex + 1} / ${slides.length}`}
                            </span>
                            <button
                              disabled={currentSlideIndex === slides.length - 1}
                              onClick={() => {
                                if (selectedTextSlideId === "module" && slides.length > 0) {
                                  setSelectedTextSlideId(slides[0].id);
                                } else if (currentSlideIndex >= 0 && currentSlideIndex < slides.length - 1) {
                                  setSelectedTextSlideId(slides[currentSlideIndex + 1].id);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-2.5">
                      {currentSlide?.title || selectedTextModule.title}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-slate-500 text-sm sm:text-base mb-8 leading-relaxed font-medium">
                      {currentSlide?.subtitle || selectedTextModule.subtitle}
                    </p>

                    {/* Paragraphs with Interactive Highlight Badges (Tooltips only) */}
                    <div className="space-y-6 text-slate-700 text-base sm:text-[17px] leading-relaxed font-normal flex-1">
                      {activeParagraphs && activeParagraphs.length > 0 ? (
                        activeParagraphs.map((para, idx) => (
                          <p key={idx} className="transition-colors">
                            {para.textBefore}
                            {para.highlight ? (
                              <span 
                                className={`inline-block px-1.5 py-0.5 rounded text-sm font-bold border ${getTagClass(para.highlight.cssClass)} mx-1 cursor-help hover:opacity-80 transition-opacity`} 
                                onMouseEnter={(e) => handleTagHover(e, para.highlight!.term, para.highlight!.definition)}
                                onMouseLeave={() => setHoveredTag(null)}
                              >
                                {para.highlight.term}
                              </span>
                            ) : null}
                            {para.textAfter}
                          </p>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-slate-500 text-sm font-bold">No paragraphs added to this slide yet.</p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Slide Deck Navigation Buttons */}
                    <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        disabled={currentSlideIndex <= 0}
                        onClick={() => {
                          if (currentSlideIndex > 0) {
                            setSelectedTextSlideId(slides[currentSlideIndex - 1].id);
                          } else if (currentSlideIndex === 0) {
                            setSelectedTextSlideId("module");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 text-slate-700 text-sm font-extrabold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-sm group"
                      >
                        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="hidden sm:inline">Previous Slide</span>
                        <span className="sm:hidden">Prev</span>
                      </button>

                      <div className="flex gap-2 items-center">
                        <div className={`w-6 h-1.5 rounded-full ${selectedTextSlideId === "module" ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                        {slides.map(s => (
                          <div key={s.id} className={`w-2 h-1.5 rounded-full ${selectedTextSlideId === s.id ? "bg-indigo-600 w-6" : "bg-slate-200"} transition-all`}></div>
                        ))}
                      </div>

                      <button
                        disabled={currentSlideIndex === slides.length - 1}
                        onClick={() => {
                          if (selectedTextSlideId === "module" && slides.length > 0) {
                            setSelectedTextSlideId(slides[0].id);
                          } else if (currentSlideIndex >= 0 && currentSlideIndex < slides.length - 1) {
                            setSelectedTextSlideId(slides[currentSlideIndex + 1].id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold transition shadow-md disabled:opacity-30 disabled:pointer-events-none cursor-pointer group"
                      >
                        <span className="hidden sm:inline">{currentSlideIndex === slides.length - 1 ? "Finish Module" : "Next Slide"}</span>
                        <span className="sm:hidden">Next</span>
                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* 3. RECORDINGS FOLDER */}
            {activeFolder === "recordings" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-emerald-500" /> Class Recordings
                </h3>
                
                {(() => {
                  const meetingsWithRecordings = scheduledMeetings.filter(
                    (m) => m.batchId === batch.id && m.recordingUrl && m.isRecordingUnlocked !== false
                  );

                  const allRecordings = meetingsWithRecordings.length > 0
                    ? meetingsWithRecordings
                    : batch.zoomConfig?.recordingUrl
                    ? [
                        {
                          id: "default-rec",
                          title: batch.zoomConfig.summary?.title || `${batch.name} Live Session Recording`,
                          recordingUrl: batch.zoomConfig.recordingUrl,
                          summary: batch.zoomConfig.summary,
                          duration: batch.zoomConfig.summary?.duration || "Live Class",
                        },
                      ]
                    : [];

                  if (allRecordings.length === 0) {
                    return (
                      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No class recordings available yet.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allRecordings.map((rec, idx) => (
                        <div key={rec.id || idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm group">
                          <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                            <video 
                              controls 
                              className="w-full h-full object-contain"
                              src={rec.recordingUrl}
                            />
                          </div>
                          <div className="p-5">
                            <h5 className="text-base font-bold text-slate-900 truncate">
                              {rec.title}
                            </h5>
                            <p className="text-xs text-slate-500 mt-1 mb-4">
                              Duration: {rec.summary?.duration || (rec as any).duration || "Full Class"}
                            </p>
                            <a 
                              href={rec.recordingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2.5 rounded-lg text-sm font-bold transition-colors border border-emerald-100"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Open Direct Stream
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
