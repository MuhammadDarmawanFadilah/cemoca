package com.shadcn.backend.dto;

import com.shadcn.backend.model.Biografi;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;

public class BiografiRequest {
    
    @NotBlank(message = "Nama lengkap tidak boleh kosong")
    @Size(max = 100, message = "Nama lengkap maksimal 100 karakter")
    private String namaLengkap;    @Size(max = 20, message = "NIM maksimal 20 karakter")
    private String nim;

    @NotBlank(message = "Tahun alumni tidak boleh kosong")
    @Size(max = 4, message = "Tahun alumni maksimal 4 karakter")
    private String alumniTahun;@Email(message = "Format email tidak valid")
    @NotBlank(message = "Email tidak boleh kosong")
    @Size(max = 100, message = "Email maksimal 100 karakter")
    private String email;    @NotBlank(message = "Nomor telepon tidak boleh kosong")
    @Size(max = 20, message = "Nomor telepon maksimal 20 karakter")
    private String nomorTelepon;

    @Size(max = 255, message = "Nama file foto maksimal 255 karakter")
    private String fotoProfil;

    @Size(max = 100, message = "Jurusan maksimal 100 karakter")
    private String jurusan;    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalLulus;

    @Size(max = 50, message = "IPK maksimal 50 karakter")
    private String ipk;    // Required frontend fields
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalLahir;

    @Size(max = 100, message = "Tempat lahir maksimal 100 karakter")
    private String tempatLahir;

    private String jenisKelamin;

    @Size(max = 50, message = "Agama maksimal 50 karakter")
    private String agama;@Size(max = 100, message = "Program studi maksimal 100 karakter")
    private String programStudi;

    // Optional fields
    @Size(max = 100, message = "Posisi/Jabatan maksimal 100 karakter")
    private String posisiJabatan;

    @Size(max = 255, message = "Nama file foto maksimal 255 karakter")
    private String foto;

    private String pendidikanLanjutan;
    private String pengalamanKerja;
      // Work experiences
    private List<WorkExperienceRequest> workExperiences;
      // Academic records
    private List<AcademicRecordRequest> academicRecords;
    
    // Achievements
    private List<AchievementRequest> achievements;

    // Spesialisasi Kedokteran
    private List<SpesialisasiKedokteranRequest> spesialisasiKedokteran;

    // Career dates
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalMasukKerja;    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalKeluarKerja;

    private String alamat;

    @Size(max = 50, message = "Kota maksimal 50 karakter")
    private String kota;    @Size(max = 50, message = "Provinsi maksimal 50 karakter")
    private String provinsi;

    @Size(max = 15, message = "Kecamatan maksimal 15 karakter")
    private String kecamatan;

    @Size(max = 20, message = "Kelurahan maksimal 20 karakter")
    private String kelurahan;    @Size(max = 10, message = "Kode pos maksimal 10 karakter")
    private String kodePos;

    // GIS coordinates for map location
    private Double latitude;
    private Double longitude;

    private String prestasi;
    private String hobi;
    
    @Size(max = 200, message = "Instagram maksimal 200 karakter")
    private String instagram;
    
    @Size(max = 200, message = "YouTube maksimal 200 karakter")
    private String youtube;
    
    @Size(max = 200, message = "LinkedIn maksimal 200 karakter")
    private String linkedin;
      @Size(max = 200, message = "Facebook maksimal 200 karakter")
    private String facebook;
    
    @Size(max = 200, message = "TikTok maksimal 200 karakter")
    private String tiktok;
    
    @Size(max = 200, message = "Telegram maksimal 200 karakter")
    private String telegram;
    
    private String catatan;

    private Biografi.StatusBiografi status;

    // Default constructor
    public BiografiRequest() {}

    // Getters and Setters
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

    public String getAlumniTahun() {
        return alumniTahun;
    }

