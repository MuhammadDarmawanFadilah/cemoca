package com.shadcn.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "kota")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Kota {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "kode", unique = true, nullable = false, length = 10)
    private String kode;
    
    @Column(name = "nama", nullable = false, length = 100)
    private String nama;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provinsi_id", nullable = false)
    @JsonBackReference
    private Provinsi provinsi;
    
    @Column(name = "tipe", length = 20)
    private String tipe; // KOTA, KABUPATEN, KOTA_ADMINISTRASI
}
