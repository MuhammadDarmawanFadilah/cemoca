package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateTemplateRequest {
    
    @NotBlank(message = "Kode template tidak boleh kosong")
    @Size(max = 50, message = "Kode template maksimal 50 karakter")
    private String templateCode;
    
    @NotBlank(message = "Nama template tidak boleh kosong")
    @Size(max = 100, message = "Nama template maksimal 100 karakter")
    private String templateName;
    
    @Size(max = 255, message = "Deskripsi maksimal 255 karakter")
    private String description;
    
    private String imageUrl;
    
    @NotNull(message = "Jumlah variable tidak boleh kosong")
    private Integer variableCount;
    
    private String variable1Name;
    private Integer variable1X;
    private Integer variable1Y;
    private Integer variable1FontSize;
    private String variable1Color;
    
    private String variable2Name;
    private Integer variable2X;
    private Integer variable2Y;
    private Integer variable2FontSize;
    private String variable2Color;
    
    private String variable3Name;
    private Integer variable3X;
    private Integer variable3Y;
    private Integer variable3FontSize;
    private String variable3Color;
    
    private String variable4Name;
    private Integer variable4X;
    private Integer variable4Y;
    private Integer variable4FontSize;
    private String variable4Color;
    
    private Boolean isActive = true;
}
