package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {
    @NotBlank(message = "Konten post tidak boleh kosong")
    @Size(max = 5000, message = "Konten post maksimal 5000 karakter")
    private String konten;
    
    private List<MediaUploadDTO> media = new ArrayList<>();
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaUploadDTO {
        private String mediaUrl;
        private String mediaType;
        private Integer mediaOrder;
        private String caption;
        private String originalFileName;
        private Long fileSize;
        private String mimeType;
        private String thumbnailUrl;
    }
}
