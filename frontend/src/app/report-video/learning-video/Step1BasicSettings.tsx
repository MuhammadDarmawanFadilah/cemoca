"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Video,
  ChevronRight,
  ChevronLeft,
  Download,
  Search,
  LayoutGrid,
  FileVideo,
} from "lucide-react";
import { toast } from "sonner";
import { VideoAvatarOption, learningVideoApi } from "@/lib/api";
import { config } from "@/lib/config";
import { AVATARS_PER_PAGE } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step1BasicSettingsProps {
  reportName: string;
  setReportName: (value: string) => void;
  learningVideoCode: string;
  setLearningVideoCode: (value: string) => void;
  learningVideoLanguage: string;
  setLearningVideoLanguage: (value: string) => void;
  videoLanguageCode: string;
  setVideoLanguageCode: (value: string) => void;
  voiceSpeed: number;
  setVoiceSpeed: (value: number) => void;
  voicePitch: number;
  setVoicePitch: (value: number) => void;
  enableCaption: boolean;
  setEnableCaption: (value: boolean) => void;
  presenters: VideoAvatarOption[];
  loadingPresenters: boolean;
  avatarPage: number;
  setAvatarPage: (value: number | ((p: number) => number)) => void;
  avatarSearch: string;
  setAvatarSearch: (value: string) => void;
  useBackground: boolean;
  setUseBackground: (value: boolean) => void;
  backgrounds: string[];
  loadingBackgrounds: boolean;
  backgroundName: string;
  setBackgroundName: (value: string) => void;
  onNext: () => void;
}

const LEARNING_VIDEO_LANGUAGES = [
  { code: "id", name: "Bahasa Indonesia" },
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "km", name: "Khmer (Cambodia)" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "tl", name: "Filipino (Tagalog)" },
  { code: "hi", name: "Hindi" },
  { code: "ko", name: "Korean" },
];