    public void setAlumniTahun(String alumniTahun) {
        this.alumniTahun = alumniTahun;
    }    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }public String getFotoProfil() {
        return fotoProfil;
    }

    public void setFotoProfil(String fotoProfil) {
        this.fotoProfil = fotoProfil;
    }

    public String getJurusan() {
        return jurusan;
    }

    public void setJurusan(String jurusan) {
        this.jurusan = jurusan;
    }

    public LocalDate getTanggalLulus() {
        return tanggalLulus;
    }

    public void setTanggalLulus(LocalDate tanggalLulus) {
        this.tanggalLulus = tanggalLulus;
    }

    public String getIpk() {
        return ipk;
    }    public void setIpk(String ipk) {
        this.ipk = ipk;
    }

    // Getter setter for new fields
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

    public String getPosisiJabatan() {
        return posisiJabatan;
    }

    public void setPosisiJabatan(String posisiJabatan) {
        this.posisiJabatan = posisiJabatan;
    }

    public String getFoto() {
        return foto;
    }

    public void setFoto(String foto) {
        this.foto = foto;
    }

    public String getProgramStudi() {
        return programStudi;
    }

    public void setProgramStudi(String programStudi) {
        this.programStudi = programStudi;
    }

    public String getPendidikanLanjutan() {
        return pendidikanLanjutan;
    }

    public void setPendidikanLanjutan(String pendidikanLanjutan) {
        this.pendidikanLanjutan = pendidikanLanjutan;
    }

    public String getPengalamanKerja() {
        return pengalamanKerja;
    }    public void setPengalamanKerja(String pengalamanKerja) {
        this.pengalamanKerja = pengalamanKerja;
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
    }    public String getProvinsi() {
        return provinsi;
    }

    public void setProvinsi(String provinsi) {
        this.provinsi = provinsi;
    }

    public String getKecamatan() {
        return kecamatan;
    }

    public void setKecamatan(String kecamatan) {
        this.kecamatan = kecamatan;
    }

    public String getKelurahan() {
        return kelurahan;
    }

    public void setKelurahan(String kelurahan) {
        this.kelurahan = kelurahan;
    }

    public String getKodePos() {
        return kodePos;
    }    public void setKodePos(String kodePos) {
        this.kodePos = kodePos;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
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
    }    public String getInstagram() {
        return instagram;
    }

    public void setInstagram(String instagram) {
        this.instagram = instagram;
    }
    
    public String getYoutube() {
        return youtube;
    }

    public void setYoutube(String youtube) {
        this.youtube = youtube;
    }
    
    public String getLinkedin() {
        return linkedin;
    }

    public void setLinkedin(String linkedin) {
        this.linkedin = linkedin;
    }
      public String getFacebook() {
        return facebook;
    }

    public void setFacebook(String facebook) {
        this.facebook = facebook;
    }
    
    public String getTiktok() {
        return tiktok;
    }

    public void setTiktok(String tiktok) {
        this.tiktok = tiktok;
    }
    
    public String getTelegram() {
        return telegram;
    }

    public void setTelegram(String telegram) {
        this.telegram = telegram;
    }

    public String getCatatan() {
        return catatan;
    }

    public void setCatatan(String catatan) {
        this.catatan = catatan;
    }

    public Biografi.StatusBiografi getStatus() {
        return status;
    }    public void setStatus(Biografi.StatusBiografi status) {
        this.status = status;
    }

    public List<WorkExperienceRequest> getWorkExperiences() {
        return workExperiences;
    }

    public void setWorkExperiences(List<WorkExperienceRequest> workExperiences) {
        this.workExperiences = workExperiences;
    }

    public List<AcademicRecordRequest> getAcademicRecords() {
        return academicRecords;
    }    public void setAcademicRecords(List<AcademicRecordRequest> academicRecords) {
        this.academicRecords = academicRecords;
    }

    public List<AchievementRequest> getAchievements() {
        return achievements;
    }

    public void setAchievements(List<AchievementRequest> achievements) {
        this.achievements = achievements;
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

    public List<SpesialisasiKedokteranRequest> getSpesialisasiKedokteran() {
        return spesialisasiKedokteran;
    }

    public void setSpesialisasiKedokteran(List<SpesialisasiKedokteranRequest> spesialisasiKedokteran) {
        this.spesialisasiKedokteran = spesialisasiKedokteran;
    }
}
