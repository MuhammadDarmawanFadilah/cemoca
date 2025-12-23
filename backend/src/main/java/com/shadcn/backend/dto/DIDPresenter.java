package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DIDPresenter {
    private String presenter_id;
    private String presenter_name;
    private String gender;
    private String thumbnail_url;
    private String preview_url;
    private boolean is_premium;
    private String avatar_type; // "express" for Express Avatars, "clips" for Clips Presenters
    private String voice_id; // For Express Avatars with cloned voice
    private String voice_type; // For Clips Presenters voice provider type (e.g. elevenlabs)
}
