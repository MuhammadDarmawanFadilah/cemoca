package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DocumentCommentRequest {
      private Long dokumentId;
    
    @NotBlank(message = "Nama tidak boleh kosong")
    @Size(max = 100, message = "Nama maksimal 100 karakter")
    private String nama;
    
    @NotBlank(message = "Konten tidak boleh kosong")
    @Size(max = 1000, message = "Konten maksimal 1000 karakter")
    private String konten;
    
    private Long parentId; // For replies
    
    private String email; // Optional
}
