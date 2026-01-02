package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvatarAudioResponse {
    private Long id;
    private String avatarName;
    private String normalizedKey;
    private String originalFilename;
    private String storedFilename;
    private String mimeType;
    private Long fileSize;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
