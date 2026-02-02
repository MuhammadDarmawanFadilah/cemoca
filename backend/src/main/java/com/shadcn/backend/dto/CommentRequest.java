package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentRequest {
    
    private Long beritaId; // Optional for replies since it's derived from parent
    
    private Long biografiId; // For associating comments with user biografi
    
    @NotBlank(message = "Nama tidak boleh kosong")
    @Size(max = 100, message = "Nama maksimal 100 karakter")
    private String nama;
    
    @NotBlank(message = "Konten tidak boleh kosong")
    @Size(max = 1000, message = "Konten maksimal 1000 karakter")
    private String konten;
    
    private String foto; // Optional user photo
    
    private Long parentId; // For replies
}
