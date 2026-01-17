package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoPreviewRequest {
    private String messageTemplate;
    private String videoLanguageCode;
    private Boolean useBackground;
    private String backgroundName;

    private Integer rowNumber;
    private String name;
    private String phone;
    private String avatar;
}
