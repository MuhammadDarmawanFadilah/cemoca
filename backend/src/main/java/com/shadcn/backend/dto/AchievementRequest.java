package com.shadcn.backend.dto;

public class AchievementRequest {
    private String judul;
    private String penyelenggara;
    private String tahun;
    private String deskripsi;

    // Default constructor
    public AchievementRequest() {}

    // Constructor
    public AchievementRequest(String judul, String penyelenggara, String tahun, String deskripsi) {
        this.judul = judul;
        this.penyelenggara = penyelenggara;
        this.tahun = tahun;
        this.deskripsi = deskripsi;
    }

    // Getters and Setters
    public String getJudul() {
        return judul;
    }

    public void setJudul(String judul) {
        this.judul = judul;
    }

    public String getPenyelenggara() {
        return penyelenggara;
    }

    public void setPenyelenggara(String penyelenggara) {
        this.penyelenggara = penyelenggara;
    }

    public String getTahun() {
        return tahun;
    }

    public void setTahun(String tahun) {
        this.tahun = tahun;
    }

    public String getDeskripsi() {
        return deskripsi;
    }

    public void setDeskripsi(String deskripsi) {
        this.deskripsi = deskripsi;
    }
}
