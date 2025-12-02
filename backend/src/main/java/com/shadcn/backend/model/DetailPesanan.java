package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.math.BigDecimal;

@Entity
@Table(name = "detail_pesanan")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetailPesanan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pesanan_id", nullable = false)
    @JsonBackReference
    private Pesanan pesanan;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barang_id", nullable = false)
    private Barang barang;
    
    @Column(nullable = false)
    private Integer jumlah;
    
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal hargaSatuan;
    
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;
}