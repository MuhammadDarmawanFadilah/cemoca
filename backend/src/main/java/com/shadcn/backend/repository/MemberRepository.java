package com.shadcn.backend.repository;

import com.shadcn.backend.model.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    
    Optional<Member> findByEmail(String email);
    
    Optional<Member> findByTelepon(String telepon);
    
    boolean existsByEmail(String email);
    
    boolean existsByTelepon(String telepon);
    
    boolean existsByEmailIgnoreCase(String email);
    
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
    
    boolean existsByTeleponAndIdNot(String telepon, Long id);
    
    List<Member> findByNamaContainingIgnoreCase(String nama);
    
    List<Member> findByTeleponContaining(String telepon);
    
    List<Member> findByEmailContainingIgnoreCase(String email);
    
    Optional<Member> findByEmailIgnoreCase(String email);
    
    // Enhanced search with filters
    @Query("SELECT m FROM Member m WHERE " +
           "(:keyword IS NULL OR LOWER(m.nama) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.telepon) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.pekerjaan) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status IS NULL OR m.status = :status) AND " +
           "(:prioritas IS NULL OR m.tingkatPrioritas = :prioritas)")
    List<Member> findMembersWithFilters(
        @Param("keyword") String keyword,
        @Param("status") Member.Status status,
        @Param("prioritas") Member.TingkatPrioritas prioritas
    );
    
    // Statistics queries
    @Query("SELECT COUNT(m) FROM Member m WHERE m.status = :status")
    long countByStatus(@Param("status") Member.Status status);
    
    @Query("SELECT SUM(m.poin) FROM Member m WHERE m.status = 'AKTIF'")
    Long getTotalPoin();
    
    // Status and priority queries
    List<Member> findByStatus(Member.Status status);
    
    List<Member> findByTingkatPrioritas(Member.TingkatPrioritas tingkatPrioritas);
    
    @Query("SELECT m FROM Member m WHERE m.status = :status ORDER BY m.createdAt DESC")
    List<Member> findByStatusOrderByCreatedAtDesc(@Param("status") Member.Status status);
    
    // Wilayah-based queries
    @Query("SELECT m FROM Member m WHERE m.provinsi = :provinsi")
    List<Member> findByProvinsi(@Param("provinsi") String provinsi);
    
    @Query("SELECT m FROM Member m WHERE m.kota = :kota")
    List<Member> findByKota(@Param("kota") String kota);
    
    @Query("SELECT m FROM Member m WHERE m.kecamatan = :kecamatan")
    List<Member> findByKecamatan(@Param("kecamatan") String kecamatan);
    
    @Query("SELECT m FROM Member m WHERE m.kelurahan = :kelurahan")
    List<Member> findByKelurahan(@Param("kelurahan") String kelurahan);
    
    @Query("SELECT m FROM Member m ORDER BY m.nama ASC")
    List<Member> findAllOrderByNama();
    
    // Paginated search
    @Query("SELECT m FROM Member m WHERE " +
           "LOWER(m.nama) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "m.telepon LIKE CONCAT('%', :keyword, '%')")
    Page<Member> findByNamaContainingIgnoreCaseOrEmailContainingIgnoreCaseOrTeleponContaining(
        @Param("keyword") String nama, 
        @Param("keyword") String email, 
        @Param("keyword") String telepon, 
        Pageable pageable
    );
}