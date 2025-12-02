package com.shadcn.backend.dto;

import com.shadcn.backend.model.Biografi;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class BiografiResponse {
    private Long id;
    private String namaLengkap;
    private String nim;
    private String email;
    private String nomorTelepon;
    private LocalDate tanggalLahir;
    private String tempatLahir;
    private String jenisKelamin;
    private String agama;
    private LocalDate tanggalLulus;
    private String programStudi;
    private String ipk;
    private List<WorkExperienceRequest> workExperiences;
    private LocalDate tanggalMasukKerja;
    private LocalDate tanggalKeluarKerja;
    private String pekerjaanSaatIni;
    private String perusahaanSaatIni;
    private String alamat;
    private String kota;
    private String provinsi;
    private String prestasi;
    private String hobi;
    private String mediaSosial;
    private String catatan;
    private String foto;
    private Biografi.StatusBiografi status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Default constructor
    public BiografiResponse() {}

    // Constructor with all fields
    public BiografiResponse(Long id, String namaLengkap, String nim, String email, String nomorTelepon,
                           LocalDate tanggalLahir, String tempatLahir, String jenisKelamin, String agama,
                           LocalDate tanggalLulus, String programStudi, String ipk,
                           List<WorkExperienceRequest> workExperiences, LocalDate tanggalMasukKerja,
                           LocalDate tanggalKeluarKerja, String pekerjaanSaatIni, String perusahaanSaatIni,
                           String alamat, String kota, String provinsi, String prestasi, String hobi,
                           String mediaSosial, String catatan, String foto, Biografi.StatusBiografi status,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.namaLengkap = namaLengkap;
        this.nim = nim;
        this.email = email;
        this.nomorTelepon = nomorTelepon;
        this.tanggalLahir = tanggalLahir;
        this.tempatLahir = tempatLahir;
        this.jenisKelamin = jenisKelamin;
        this.agama = agama;
        this.tanggalLulus = tanggalLulus;
        this.programStudi = programStudi;
        this.ipk = ipk;
        this.workExperiences = workExperiences;
        this.tanggalMasukKerja = tanggalMasukKerja;
        this.tanggalKeluarKerja = tanggalKeluarKerja;
        this.pekerjaanSaatIni = pekerjaanSaatIni;
        this.perusahaanSaatIni = perusahaanSaatIni;
        this.alamat = alamat;
        this.kota = kota;
        this.provinsi = provinsi;
        this.prestasi = prestasi;
        this.hobi = hobi;
        this.mediaSosial = mediaSosial;
        this.catatan = catatan;
        this.foto = foto;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNamaLengkap() {
        return namaLengkap;
    }

    public void setNamaLengkap(String namaLengkap) {
        this.namaLengkap = namaLengkap;
    }

    public String getNim() {
        return nim;
    }

    public void setNim(String nim) {
        this.nim = nim;
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

    public LocalDate getTanggalLahir() {
        return tanggalLahir;
    }

    public void setTanggalLahir(LocalDate tanggalLahir) {
        this.tanggalLahir = tanggalLahir;
    }

    public String getTempatLahir() {
        return tempatLahir;
    }

    public void setTempatLahir(String tempatLahir) {
        this.tempatLahir = tempatLahir;
    }

    public String getJenisKelamin() {
        return jenisKelamin;
    }

    public void setJenisKelamin(String jenisKelamin) {
        this.jenisKelamin = jenisKelamin;
    }

    public String getAgama() {
        return agama;
    }

    public void setAgama(String agama) {
        this.agama = agama;
    }

    public LocalDate getTanggalLulus() {
        return tanggalLulus;
    }

    public void setTanggalLulus(LocalDate tanggalLulus) {
        this.tanggalLulus = tanggalLulus;
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

    public List<WorkExperienceRequest> getWorkExperiences() {
        return workExperiences;
    }

    public void setWorkExperiences(List<WorkExperienceRequest> workExperiences) {
        this.workExperiences = workExperiences;
    }

    public LocalDate getTanggalMasukKerja() {
        return tanggalMasukKerja;
    }

    public void setTanggalMasukKerja(LocalDate tanggalMasukKerja) {
        this.tanggalMasukKerja = tanggalMasukKerja;
    }

    public LocalDate getTanggalKeluarKerja() {
        return tanggalKeluarKerja;
    }

    public void setTanggalKeluarKerja(LocalDate tanggalKeluarKerja) {
        this.tanggalKeluarKerja = tanggalKeluarKerja;
    }

    public String getPekerjaanSaatIni() {
        return pekerjaanSaatIni;
    }

    public void setPekerjaanSaatIni(String pekerjaanSaatIni) {
        this.pekerjaanSaatIni = pekerjaanSaatIni;
    }

    public String getPerusahaanSaatIni() {
        return perusahaanSaatIni;
    }

    public void setPerusahaanSaatIni(String perusahaanSaatIni) {
        this.perusahaanSaatIni = perusahaanSaatIni;
    }

    public String getAlamat() {
        return alamat;
    }

    public void setAlamat(String alamat) {
        this.alamat = alamat;
    }

    public String getKota() {
        return kota;
    }

    public void setKota(String kota) {
        this.kota = kota;
    }

    public String getProvinsi() {
        return provinsi;
    }

    public void setProvinsi(String provinsi) {
        this.provinsi = provinsi;
    }

    public String getPrestasi() {
        return prestasi;
    }

    public void setPrestasi(String prestasi) {
        this.prestasi = prestasi;
    }

    public String getHobi() {
        return hobi;
    }

    public void setHobi(String hobi) {
        this.hobi = hobi;
    }

    public String getMediaSosial() {
        return mediaSosial;
    }

    public void setMediaSosial(String mediaSosial) {
        this.mediaSosial = mediaSosial;
    }

    public String getCatatan() {
        return catatan;
    }

    public void setCatatan(String catatan) {
        this.catatan = catatan;
    }

    public String getFoto() {
        return foto;
    }

    public void setFoto(String foto) {
        this.foto = foto;
    }

    public Biografi.StatusBiografi getStatus() {
        return status;
    }

    public void setStatus(Biografi.StatusBiografi status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
