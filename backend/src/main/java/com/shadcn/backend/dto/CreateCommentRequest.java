package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentRequest {
    @NotBlank(message = "Konten komentar tidak boleh kosong")
    @Size(max = 2000, message = "Konten komentar maksimal 2000 karakter")
    private String konten;
    
    private Long parentCommentId; // For replies
}
