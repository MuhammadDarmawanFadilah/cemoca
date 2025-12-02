package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateBarangRequest {
    private String nama;
    private BigDecimal berat;
    private Long kategoriId;
    private Integer stock;
    private BigDecimal harga;
    private Integer poin;
    private String gambar;
}