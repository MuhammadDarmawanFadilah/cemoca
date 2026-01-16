package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoAvatarOption {
    private String avatar_id;
    private String display_name;
    private String avatar_name;
    private String gender;
    private String thumbnail_url;
    private String preview_url;
    private Boolean is_premium;
    private String type;
}
