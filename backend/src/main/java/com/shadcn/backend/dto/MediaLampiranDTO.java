package com.shadcn.backend.dto;

import lombok.Data;

@Data
public class MediaLampiranDTO {
    private String type; // "image" atau "video"
    private String url;
    private String caption;
    private String filename;
    private Long size;
}
