package com.shadcn.backend.dto;

import com.shadcn.backend.model.Berita;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BeritaRequest {
    
    @NotBlank(message = "Judul tidak boleh kosong")
    @Size(max = 200, message = "Judul maksimal 200 karakter")
    private String judul;
    
    @NotBlank(message = "Ringkasan tidak boleh kosong")
    @Size(max = 500, message = "Ringkasan maksimal 500 karakter")
    private String ringkasan;
      @NotBlank(message = "Konten tidak boleh kosong")
    private String konten;
    
    private String penulis;
    
    private Long penulisBiografiId;
    
    private Integer ringkasanWordCount = 30;
    
    private String gambarUrl;
    
    private String mediaLampiran; // JSON string untuk array foto dan video
    
    private String tags;
    
    private Berita.StatusBerita status = Berita.StatusBerita.DRAFT;
    
    private Berita.KategoriBerita kategori = Berita.KategoriBerita.UMUM;
}
