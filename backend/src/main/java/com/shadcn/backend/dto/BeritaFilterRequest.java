package com.shadcn.backend.dto;

import com.shadcn.backend.model.Berita;
import lombok.Data;

@Data
public class BeritaFilterRequest {
    
    private String search;
    private String keyword;
    private Berita.KategoriBerita kategori;
    private Berita.StatusBerita status = Berita.StatusBerita.PUBLISHED;
    private String sortBy = "createdAt";
    private String sortDir = "desc";
    private String sortDirection = "desc";
    private int page = 0;
    private int size = 10;
    private boolean popular = false; // Sort by views if true
}
