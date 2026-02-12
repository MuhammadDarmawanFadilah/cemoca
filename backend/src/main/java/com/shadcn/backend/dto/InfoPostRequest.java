package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InfoPostRequest {
    
    @NotBlank(message = "Judul tidak boleh kosong")
    private String title;
    
    @NotBlank(message = "Deskripsi tidak boleh kosong")
    private String description;
    
    private String mediaPath;
    private String mediaType;
}
