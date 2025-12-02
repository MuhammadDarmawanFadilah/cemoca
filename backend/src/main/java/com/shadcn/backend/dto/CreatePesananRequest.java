package com.shadcn.backend.dto;

import java.util.List;

public class CreatePesananRequest {
    private PesananData pesanan;
    private List<DetailPesananData> details;
    
    public static class PesananData {
        private Long memberId;
        private Long karyawanId;
        
        public Long getMemberId() {
            return memberId;
        }
        
        public void setMemberId(Long memberId) {
            this.memberId = memberId;
        }
        
        public Long getKaryawanId() {
            return karyawanId;
        }
        
        public void setKaryawanId(Long karyawanId) {
            this.karyawanId = karyawanId;
        }
    }
    
    public static class DetailPesananData {
        private Long barangId;
        private Integer jumlah;
        
        public Long getBarangId() {
            return barangId;
        }
        
        public void setBarangId(Long barangId) {
            this.barangId = barangId;
        }
        
        public Integer getJumlah() {
            return jumlah;
        }
        
        public void setJumlah(Integer jumlah) {
            this.jumlah = jumlah;
        }
    }
    
    public PesananData getPesanan() {
        return pesanan;
    }
    
    public void setPesanan(PesananData pesanan) {
        this.pesanan = pesanan;
    }
    
    public List<DetailPesananData> getDetails() {
        return details;
    }
    
    public void setDetails(List<DetailPesananData> details) {
        this.details = details;
    }
}