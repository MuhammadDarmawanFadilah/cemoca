package com.shadcn.backend.repository;

import com.shadcn.backend.model.Biografi;
import com.shadcn.backend.dto.BiografiSearchDto;
import com.shadcn.backend.dto.BiografiProfileDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BiografiRepository extends JpaRepository<Biografi, Long> {
    
    // Find by NIM (unique identifier)
    Optional<Biografi> findByNim(String nim);
    
    // Find by email
    Optional<Biografi> findByEmail(String email);
    
    // Find by exact name match
    Optional<Biografi> findByNamaLengkap(String namaLengkap);    // Find by nomor telepon
    Optional<Biografi> findByNomorTelepon(String nomorTelepon);
      // Find by ID with all relationships eagerly loaded
    // Using separate queries to avoid MultipleBagFetchException when fetching multiple List collections
    @Query("SELECT b FROM Biografi b " +
           "LEFT JOIN FETCH b.workExperiences " +
           "WHERE b.biografiId = :id")
    Optional<Biografi> findByIdWithWorkExperiences(@Param("id") Long id);
    
    @Query("SELECT b FROM Biografi b " +
           "LEFT JOIN FETCH b.achievements " +
           "WHERE b.biografiId = :id")
    Optional<Biografi> findByIdWithAchievements(@Param("id") Long id);
    
    @Query("SELECT b FROM Biografi b " +
           "LEFT JOIN FETCH b.academicRecords " +
           "WHERE b.biografiId = :id")
    Optional<Biografi> findByIdWithAcademicRecords(@Param("id") Long id);
    
    @Query("SELECT b FROM Biografi b " +
           "LEFT JOIN FETCH b.spesialisasiKedokteran " +
           "WHERE b.biografiId = :id")
    Optional<Biografi> findByIdWithSpesialisasi(@Param("id") Long id);
    
    // Check if biography exists for a user (using User entity relationship)
    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.id = :userId AND u.biografi IS NOT NULL")
    boolean existsBiografiByUserId(@Param("userId") Long userId);
      // Find biography by user ID (using User entity relationship)
    @Query("SELECT u.biografi FROM User u WHERE u.id = :userId AND u.biografi IS NOT NULL")
    Optional<Biografi> findBiografiByUserId(@Param("userId") Long userId);
      // Find biography profile by user ID with only basic fields (no collections to avoid N+1)
    @Query("SELECT b FROM Biografi b WHERE b.biografiId = (SELECT u.biografi.biografiId FROM User u WHERE u.id = :userId)")
    Optional<Biografi> findBiografiProfileByUserId(@Param("userId") Long userId);
      // Alternative: Use native query for optimal performance
    @Query(value = "SELECT b.* FROM biografi b " +
                   "INNER JOIN users u ON u.biografi_id = b.biografi_id " +
                   "WHERE u.id = :userId", nativeQuery = true)
    Optional<Biografi> findBiografiProfileByUserIdNative(@Param("userId") Long userId);
    
    // Find by status
    Page<Biografi> findByStatus(Biografi.StatusBiografi status, Pageable pageable);
      // Search by nama lengkap (case insensitive)
    @Query("SELECT b FROM Biografi b WHERE b.namaLengkap LIKE CONCAT('%', :nama, '%')")
    Page<Biografi> findByNamaLengkapContainingIgnoreCase(@Param("nama") String nama, Pageable pageable);
    
    // Search by jurusan
    Page<Biografi> findByJurusanContainingIgnoreCase(String jurusan, Pageable pageable);    // Search by kota
    Page<Biografi> findByKotaContainingIgnoreCase(String kota, Pageable pageable);    // Optimized complex search query for better performance
    @Query("SELECT DISTINCT b FROM Biografi b LEFT JOIN b.workExperiences we LEFT JOIN b.spesialisasiKedokteran sk WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:nama IS NULL OR b.namaLengkap LIKE CONCAT('%', :nama, '%')) AND " +
           "(:nim IS NULL OR b.nim LIKE CONCAT('%', :nim, '%')) AND " +
           "(:email IS NULL OR b.email LIKE CONCAT('%', :email, '%')) AND " +
           "(:nomorTelepon IS NULL OR b.nomorTelepon LIKE CONCAT('%', :nomorTelepon, '%')) AND " +
           "(:jurusan IS NULL OR b.jurusan LIKE CONCAT('%', :jurusan, '%')) AND " +
           "(:pekerjaan IS NULL OR EXISTS (SELECT 1 FROM WorkExperience we2 WHERE we2.biografi = b AND we2.posisi LIKE CONCAT('%', :pekerjaan, '%'))) AND " +
           "(:programStudi IS NULL OR COALESCE(b.programStudi, b.jurusan) LIKE CONCAT('%', :programStudi, '%')) AND " +
           "(:alumniTahun IS NULL OR b.alumniTahun = :alumniTahun) AND " +
           "(:spesialisasi IS NULL OR EXISTS (SELECT 1 FROM SpesialisasiKedokteran sk2 WHERE sk2.biografi = b AND sk2.spesialisasi LIKE CONCAT('%', :spesialisasi, '%'))) AND " +
           "(:kota IS NULL OR b.kota LIKE CONCAT('%', :kota, '%')) AND " +
           "(:kecamatan IS NULL OR b.kecamatan LIKE CONCAT('%', :kecamatan, '%')) AND " +
           "(:kelurahan IS NULL OR b.kelurahan LIKE CONCAT('%', :kelurahan, '%')) AND " +
           "(:provinsi IS NULL OR b.provinsi LIKE CONCAT('%', :provinsi, '%'))")
    Page<Biografi> findBiografiWithFilters(
        @Param("status") Biografi.StatusBiografi status,
        @Param("nama") String nama,
        @Param("nim") String nim,
        @Param("email") String email,
        @Param("nomorTelepon") String nomorTelepon,
        @Param("jurusan") String jurusan,
        @Param("pekerjaan") String pekerjaan,
        @Param("programStudi") String programStudi,
        @Param("alumniTahun") String alumniTahun,
        @Param("spesialisasi") String spesialisasi,
        @Param("kota") String kota,
        @Param("kecamatan") String kecamatan,
        @Param("kelurahan") String kelurahan,
        @Param("provinsi") String provinsi,
        Pageable pageable
    );
    
    // Count by status
    long countByStatus(Biografi.StatusBiografi status);
    
    // Find recent biografi
    @Query("SELECT b FROM Biografi b ORDER BY b.createdAt DESC")
    List<Biografi> findRecentBiografi(Pageable pageable);
    
    // Check if NIM exists (excluding current ID for updates)
    @Query("SELECT COUNT(b) > 0 FROM Biografi b WHERE b.nim = :nim AND (:id IS NULL OR b.biografiId != :id)")
    boolean existsByNimAndIdNot(@Param("nim") String nim, @Param("id") Long id);
    
    // Check if email exists (excluding current ID for updates)
    @Query("SELECT COUNT(b) > 0 FROM Biografi b WHERE b.email = :email AND (:id IS NULL OR b.biografiId != :id)")
    boolean existsByEmailAndIdNot(@Param("email") String email, @Param("id") Long id);
      // Get distinct values for dropdown filters
    @Query("SELECT DISTINCT b.jurusan FROM Biografi b WHERE b.jurusan IS NOT NULL AND b.status = 'AKTIF' ORDER BY b.jurusan")
    List<String> findDistinctJurusan();
      @Query("SELECT DISTINCT b.kota FROM Biografi b WHERE b.kota IS NOT NULL AND b.status = 'AKTIF' ORDER BY b.kota")
    List<String> findDistinctKota();
    
    @Query("SELECT DISTINCT b.provinsi FROM Biografi b WHERE b.provinsi IS NOT NULL AND b.status = 'AKTIF' ORDER BY b.provinsi")
    List<String> findDistinctProvinsi();
    
    @Query("SELECT DISTINCT b.alumniTahun FROM Biografi b WHERE b.alumniTahun IS NOT NULL AND b.status = 'AKTIF' ORDER BY b.alumniTahun")
    List<String> findDistinctAlumniTahun();
    
    @Query("SELECT DISTINCT sk.spesialisasi FROM SpesialisasiKedokteran sk WHERE sk.spesialisasi IS NOT NULL AND sk.biografi.status = 'AKTIF' ORDER BY sk.spesialisasi")
    List<String> findDistinctSpesialisasi();
@Query("SELECT DISTINCT we.posisi FROM WorkExperience we WHERE we.posisi IS NOT NULL AND we.biografi.status = 'AKTIF' ORDER BY we.posisi")
    List<String> findDistinctPekerjaan();
    
    @Query("SELECT DISTINCT b.kecamatan FROM Biografi b WHERE b.kecamatan IS NOT NULL AND b.status = 'AKTIF' ORDER BY b.kecamatan")
    List<String> findDistinctKecamatan();
    
    @Query("SELECT DISTINCT b.kelurahan FROM Biografi b WHERE b.kelurahan IS NOT NULL AND b.status = 'AKTIF' ORDER BY b.kelurahan")
    List<String> findDistinctKelurahan();// Optimized query specifically for notification recipient selection
    // This query prioritizes performance for the most common use case
    @Query("SELECT DISTINCT b FROM Biografi b LEFT JOIN b.workExperiences we LEFT JOIN b.spesialisasiKedokteran sk WHERE " +
           "b.status = 'AKTIF' AND " +
           "b.nomorTelepon IS NOT NULL AND " +
           "(:nama IS NULL OR b.namaLengkap LIKE CONCAT('%', :nama, '%')) AND " +
           "(:nim IS NULL OR b.nim LIKE CONCAT('%', :nim, '%')) AND " +
           "(:email IS NULL OR b.email LIKE CONCAT('%', :email, '%')) AND " +
           "(:nomorTelepon IS NULL OR b.nomorTelepon LIKE CONCAT('%', :nomorTelepon, '%')) AND " +
           "(:jurusan IS NULL OR b.jurusan LIKE CONCAT('%', :jurusan, '%')) AND " +
           "(:pekerjaan IS NULL OR EXISTS (SELECT 1 FROM WorkExperience we2 WHERE we2.biografi = b AND we2.posisi LIKE CONCAT('%', :pekerjaan, '%'))) AND " +
           "(:programStudi IS NULL OR COALESCE(b.programStudi, b.jurusan) LIKE CONCAT('%', :programStudi, '%')) AND " +
           "(:alumniTahun IS NULL OR b.alumniTahun = :alumniTahun) AND " +
           "(:spesialisasi IS NULL OR EXISTS (SELECT 1 FROM SpesialisasiKedokteran sk2 WHERE sk2.biografi = b AND sk2.spesialisasi LIKE CONCAT('%', :spesialisasi, '%'))) AND " +
           "(:kota IS NULL OR b.kota LIKE CONCAT('%', :kota, '%')) AND " +
           "(:kecamatan IS NULL OR b.kecamatan LIKE CONCAT('%', :kecamatan, '%')) AND " +
           "(:kelurahan IS NULL OR b.kelurahan LIKE CONCAT('%', :kelurahan, '%')) AND " +
           "(:provinsi IS NULL OR b.provinsi LIKE CONCAT('%', :provinsi, '%'))")
    Page<Biografi> findActiveRecipientsWithFilters(
        @Param("nama") String nama,
        @Param("nim") String nim,
        @Param("email") String email,
        @Param("nomorTelepon") String nomorTelepon,
        @Param("jurusan") String jurusan,
        @Param("pekerjaan") String pekerjaan,
        @Param("programStudi") String programStudi,
        @Param("alumniTahun") String alumniTahun,
        @Param("spesialisasi") String spesialisasi,
        @Param("kota") String kota,
        @Param("kecamatan") String kecamatan,
        @Param("kelurahan") String kelurahan,
        @Param("provinsi") String provinsi,
        Pageable pageable
    );
    
    // Birthday related queries
    @Query("SELECT b FROM Biografi b WHERE " +
           "MONTH(b.tanggalLahir) = :month AND " +
           "DAY(b.tanggalLahir) = :day AND " +
           "b.status = 'AKTIF' AND " +
           "b.nomorTelepon IS NOT NULL")
    List<Biografi> findTodayBirthdays(@Param("month") int month, @Param("day") int day);
    
    @Query("SELECT b FROM Biografi b WHERE " +
           "b.tanggalLahir IS NOT NULL AND " +
           "b.status = 'AKTIF' AND " +
           "b.nomorTelepon IS NOT NULL " +
           "ORDER BY MONTH(b.tanggalLahir), DAY(b.tanggalLahir)")
    List<Biografi> findAllWithBirthdays();
    
    @Query("SELECT b FROM Biografi b WHERE " +
           "MONTH(b.tanggalLahir) = :month AND " +
           "b.status = 'AKTIF' AND " +
           "b.nomorTelepon IS NOT NULL " +
           "ORDER BY DAY(b.tanggalLahir)")
    List<Biografi> findBirthdaysByMonth(@Param("month") int month);
    
    // Dashboard methods
    List<Biografi> findTop5ByOrderByCreatedAtDesc();
    
    Long countByCreatedAtAfter(java.time.LocalDateTime date);    
    Long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    // Optimized search query that returns DTO to avoid lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.BiografiSearchDto(" +
           "b.biografiId, b.namaLengkap, b.nim, b.alumniTahun, b.email, b.nomorTelepon, " +
           "b.fotoProfil, b.jurusan, b.programStudi, b.tanggalLulus, b.ipk, " +
           "b.tanggalLahir, b.tempatLahir, b.jenisKelamin, b.agama, b.foto, " +
           "b.alamat, b.kota, b.provinsi, b.kecamatan, b.kelurahan, b.kodePos, " +
           "b.instagram, b.youtube, b.linkedin, b.facebook, b.tiktok, b.telegram, " +
           "b.catatan, b.status, b.createdAt, b.updatedAt) " +
           "FROM Biografi b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:nama IS NULL OR b.namaLengkap LIKE CONCAT('%', :nama, '%')) AND " +
           "(:nim IS NULL OR b.nim LIKE CONCAT('%', :nim, '%')) AND " +
           "(:email IS NULL OR b.email LIKE CONCAT('%', :email, '%')) AND " +
           "(:nomorTelepon IS NULL OR b.nomorTelepon LIKE CONCAT('%', :nomorTelepon, '%')) AND " +
           "(:jurusan IS NULL OR b.jurusan LIKE CONCAT('%', :jurusan, '%')) AND " +
           "(:programStudi IS NULL OR COALESCE(b.programStudi, b.jurusan) LIKE CONCAT('%', :programStudi, '%')) AND " +
           "(:alumniTahun IS NULL OR b.alumniTahun = :alumniTahun) AND " +
           "(:kota IS NULL OR b.kota LIKE CONCAT('%', :kota, '%')) AND " +
           "(:kecamatan IS NULL OR b.kecamatan LIKE CONCAT('%', :kecamatan, '%')) AND " +
           "(:kelurahan IS NULL OR b.kelurahan LIKE CONCAT('%', :kelurahan, '%')) AND " +
           "(:provinsi IS NULL OR b.provinsi LIKE CONCAT('%', :provinsi, '%')) AND " +
           "(:pekerjaan IS NULL OR EXISTS (SELECT 1 FROM WorkExperience we WHERE we.biografi = b AND we.posisi LIKE CONCAT('%', :pekerjaan, '%'))) AND " +
           "(:spesialisasi IS NULL OR EXISTS (SELECT 1 FROM SpesialisasiKedokteran sk WHERE sk.biografi = b AND sk.spesialisasi LIKE CONCAT('%', :spesialisasi, '%')))")
    Page<BiografiSearchDto> findBiografiSearchDto(
        @Param("status") Biografi.StatusBiografi status,
        @Param("nama") String nama,
        @Param("nim") String nim,
        @Param("email") String email,
        @Param("nomorTelepon") String nomorTelepon,
        @Param("jurusan") String jurusan,
        @Param("pekerjaan") String pekerjaan,
        @Param("programStudi") String programStudi,
        @Param("alumniTahun") String alumniTahun,
        @Param("spesialisasi") String spesialisasi,
        @Param("kota") String kota,
        @Param("kecamatan") String kecamatan,
        @Param("kelurahan") String kelurahan,
        @Param("provinsi") String provinsi,
        Pageable pageable
    );

    // Find biografi by exact name returning DTO to avoid lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.BiografiSearchDto(" +
           "b.biografiId, b.namaLengkap, b.nim, b.alumniTahun, b.email, b.nomorTelepon, " +
           "b.fotoProfil, b.jurusan, b.programStudi, b.tanggalLulus, b.ipk, " +
           "b.tanggalLahir, b.tempatLahir, b.jenisKelamin, b.agama, b.foto, " +
           "b.alamat, b.kota, b.provinsi, b.kecamatan, b.kelurahan, b.kodePos, " +
           "b.instagram, b.youtube, b.linkedin, b.facebook, b.tiktok, b.telegram, " +
           "b.catatan, b.status, b.createdAt, b.updatedAt) " +
           "FROM Biografi b WHERE b.namaLengkap = :namaLengkap")
    Optional<BiografiSearchDto> findBiografiDtoByNamaLengkap(@Param("namaLengkap") String namaLengkap);

    // Find biografi by ID returning DTO to avoid lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.BiografiSearchDto(" +
           "b.biografiId, b.namaLengkap, b.nim, b.alumniTahun, b.email, b.nomorTelepon, " +
           "b.fotoProfil, b.jurusan, b.programStudi, b.tanggalLulus, b.ipk, " +
           "b.tanggalLahir, b.tempatLahir, b.jenisKelamin, b.agama, b.foto, " +
           "b.alamat, b.kota, b.provinsi, b.kecamatan, b.kelurahan, b.kodePos, " +
           "b.instagram, b.youtube, b.linkedin, b.facebook, b.tiktok, b.telegram, " +
           "b.catatan, b.status, b.createdAt, b.updatedAt) " +
           "FROM Biografi b WHERE b.biografiId = :id")
    Optional<BiografiSearchDto> findBiografiDtoById(@Param("id") Long id);

    // Find biografi by NIM returning DTO to avoid lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.BiografiSearchDto(" +
           "b.biografiId, b.namaLengkap, b.nim, b.alumniTahun, b.email, b.nomorTelepon, " +
           "b.fotoProfil, b.jurusan, b.programStudi, b.tanggalLulus, b.ipk, " +
           "b.tanggalLahir, b.tempatLahir, b.jenisKelamin, b.agama, b.foto, " +
           "b.alamat, b.kota, b.provinsi, b.kecamatan, b.kelurahan, b.kodePos, " +
           "b.instagram, b.youtube, b.linkedin, b.facebook, b.tiktok, b.telegram, " +
           "b.catatan, b.status, b.createdAt, b.updatedAt) " +
           "FROM Biografi b WHERE b.nim = :nim")
    Optional<BiografiSearchDto> findBiografiDtoByNim(@Param("nim") String nim);

    // Find all biografi with pagination returning DTO to avoid lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.BiografiSearchDto(" +
           "b.biografiId, b.namaLengkap, b.nim, b.alumniTahun, b.email, b.nomorTelepon, " +
           "b.fotoProfil, b.jurusan, b.programStudi, b.tanggalLulus, b.ipk, " +
           "b.tanggalLahir, b.tempatLahir, b.jenisKelamin, b.agama, b.foto, " +
           "b.alamat, b.kota, b.provinsi, b.kecamatan, b.kelurahan, b.kodePos, " +
           "b.instagram, b.youtube, b.linkedin, b.facebook, b.tiktok, b.telegram, " +
           "b.catatan, b.status, b.createdAt, b.updatedAt) " +
           "FROM Biografi b")
    Page<BiografiSearchDto> findAllBiografiDto(Pageable pageable);

    // Find biografi by status returning DTO to avoid lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.BiografiSearchDto(" +
           "b.biografiId, b.namaLengkap, b.nim, b.alumniTahun, b.email, b.nomorTelepon, " +
           "b.fotoProfil, b.jurusan, b.programStudi, b.tanggalLulus, b.ipk, " +
           "b.tanggalLahir, b.tempatLahir, b.jenisKelamin, b.agama, b.foto, " +
           "b.alamat, b.kota, b.provinsi, b.kecamatan, b.kelurahan, b.kodePos, " +
           "b.instagram, b.youtube, b.linkedin, b.facebook, b.tiktok, b.telegram, " +
           "b.catatan, b.status, b.createdAt, b.updatedAt) " +
           "FROM Biografi b WHERE b.status = :status")
    Page<BiografiSearchDto> findBiografiDtoByStatus(@Param("status") Biografi.StatusBiografi status, Pageable pageable);

    // Search biografi by name returning DTO to avoid lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.BiografiSearchDto(" +
           "b.biografiId, b.namaLengkap, b.nim, b.alumniTahun, b.email, b.nomorTelepon, " +
           "b.fotoProfil, b.jurusan, b.programStudi, b.tanggalLulus, b.ipk, " +
           "b.tanggalLahir, b.tempatLahir, b.jenisKelamin, b.agama, b.foto, " +
           "b.alamat, b.kota, b.provinsi, b.kecamatan, b.kelurahan, b.kodePos, " +
           "b.instagram, b.youtube, b.linkedin, b.facebook, b.tiktok, b.telegram, " +
           "b.catatan, b.status, b.createdAt, b.updatedAt) " +
           "FROM Biografi b WHERE b.namaLengkap LIKE CONCAT('%', :nama, '%')")
    Page<BiografiSearchDto> findBiografiDtoByNamaContaining(@Param("nama") String nama, Pageable pageable);    // Find biografi with upcoming birthdays (actual birth dates)
    @Query(value = "SELECT b.* FROM biografi b WHERE " +
           "b.tanggal_lahir IS NOT NULL AND " +
           "b.status = 'AKTIF' AND " +
           "(" +
           "  (MONTH(b.tanggal_lahir) > MONTH(:today) OR " +
           "   (MONTH(b.tanggal_lahir) = MONTH(:today) AND DAY(b.tanggal_lahir) >= DAY(:today))) AND " +
           "  DATEDIFF(" +
           "    DATE(CONCAT(YEAR(:today), '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir))), " +
           "    :today" +
           "  ) <= :days" +
           ") OR (" +
           "  (MONTH(b.tanggal_lahir) < MONTH(:today) OR " +
           "   (MONTH(b.tanggal_lahir) = MONTH(:today) AND DAY(b.tanggal_lahir) < DAY(:today))) AND " +
           "  DATEDIFF(" +
           "    DATE(CONCAT(YEAR(:today) + 1, '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir))), " +
           "    :today" +
           "  ) <= :days" +
           ")" +
           "ORDER BY " +
           "CASE " +
           "  WHEN MONTH(b.tanggal_lahir) > MONTH(:today) OR " +
           "       (MONTH(b.tanggal_lahir) = MONTH(:today) AND DAY(b.tanggal_lahir) >= DAY(:today)) " +
           "  THEN DATEDIFF(DATE(CONCAT(YEAR(:today), '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir))), :today) " +
           "  ELSE DATEDIFF(DATE(CONCAT(YEAR(:today) + 1, '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir))), :today) " +
           "END ASC", nativeQuery = true)
    List<Biografi> findUpcomingBirthdays(@Param("today") java.time.LocalDate today, @Param("days") Integer days);    // Find biografi with past birthdays (actual birth dates)
    @Query(value = "SELECT b.* FROM biografi b WHERE " +
           "b.tanggal_lahir IS NOT NULL AND " +
           "b.status = 'AKTIF' AND " +
           "(" +
           "  (MONTH(b.tanggal_lahir) < MONTH(:today) OR " +
           "   (MONTH(b.tanggal_lahir) = MONTH(:today) AND DAY(b.tanggal_lahir) <= DAY(:today))) AND " +
           "  DATEDIFF(" +
           "    :today, " +
           "    DATE(CONCAT(YEAR(:today), '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir)))" +
           "  ) <= :days AND " +
           "  DATEDIFF(" +
           "    :today, " +
           "    DATE(CONCAT(YEAR(:today), '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir)))" +
           "  ) >= 0" +
           ") OR (" +
           "  (MONTH(b.tanggal_lahir) > MONTH(:today) OR " +
           "   (MONTH(b.tanggal_lahir) = MONTH(:today) AND DAY(b.tanggal_lahir) > DAY(:today))) AND " +
           "  DATEDIFF(" +
           "    :today, " +
           "    DATE(CONCAT(YEAR(:today) - 1, '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir)))" +
           "  ) <= :days AND " +
           "  DATEDIFF(" +
           "    :today, " +
           "    DATE(CONCAT(YEAR(:today) - 1, '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir)))" +
           "  ) >= 0" +
           ")" +
           "ORDER BY " +
           "CASE " +
           "  WHEN MONTH(b.tanggal_lahir) <= MONTH(:today) AND " +
           "       (MONTH(b.tanggal_lahir) < MONTH(:today) OR DAY(b.tanggal_lahir) <= DAY(:today)) " +
           "  THEN DATEDIFF(:today, DATE(CONCAT(YEAR(:today), '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir)))) " +
           "  ELSE DATEDIFF(:today, DATE(CONCAT(YEAR(:today) - 1, '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir)))) " +
           "END ASC", nativeQuery = true)
    List<Biografi> findPastBirthdays(@Param("today") java.time.LocalDate today, @Param("days") Integer days);

    // Map location queries - find alumni with coordinates
    List<Biografi> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(Biografi.StatusBiografi status);
    
    List<Biografi> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndProvinsiContainingIgnoreCase(
        Biografi.StatusBiografi status, String provinsi);
    
    List<Biografi> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndKotaContainingIgnoreCase(
        Biografi.StatusBiografi status, String kota);
    
    List<Biografi> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndProvinsiContainingIgnoreCaseAndKotaContainingIgnoreCase(
        Biografi.StatusBiografi status, String provinsi, String kota);
    
    List<Biografi> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndProvinsiContainingIgnoreCaseAndKotaContainingIgnoreCaseAndKecamatanContainingIgnoreCase(
        Biografi.StatusBiografi status, String provinsi, String kota, String kecamatan);
    
    List<Biografi> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndProvinsiContainingIgnoreCaseAndKotaContainingIgnoreCaseAndKecamatanContainingIgnoreCaseAndKelurahanContainingIgnoreCase(
        Biografi.StatusBiografi status, String provinsi, String kota, String kecamatan, String kelurahan);
      List<Biografi> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndKodePosContaining(
        Biografi.StatusBiografi status, String kodePos);

    // Native query projection for user profile without lazy loading
    interface BiografiProfileProjection {
        Long getBiografiId();
        String getNamaLengkap();
        String getEmail();
        String getNomorTelepon();
        String getFoto();
        String getFotoProfil();
        String getJurusan();
        String getAlumniTahun();
        String getStatus();
    }

    @Query(value = """
        SELECT b.biografi_id as biografiId, 
               b.nama_lengkap as namaLengkap,
               b.email as email,
               b.nomor_telepon as nomorTelepon,
               b.foto as foto,
               b.foto_profil as fotoProfil,
               b.jurusan as jurusan,
               b.alumni_tahun as alumniTahun,
               b.status as status
        FROM biografi b 
        INNER JOIN users u ON u.biografi_id = b.biografi_id 
        WHERE u.id = :userId AND b.status = 'AKTIF'
        """, nativeQuery = true)
    Optional<BiografiProfileProjection> findProfileByUserId(@Param("userId") Long userId);
}
