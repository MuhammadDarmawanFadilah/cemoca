"use client";

import { VideosListPage } from "./_shared/VideosListPage";

export default function LearningModuleVideosPage() {
  return (
    <VideosListPage
      basePath="/learning-module/videos"
      category="VIDEO_1"
      headerTitle="Video 1"
    />
  );
}