export function Step1BasicSettings({
  reportName,
  setReportName,
  learningVideoCode,
  setLearningVideoCode,
  learningVideoLanguage,
  setLearningVideoLanguage,
  videoLanguageCode,
  setVideoLanguageCode,
  voiceSpeed,
  setVoiceSpeed,
  voicePitch,
  setVoicePitch,
  enableCaption,
  setEnableCaption,
  presenters,
  loadingPresenters,
  avatarPage,
  setAvatarPage,
  avatarSearch,
  setAvatarSearch,
  useBackground,
  setUseBackground,
  backgrounds,
  loadingBackgrounds,
  backgroundName,
  setBackgroundName,
  onNext,
}: Step1BasicSettingsProps) {
  const { t } = useLanguage();
  const [fetchingLearningVideo, setFetchingLearningVideo] = useState(false);

  const fetchLearningVideoContent = async () => {
    if (!learningVideoCode.trim()) {
      toast.info("Code is empty");
      return;
    }

    const lang = learningVideoLanguage || "en";
    
    try {
      setFetchingLearningVideo(true);
      const videos = await learningVideoApi.getAll(0, 1000);
      const video = videos.content.find(v => v.code === learningVideoCode.trim());
      
      if (!video) {
        toast.error("Learning video not found for code: " + learningVideoCode);
        return;
      }

      toast.success("Learning video exists");
    } catch (error: any) {
      toast.error("Failed to fetch learning video: " + (error.message || "Unknown error"));
      console.error(error);
    } finally {
      setFetchingLearningVideo(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("reportVideo.reportName")}</Label>
        <Input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Learning Video Notification" className="h-9 text-sm" />
      </div>

      {/* Learning Video Code & Language */}
      <div className="p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 space-y-3">
        <div className="flex items-center gap-2">
          <FileVideo className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <Label className="text-xs font-semibold text-blue-700 dark:text-blue-300">Learning Video Source (Optional)</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Video Code</Label>
            <Input 
              value={learningVideoCode} 
              onChange={e => setLearningVideoCode(e.target.value)} 
              placeholder="e.g., LV001"
              className="h-9 text-sm"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Language</Label>
            <Select value={learningVideoLanguage} onValueChange={setLearningVideoLanguage}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LEARNING_VIDEO_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          size="sm" 
          className="w-full h-8 text-xs"
          onClick={fetchLearningVideoContent}
          disabled={fetchingLearningVideo}
        >
          {fetchingLearningVideo ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Verify Learning Video Code
            </>
          )}
        </Button>

        <p className="text-[10px] text-blue-600 dark:text-blue-400">
          Verify learning video exists by code. Video content will be loaded in Step 2.
        </p>
      </div>

      {/* Voice Control Settings */}
      <div className="space-y-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Voice Settings
        </Label>
        
        {/* Voice Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Speed</Label>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{voiceSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={voiceSpeed}
            onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Slower (0.5x)</span>
            <span>Normal (1.0x)</span>
            <span>Faster (2.0x)</span>
          </div>
        </div>

        {/* Voice Pitch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Pitch</Label>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{voicePitch > 0 ? '+' : ''}{voicePitch}</span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={voicePitch}
            onChange={(e) => setVoicePitch(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Lower (-12)</span>
            <span>Normal (0)</span>
            <span>Higher (+12)</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 italic">
          Adjust voice speed and pitch for more natural delivery. Default: 1.0x speed, 0 pitch.
        </p>
      </div>

      {/* Caption/Subtitle Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex-1">
          <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Enable Subtitles</Label>
          <p className="text-[10px] text-slate-400 mt-0.5">Display text captions in the video</p>
        </div>
        <Switch checked={enableCaption} onCheckedChange={setEnableCaption} />
      </div>

      {/* Background */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Background</Label>
          <Switch checked={useBackground} onCheckedChange={checked => setUseBackground(Boolean(checked))} />
        </div>

        {useBackground && (
          <div className="space-y-2">
            <Select value={backgroundName} onValueChange={setBackgroundName}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={loadingBackgrounds ? "Loading..." : "Select background"} />
              </SelectTrigger>
              <SelectContent>
                {(backgrounds || []).map(name => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {backgroundName ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <img
                  src={`${config.apiUrl}/video-backgrounds/${encodeURIComponent(backgroundName)}`}
                  alt={backgroundName}
                  className="w-full h-40 object-cover"
                />
              </div>
            ) : null}

            {!loadingBackgrounds && (!backgrounds || backgrounds.length === 0) ? (
              <div className="text-[10px] text-slate-400">No backgrounds found</div>
            ) : null}
          </div>
        )}
      </div>

      {/* Avatar Dialog */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("reportVideo.availableAvatars")}</Label>
        {loadingPresenters ? (
          <div className="text-xs text-slate-400">{t("reportVideo.loadingAvatars")}</div>
        ) : presenters.length === 0 ? (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
            {t("reportVideo.noAvatars")}
          </div>
        ) : (
          <Dialog onOpenChange={open => { if (open) { setAvatarPage(1); setAvatarSearch(""); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> {presenters.length} {t("reportVideo.avatars")}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl h-[85vh] flex flex-col p-4">
              <DialogHeader>
                <DialogTitle className="text-sm">{t("reportVideo.avatars")} ({presenters.length})</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 py-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input placeholder={t("reportVideo.searchAvatar")} value={avatarSearch} onChange={e => { setAvatarSearch(e.target.value); setAvatarPage(1); }} className="pl-8 h-8 text-xs" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {(() => {
                  const filtered = presenters.filter(p => {
                    if (!avatarSearch) return true;
                    const q = avatarSearch.toLowerCase();
                    const label = String(p.display_name || p.avatar_name || p.avatar_id || '').toLowerCase();
                    return label.includes(q);
                  });
                  const totalPages = Math.ceil(filtered.length / AVATARS_PER_PAGE);
                  const startIdx = (avatarPage - 1) * AVATARS_PER_PAGE;
                  const paginated = filtered.slice(startIdx, startIdx + AVATARS_PER_PAGE);
                  return (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {paginated.map(p => {
                          const label = String(p.display_name || p.avatar_name || p.avatar_id || '');
                          return (
                          <div key={p.avatar_id} className="border rounded-lg overflow-hidden hover:border-blue-400 cursor-pointer transition group bg-white dark:bg-slate-800" onClick={() => { navigator.clipboard.writeText(label); toast.success(`"${label}" ${t("reportVideo.copied")}`); }}>
                            {p.thumbnail_url ? (
                              <div className="relative aspect-square">
                                <img src={p.thumbnail_url} alt={label} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <span className="text-[10px] text-white font-medium px-2 py-1 bg-blue-600 rounded">{t("reportVideo.copy")}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-square bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                <Video className="h-6 w-6 text-slate-300" />
                              </div>
                            )}
                            <div className="p-1.5 text-center border-t">
                              <span className="text-[10px] font-medium truncate block">{label || t("reportVideo.avatars")}</span>
                            </div>
                          </div>
                        );
                        })}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setAvatarPage(p => Math.max(1, p - 1))} disabled={avatarPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-slate-500">{avatarPage} / {totalPages}</span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setAvatarPage(p => Math.min(totalPages, p + 1))} disabled={avatarPage === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {filtered.length === 0 && <div className="text-center py-8 text-xs text-slate-400">{t("reportVideo.notFound")}</div>}
                    </>
                  );
                })()}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button size="sm" className="h-8 text-xs" onClick={onNext}>
          {t("reportVideo.continue")} <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
