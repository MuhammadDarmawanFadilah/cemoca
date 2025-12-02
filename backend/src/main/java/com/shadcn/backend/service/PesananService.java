package com.shadcn.backend.service;

import com.shadcn.backend.model.Pesanan;
import com.shadcn.backend.model.DetailPesanan;
import com.shadcn.backend.model.Member;
import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Barang;
import com.shadcn.backend.model.Kategori;
import com.shadcn.backend.repository.PesananRepository;
import com.shadcn.backend.repository.DetailPesananRepository;
import com.shadcn.backend.repository.MemberRepository;
import com.shadcn.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PesananService {
    
    @Autowired
    private PesananRepository pesananRepository;
    
    @Autowired
    private DetailPesananRepository detailPesananRepository;
    
    @Autowired
    private MemberRepository memberRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BarangService barangService;
    
    public List<Pesanan> getAllPesanan() {
        return pesananRepository.findAll();
    }
    
    public Page<Pesanan> getAllPesananPaginated(Pageable pageable) {
        return pesananRepository.findAll(pageable);
    }
    
    public Page<Pesanan> searchPesanan(int page, int size, String memberName, String status, 
                                      String barangName, String kategori, String startDate, String endDate, 
                                      String sortBy, String sortDir) {
        
        // Create sort direction
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Build specification for filtering
        Specification<Pesanan> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by member name
            if (memberName != null && !memberName.trim().isEmpty()) {
                // Use LEFT JOIN to include null members (Non-Member cases)
                Join<Pesanan, Member> memberJoin = root.join("member", jakarta.persistence.criteria.JoinType.LEFT);
                
                // Create predicate for both member name and "Non-Member" case
                Predicate memberNamePredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(memberJoin.get("nama")), 
                    "%" + memberName.toLowerCase() + "%"
                );
                
                // Check if searching for "Non-Member" and include null member cases
                if (memberName.toLowerCase().contains("non-member") || memberName.toLowerCase().contains("non member")) {
                    Predicate nullMemberPredicate = criteriaBuilder.isNull(root.get("member"));
                    predicates.add(criteriaBuilder.or(memberNamePredicate, nullMemberPredicate));
                } else {
                    predicates.add(memberNamePredicate);
                }
            }
            
            // Filter by status
            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                try {
                    Pesanan.StatusPesanan statusEnum = Pesanan.StatusPesanan.valueOf(status.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("status"), statusEnum));
                } catch (IllegalArgumentException e) {
                    // Invalid status, ignore filter
                }
            }
            
            // Filter by barang name (through details)
            if (barangName != null && !barangName.trim().isEmpty()) {
                Join<Pesanan, DetailPesanan> detailJoin = root.join("details");
                Join<DetailPesanan, Barang> barangJoin = detailJoin.join("barang");
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(barangJoin.get("nama")), 
                    "%" + barangName.toLowerCase() + "%"
                ));
            }
            
            // Filter by kategori name (through details -> barang -> kategori)
            if (kategori != null && !kategori.trim().isEmpty() && !"ALL".equalsIgnoreCase(kategori)) {
                Join<Pesanan, DetailPesanan> detailJoin = root.join("details");
                Join<DetailPesanan, Barang> barangJoin = detailJoin.join("barang");
                Join<Barang, Kategori> kategoriJoin = barangJoin.join("kategori");
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(kategoriJoin.get("nama")), 
                    "%" + kategori.toLowerCase() + "%"
                ));
            }
            
            // Filter by date range
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            
            if (startDate != null && !startDate.trim().isEmpty()) {
                try {
                    LocalDateTime startDateTime = LocalDate.parse(startDate, formatter).atStartOfDay();
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("tanggalPesanan"), startDateTime));
                } catch (Exception e) {
                    // Invalid date format, ignore filter
                }
            }
            
            if (endDate != null && !endDate.trim().isEmpty()) {
                try {
                    LocalDateTime endDateTime = LocalDate.parse(endDate, formatter).atTime(23, 59, 59);
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("tanggalPesanan"), endDateTime));
                } catch (Exception e) {
                    // Invalid date format, ignore filter
                }
            }
            
            // Default date range (last 30 days) if no dates provided
            if ((startDate == null || startDate.trim().isEmpty()) && 
                (endDate == null || endDate.trim().isEmpty())) {
                LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("tanggalPesanan"), thirtyDaysAgo));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        return pesananRepository.findAll(spec, pageable);
    }
    
    public Optional<Pesanan> getPesananById(Long id) {
        return pesananRepository.findById(id);
    }
    
    public List<Pesanan> getPesananByMember(Long memberId) {
        Optional<Member> member = memberRepository.findById(memberId);
        if (member.isEmpty()) {
            throw new RuntimeException("Member not found with id: " + memberId);
        }
        return pesananRepository.findByMember(member.get());
    }
    
    public List<Pesanan> getPesananByKaryawan(Long karyawanId) {
        Optional<User> karyawan = userRepository.findById(karyawanId);
        if (karyawan.isEmpty()) {
            throw new RuntimeException("Karyawan not found with id: " + karyawanId);
        }
        return pesananRepository.findByKaryawan(karyawan.get());
    }
    
    public List<Pesanan> getPesananByStatus(Pesanan.StatusPesanan status) {
        return pesananRepository.findByStatus(status);
    }
    
    public Page<Pesanan> getPesananByStatusPaginated(Pesanan.StatusPesanan status, Pageable pageable) {
        return pesananRepository.findByStatusOrderByTanggalPesananDesc(status, pageable);
    }
    
    @Transactional
    public Pesanan createPesanan(Pesanan pesanan, List<DetailPesanan> detailPesananList) {
        // Validate member
        if (pesanan.getMember() != null && pesanan.getMember().getId() != null) {
            Optional<Member> member = memberRepository.findById(pesanan.getMember().getId());
            if (member.isEmpty()) {
                throw new RuntimeException("Member not found with id: " + pesanan.getMember().getId());
            }
            pesanan.setMember(member.get());
        }
        
        // Validate karyawan
        if (pesanan.getKaryawan() != null && pesanan.getKaryawan().getId() != null) {
            Optional<User> karyawan = userRepository.findById(pesanan.getKaryawan().getId());
            if (karyawan.isEmpty()) {
                throw new RuntimeException("Karyawan not found with id: " + pesanan.getKaryawan().getId());
            }
            pesanan.setKaryawan(karyawan.get());
        }
        
        pesanan.setTanggalPesanan(LocalDateTime.now());
        pesanan.setStatus(Pesanan.StatusPesanan.PENDING);
        
        // Calculate totals from detail pesanan
        BigDecimal totalHarga = BigDecimal.ZERO;
        Integer totalPoin = 0;
        
        for (DetailPesanan detail : detailPesananList) {
            // Validate barang and check stock
            Optional<Barang> barang = barangService.getBarangById(detail.getBarang().getId());
            if (barang.isEmpty()) {
                throw new RuntimeException("Barang not found with id: " + detail.getBarang().getId());
            }
            
            Barang barangEntity = barang.get();
            if (barangEntity.getStock() < detail.getJumlah()) {
                throw new RuntimeException("Insufficient stock for barang: " + barangEntity.getNama());
            }
            
            detail.setBarang(barangEntity);
            detail.setHargaSatuan(barangEntity.getHarga());
            detail.setSubtotal(barangEntity.getHarga().multiply(BigDecimal.valueOf(detail.getJumlah())));
            
            totalHarga = totalHarga.add(detail.getSubtotal());
            totalPoin += (barangEntity.getPoin() != null ? barangEntity.getPoin() : 0) * detail.getJumlah();
        }
        
        pesanan.setTotalHarga(totalHarga);
        pesanan.setTotalPoin(totalPoin);
        
        // Save pesanan first
        Pesanan savedPesanan = pesananRepository.save(pesanan);
        
        // Save detail pesanan
        for (DetailPesanan detail : detailPesananList) {
            detail.setPesanan(savedPesanan);
            detailPesananRepository.save(detail);
        }
        
        return savedPesanan;
    }
    
    @Transactional
    public Pesanan updatePesananStatus(Long id, Pesanan.StatusPesanan newStatus) {
        return pesananRepository.findById(id)
                .map(pesanan -> {
                    Pesanan.StatusPesanan oldStatus = pesanan.getStatus();
                    pesanan.setStatus(newStatus);
                    
                    // If order is being confirmed (PENDING -> PROCESSING), reduce stock
                    if (oldStatus == Pesanan.StatusPesanan.PENDING && newStatus == Pesanan.StatusPesanan.PROCESSING) {
                        List<DetailPesanan> details = detailPesananRepository.findByPesanan(pesanan);
                        for (DetailPesanan detail : details) {
                            barangService.reduceStock(detail.getBarang().getId(), detail.getJumlah());
                        }
                    }
                    
                    // If order is being cancelled from PROCESSING, restore stock
                    if (oldStatus == Pesanan.StatusPesanan.PROCESSING && newStatus == Pesanan.StatusPesanan.CANCELLED) {
                        List<DetailPesanan> details = detailPesananRepository.findByPesanan(pesanan);
                        for (DetailPesanan detail : details) {
                            Barang barang = detail.getBarang();
                            barangService.updateStock(barang.getId(), barang.getStock() + detail.getJumlah());
                        }
                    }
                    
                    return pesananRepository.save(pesanan);
                })
                .orElseThrow(() -> new RuntimeException("Pesanan not found with id: " + id));
    }
    
    public void deletePesanan(Long id) {
        Optional<Pesanan> pesanan = pesananRepository.findById(id);
        if (pesanan.isEmpty()) {
            throw new RuntimeException("Pesanan not found with id: " + id);
        }
        
        // If pesanan was processed, restore stock
        if (pesanan.get().getStatus() == Pesanan.StatusPesanan.PROCESSING) {
            List<DetailPesanan> details = detailPesananRepository.findByPesanan(pesanan.get());
            for (DetailPesanan detail : details) {
                Barang barang = detail.getBarang();
                barangService.updateStock(barang.getId(), barang.getStock() + detail.getJumlah());
            }
        }
        
        pesananRepository.deleteById(id);
    }
    
    public List<DetailPesanan> getDetailPesananByPesananId(Long pesananId) {
        return detailPesananRepository.findByPesananId(pesananId);
    }
    
    public List<Pesanan> getPesananByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return pesananRepository.findByTanggalPesananBetween(startDate, endDate);
    }
    
    public BigDecimal getTotalRevenueByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        BigDecimal revenue = pesananRepository.getTotalRevenueByDateRange(startDate, endDate);
        return revenue != null ? revenue : BigDecimal.ZERO;
    }
    
    public BigDecimal getTodayRevenue() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);
        return getTotalRevenueByDateRange(startOfDay, endOfDay);
    }
    
    public long countTodayOrders() {
        return pesananRepository.countTodayOrders();
    }
    
    public long countOrdersByStatus(Pesanan.StatusPesanan status) {
        return pesananRepository.countByStatus(status);
    }
}