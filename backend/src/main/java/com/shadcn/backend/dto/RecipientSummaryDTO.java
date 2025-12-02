package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RecipientSummaryDTO {
    @JsonProperty("biografiId")
    private Long biografiId;
    
    @JsonProperty("namaLengkap")
    private String namaLengkap;
    
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("nomorTelepon")
    private String nomorTelepon;
    
    @JsonProperty("jurusan")
    private String jurusan;
      @JsonProperty("alumniTahun")
    private String alumniTahun;
    
    @JsonProperty("spesialisasi")
    private String spesialisasi;

    // Default constructor
    public RecipientSummaryDTO() {}    // Constructor with all fields
    public RecipientSummaryDTO(Long biografiId, String namaLengkap, String email, String nomorTelepon, 
                              String jurusan, String alumniTahun, String spesialisasi) {
        this.biografiId = biografiId;
        this.namaLengkap = namaLengkap;
        this.email = email;
        this.nomorTelepon = nomorTelepon;
        this.jurusan = jurusan;
        this.alumniTahun = alumniTahun;
        this.spesialisasi = spesialisasi;
    }

    // Getters and Setters
    public Long getBiografiId() {
        return biografiId;
    }

    public void setBiografiId(Long biografiId) {
        this.biografiId = biografiId;
    }

    public String getNamaLengkap() {
        return namaLengkap;
    }

    public void setNamaLengkap(String namaLengkap) {
        this.namaLengkap = namaLengkap;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNomorTelepon() {
        return nomorTelepon;
    }

    public void setNomorTelepon(String nomorTelepon) {
        this.nomorTelepon = nomorTelepon;
    }

    public String getJurusan() {
        return jurusan;
    }

    public void setJurusan(String jurusan) {
        this.jurusan = jurusan;
    }

    public String getAlumniTahun() {
        return alumniTahun;
    }    public void setAlumniTahun(String alumniTahun) {
        this.alumniTahun = alumniTahun;
    }

    public String getSpesialisasi() {
        return spesialisasi;
    }

    public void setSpesialisasi(String spesialisasi) {
        this.spesialisasi = spesialisasi;
    }
}
