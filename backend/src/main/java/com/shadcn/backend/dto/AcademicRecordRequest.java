package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class AcademicRecordRequest {
    
    @NotBlank(message = "Jenjang pendidikan tidak boleh kosong")
    @Size(max = 10, message = "Jenjang pendidikan maksimal 10 karakter")
    private String jenjangPendidikan; // D1, D2, D3, D4, S1, S2, S3
    
    @NotBlank(message = "Universitas tidak boleh kosong")
    @Size(max = 200, message = "Universitas maksimal 200 karakter")
    private String universitas;
    
    @NotBlank(message = "Program studi tidak boleh kosong")
    @Size(max = 100, message = "Program studi maksimal 100 karakter")
    private String programStudi;
    
    @Size(max = 10, message = "IPK maksimal 10 karakter")
    private String ipk;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tanggalLulus;
    
    // Default constructor
    public AcademicRecordRequest() {}
    
    // Constructor with all fields
    public AcademicRecordRequest(String jenjangPendidikan, String universitas, String programStudi, 
                                String ipk, LocalDate tanggalLulus) {
        this.jenjangPendidikan = jenjangPendidikan;
        this.universitas = universitas;
        this.programStudi = programStudi;
        this.ipk = ipk;
        this.tanggalLulus = tanggalLulus;
    }
    
    // Getters and Setters
    public String getJenjangPendidikan() {
        return jenjangPendidikan;
    }
    
    public void setJenjangPendidikan(String jenjangPendidikan) {
        this.jenjangPendidikan = jenjangPendidikan;
    }
    
    public String getUniversitas() {
        return universitas;
    }
    
    public void setUniversitas(String universitas) {
        this.universitas = universitas;
    }
    
    public String getProgramStudi() {
        return programStudi;
    }
    
    public void setProgramStudi(String programStudi) {
        this.programStudi = programStudi;
    }
    
    public String getIpk() {
        return ipk;
    }
    
    public void setIpk(String ipk) {
        this.ipk = ipk;
    }
    
    public LocalDate getTanggalLulus() {
        return tanggalLulus;
    }
    
    public void setTanggalLulus(LocalDate tanggalLulus) {
        this.tanggalLulus = tanggalLulus;
    }
    
    @Override
    public String toString() {
        return "AcademicRecordRequest{" +
                "jenjangPendidikan='" + jenjangPendidikan + '\'' +
                ", universitas='" + universitas + '\'' +
                ", programStudi='" + programStudi + '\'' +
                ", ipk='" + ipk + '\'' +
                ", tanggalLulus=" + tanggalLulus +
                '}';
    }
}
