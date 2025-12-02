package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pesanan")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pesanan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = true)
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "karyawan_id", nullable = false)
    private User karyawan;
    
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalHarga;
    
    @Column(nullable = false)
    private Integer totalPoin;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPesanan status;
    
    @CreationTimestamp
    @Column(name = "tanggal_pesanan", nullable = false, updatable = false)
    private LocalDateTime tanggalPesanan;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "pesanan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<DetailPesanan> details;
    
    public enum StatusPesanan {
        PENDING, PROCESSING, COMPLETED, CANCELLED
    }
}