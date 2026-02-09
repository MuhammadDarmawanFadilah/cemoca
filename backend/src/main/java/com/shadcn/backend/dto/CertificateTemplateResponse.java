package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateTemplateResponse {
    
    private Long id;
    private String templateCode;
    private String templateName;
    private String description;
    private String imageUrl;
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
    
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
