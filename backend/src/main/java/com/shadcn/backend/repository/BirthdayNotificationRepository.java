package com.shadcn.backend.repository;

import com.shadcn.backend.dto.BirthdayNotificationDTO;
import com.shadcn.backend.model.BirthdayNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BirthdayNotificationRepository extends JpaRepository<BirthdayNotification, Long> {
      @Query("SELECT bn FROM BirthdayNotification bn WHERE bn.notificationDate = :date")
    List<BirthdayNotification> findByBirthdayDate(@Param("date") LocalDate date);
    
    @Query("SELECT bn FROM BirthdayNotification bn WHERE bn.status = :status")
    List<BirthdayNotification> findByStatus(@Param("status") BirthdayNotification.NotificationStatus status);
    
    @Query("SELECT bn FROM BirthdayNotification bn WHERE bn.biografi.id = :biografiId")
    List<BirthdayNotification> findByBiografiId(@Param("biografiId") Long biografiId);    @Query("SELECT bn FROM BirthdayNotification bn WHERE " +
           "bn.biografi.id = :biografiId AND bn.year = :year")
    List<BirthdayNotification> findByBiografiIdAndYear(@Param("biografiId") Long biografiId, @Param("year") Integer year);
    
    @Modifying
    @Query("DELETE FROM BirthdayNotification bn WHERE bn.year = :year")
    void deleteByYear(@Param("year") Integer year);
    @Query("SELECT bn FROM BirthdayNotification bn WHERE bn.biografi = :biografi AND bn.year = :year")
    List<BirthdayNotification> findByBiografiAndYear(@Param("biografi") com.shadcn.backend.model.Biografi biografi, @Param("year") Integer year);
    
    @Query("SELECT bn FROM BirthdayNotification bn WHERE " +
           "bn.notificationDate = :date AND bn.status = 'PENDING'")
    List<BirthdayNotification> findTodayPendingNotifications(@Param("date") LocalDate date);
    
    @Query("SELECT bn FROM BirthdayNotification bn WHERE " +
           "bn.notificationDate BETWEEN :startDate AND :endDate " +
           "ORDER BY bn.notificationDate ASC")
    List<BirthdayNotification> findUpcomingBirthdays(@Param("startDate") LocalDate startDate, 
                                                    @Param("endDate") LocalDate endDate);
    
    @Query("SELECT bn FROM BirthdayNotification bn WHERE " +
           "bn.notificationDate BETWEEN :startDate AND :endDate " +
           "ORDER BY bn.notificationDate DESC")
    List<BirthdayNotification> findPastBirthdays(@Param("startDate") LocalDate startDate, 
                                                @Param("endDate") LocalDate endDate);
    
    @Query("SELECT " +
           "COUNT(bn) as total, " +
           "COUNT(CASE WHEN bn.status = 'SENT' THEN 1 END) as sent, " +
           "COUNT(CASE WHEN bn.status = 'PENDING' THEN 1 END) as pending, " +
           "COUNT(CASE WHEN bn.status = 'FAILED' THEN 1 END) as failed, " +
           "COUNT(CASE WHEN bn.isExcluded = true THEN 1 END) as excluded " +
           "FROM BirthdayNotification bn WHERE bn.year = :year")
    List<Object[]> getBirthdayStatistics(@Param("year") Integer year);    @Query("SELECT bn FROM BirthdayNotification bn WHERE " +
           "(:status IS NULL OR bn.status = :status) AND " +
           "(:dateFrom IS NULL OR bn.notificationDate >= :dateFrom) AND " +
           "(:dateTo IS NULL OR bn.notificationDate <= :dateTo) AND " +
           "(:isExcluded IS NULL OR bn.isExcluded = :isExcluded) AND " +
           "(:year IS NULL OR bn.year = :year) AND " +
           "(:alumniYear IS NULL OR bn.biografi.alumniTahun = :alumniYear) AND " +
           "(:nama IS NULL OR LOWER(bn.biografi.namaLengkap) LIKE LOWER(CONCAT('%', :nama, '%'))) AND " +
           "(:birthDateFrom IS NULL OR " +
           " (MONTH(bn.biografi.tanggalLahir) > MONTH(:birthDateFrom) OR " +
           "  (MONTH(bn.biografi.tanggalLahir) = MONTH(:birthDateFrom) AND DAY(bn.biografi.tanggalLahir) >= DAY(:birthDateFrom)))) AND " +
           "(:birthDateTo IS NULL OR " +
           " (MONTH(bn.biografi.tanggalLahir) < MONTH(:birthDateTo) OR " +
           "  (MONTH(bn.biografi.tanggalLahir) = MONTH(:birthDateTo) AND DAY(bn.biografi.tanggalLahir) <= DAY(:birthDateTo))))")
    Page<BirthdayNotification> findWithFilters(
        @Param("status") BirthdayNotification.NotificationStatus status,
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        @Param("isExcluded") Boolean isExcluded,
        @Param("year") Integer year,
        @Param("alumniYear") String alumniYear,
        @Param("nama") String nama,
        @Param("birthDateFrom") LocalDate birthDateFrom,
        @Param("birthDateTo") LocalDate birthDateTo,
        Pageable pageable
    );    @Query(value = "SELECT bn.* FROM birthday_notifications bn " +
           "JOIN biografi b ON bn.biografi_id = b.biografi_id " +
           "WHERE (:status IS NULL OR bn.status = :status) " +
           "AND (:dateFrom IS NULL OR bn.notification_date >= :dateFrom) " +
           "AND (:dateTo IS NULL OR bn.notification_date <= :dateTo) " +
           "AND (:isExcluded IS NULL OR bn.is_excluded = :isExcluded) " +
           "AND (:year IS NULL OR bn.year = :year) " +
           "AND (:alumniYear IS NULL OR b.alumni_tahun = :alumniYear) " +
           "AND (:nama IS NULL OR LOWER(b.nama_lengkap) LIKE LOWER(CONCAT('%', :nama, '%'))) " +
           "AND (:provinsi IS NULL OR LOWER(b.provinsi) LIKE LOWER(CONCAT('%', :provinsi, '%'))) " +
           "AND (:kota IS NULL OR LOWER(b.kota) LIKE LOWER(CONCAT('%', :kota, '%'))) " +
           "AND (:kecamatan IS NULL OR LOWER(b.kecamatan) LIKE LOWER(CONCAT('%', :kecamatan, '%'))) " +
           "AND (:kelurahan IS NULL OR LOWER(b.kelurahan) LIKE LOWER(CONCAT('%', :kelurahan, '%'))) " +
           "AND (:birthDateFrom IS NULL OR " +
           "     (MONTH(b.tanggal_lahir) > MONTH(:birthDateFrom) OR " +
           "      (MONTH(b.tanggal_lahir) = MONTH(:birthDateFrom) AND DAY(b.tanggal_lahir) >= DAY(:birthDateFrom)))) " +
           "AND (:birthDateTo IS NULL OR " +
           "     (MONTH(b.tanggal_lahir) < MONTH(:birthDateTo) OR " +
           "      (MONTH(b.tanggal_lahir) = MONTH(:birthDateTo) AND DAY(b.tanggal_lahir) <= DAY(:birthDateTo)))) " +
           "AND (:maxDaysUntilBirthday IS NULL OR " +
           "CASE " +
           "  WHEN MONTH(b.tanggal_lahir) > MONTH(CURDATE()) OR " +
           "       (MONTH(b.tanggal_lahir) = MONTH(CURDATE()) AND DAY(b.tanggal_lahir) >= DAY(CURDATE())) " +
           "  THEN DATEDIFF(DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir))), CURDATE()) " +
           "  ELSE DATEDIFF(DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir))), CURDATE()) " +
           "END <= :maxDaysUntilBirthday)",
           countQuery = "SELECT COUNT(*) FROM birthday_notifications bn " +
           "JOIN biografi b ON bn.biografi_id = b.biografi_id " +
           "WHERE (:status IS NULL OR bn.status = :status) " +
           "AND (:dateFrom IS NULL OR bn.notification_date >= :dateFrom) " +
           "AND (:dateTo IS NULL OR bn.notification_date <= :dateTo) " +
           "AND (:isExcluded IS NULL OR bn.is_excluded = :isExcluded) " +
           "AND (:year IS NULL OR bn.year = :year) " +
           "AND (:alumniYear IS NULL OR b.alumni_tahun = :alumniYear) " +
           "AND (:nama IS NULL OR LOWER(b.nama_lengkap) LIKE LOWER(CONCAT('%', :nama, '%'))) " +
           "AND (:provinsi IS NULL OR LOWER(b.provinsi) LIKE LOWER(CONCAT('%', :provinsi, '%'))) " +
           "AND (:kota IS NULL OR LOWER(b.kota) LIKE LOWER(CONCAT('%', :kota, '%'))) " +
           "AND (:kecamatan IS NULL OR LOWER(b.kecamatan) LIKE LOWER(CONCAT('%', :kecamatan, '%'))) " +
           "AND (:kelurahan IS NULL OR LOWER(b.kelurahan) LIKE LOWER(CONCAT('%', :kelurahan, '%'))) " +
           "AND (:birthDateFrom IS NULL OR " +
           "     (MONTH(b.tanggal_lahir) > MONTH(:birthDateFrom) OR " +
           "      (MONTH(b.tanggal_lahir) = MONTH(:birthDateFrom) AND DAY(b.tanggal_lahir) >= DAY(:birthDateFrom)))) " +
           "AND (:birthDateTo IS NULL OR " +
           "     (MONTH(b.tanggal_lahir) < MONTH(:birthDateTo) OR " +
           "      (MONTH(b.tanggal_lahir) = MONTH(:birthDateTo) AND DAY(b.tanggal_lahir) <= DAY(:birthDateTo)))) " +
           "AND (:maxDaysUntilBirthday IS NULL OR " +
           "CASE " +
           "  WHEN MONTH(b.tanggal_lahir) > MONTH(CURDATE()) OR " +
           "       (MONTH(b.tanggal_lahir) = MONTH(CURDATE()) AND DAY(b.tanggal_lahir) >= DAY(CURDATE())) " +
           "  THEN DATEDIFF(DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir))), CURDATE()) " +
           "  ELSE DATEDIFF(DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(b.tanggal_lahir), '-', DAY(b.tanggal_lahir))), CURDATE()) " +
           "END <= :maxDaysUntilBirthday)",           nativeQuery = true)
    Page<BirthdayNotification> findWithFiltersIncludingMaxDays(
        @Param("status") String status,
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        @Param("isExcluded") Boolean isExcluded,
        @Param("year") Integer year,
        @Param("alumniYear") String alumniYear,
        @Param("nama") String nama,
        @Param("provinsi") String provinsi,
        @Param("kota") String kota,
        @Param("kecamatan") String kecamatan,
        @Param("kelurahan") String kelurahan,
        @Param("birthDateFrom") LocalDate birthDateFrom,
        @Param("birthDateTo") LocalDate birthDateTo,
        @Param("maxDaysUntilBirthday") Integer maxDaysUntilBirthday,
        Pageable pageable
    );    // Method that returns DTOs directly to avoid LazyInitializationException
    @Query(value = "SELECT new com.shadcn.backend.dto.BirthdayNotificationDTO(" +
           "bn.id, b.biografiId, b.namaLengkap, b.nomorTelepon, b.email, b.tanggalLahir, " +
           "bn.birthdayDate, bn.notificationDate, bn.year, bn.status, " +
           "CASE WHEN bn.status = 'SENT' THEN 'Terkirim' " +
           "     WHEN bn.status = 'FAILED' THEN 'Gagal' " +
           "     WHEN bn.status = 'PENDING' THEN 'Menunggu' " +
           "     WHEN bn.status = 'EXCLUDED' THEN 'Dikecualikan' " +
           "     WHEN bn.status = 'RESENT' THEN 'Dikirim Ulang' " +
           "     ELSE CAST(bn.status AS string) END, " +
           "bn.message, bn.sentAt, bn.errorMessage, bn.isExcluded, " +
           "bn.createdAt, bn.updatedAt, " +
           "(YEAR(CURRENT_DATE) - YEAR(b.tanggalLahir))) " +
           "FROM BirthdayNotification bn JOIN bn.biografi b WHERE " +
           "(:status IS NULL OR bn.status = :status) AND " +
           "(:dateFrom IS NULL OR bn.notificationDate >= :dateFrom) AND " +
           "(:dateTo IS NULL OR bn.notificationDate <= :dateTo) AND " +
           "(:isExcluded IS NULL OR bn.isExcluded = :isExcluded) AND " +
           "(:year IS NULL OR bn.year = :year) AND " +
           "(:alumniYear IS NULL OR b.alumniTahun = :alumniYear) AND " +
           "(:nama IS NULL OR LOWER(b.namaLengkap) LIKE LOWER(CONCAT('%', :nama, '%')))")
    Page<BirthdayNotificationDTO> findDTOsWithFilters(
        @Param("status") BirthdayNotification.NotificationStatus status,
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        @Param("isExcluded") Boolean isExcluded,
        @Param("year") Integer year,
        @Param("alumniYear") String alumniYear,
        @Param("nama") String nama,
        Pageable pageable
    );

    // Method for upcoming birthdays that returns DTOs directly
    @Query("SELECT new com.shadcn.backend.dto.BirthdayNotificationDTO(" +
           "bn.id, b.biografiId, b.namaLengkap, b.nomorTelepon, b.email, b.tanggalLahir, " +
           "bn.birthdayDate, bn.notificationDate, bn.year, bn.status, " +
           "CASE WHEN bn.status = 'SENT' THEN 'Terkirim' " +
           "     WHEN bn.status = 'FAILED' THEN 'Gagal' " +
           "     WHEN bn.status = 'PENDING' THEN 'Menunggu' " +
           "     WHEN bn.status = 'EXCLUDED' THEN 'Dikecualikan' " +
           "     WHEN bn.status = 'RESENT' THEN 'Dikirim Ulang' " +
           "     ELSE bn.status END, " +
           "bn.message, bn.sentAt, bn.errorMessage, bn.isExcluded, " +
           "bn.createdAt, bn.updatedAt, " +
           "(YEAR(CURRENT_DATE) - YEAR(b.tanggalLahir))) " +
           "FROM BirthdayNotification bn JOIN bn.biografi b " +
           "WHERE bn.notificationDate BETWEEN :startDate AND :endDate " +
           "ORDER BY bn.notificationDate ASC")
    List<BirthdayNotificationDTO> findUpcomingBirthdayDTOs(@Param("startDate") LocalDate startDate, 
                                                           @Param("endDate") LocalDate endDate);

    // Method for past birthdays that returns DTOs directly 
    @Query("SELECT new com.shadcn.backend.dto.BirthdayNotificationDTO(" +
           "bn.id, b.biografiId, b.namaLengkap, b.nomorTelepon, b.email, b.tanggalLahir, " +
           "bn.birthdayDate, bn.notificationDate, bn.year, bn.status, " +
           "CASE WHEN bn.status = 'SENT' THEN 'Terkirim' " +
           "     WHEN bn.status = 'FAILED' THEN 'Gagal' " +
           "     WHEN bn.status = 'PENDING' THEN 'Menunggu' " +
           "     WHEN bn.status = 'EXCLUDED' THEN 'Dikecualikan' " +
           "     WHEN bn.status = 'RESENT' THEN 'Dikirim Ulang' " +
           "     ELSE bn.status END, " +
           "bn.message, bn.sentAt, bn.errorMessage, bn.isExcluded, " +
           "bn.createdAt, bn.updatedAt, " +
           "(YEAR(CURRENT_DATE) - YEAR(b.tanggalLahir))) " +
           "FROM BirthdayNotification bn JOIN bn.biografi b " +
           "WHERE bn.notificationDate BETWEEN :startDate AND :endDate " +
           "ORDER BY bn.notificationDate DESC")
    List<BirthdayNotificationDTO> findPastBirthdayDTOs(@Param("startDate") LocalDate startDate, 
                                                       @Param("endDate") LocalDate endDate);
}