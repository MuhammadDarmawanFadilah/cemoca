package com.shadcn.backend.service;

import com.shadcn.backend.model.Barang;
import com.shadcn.backend.model.Kategori;
import com.shadcn.backend.repository.BarangRepository;
import com.shadcn.backend.repository.KategoriRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BarangService {
    
    @Autowired
    private BarangRepository barangRepository;
    
    @Autowired
    private KategoriRepository kategoriRepository;
    
    public List<Barang> getAllBarang() {
        return barangRepository.findAll();
    }
    
    public Page<Barang> getAllBarangPaginated(Pageable pageable) {
        return barangRepository.findAll(pageable);
    }
    
    public Page<Barang> searchBarang(int page, int size, String nama, Long kategoriId, 
                                    String sortBy, String sortDir, Double minHarga, Double maxHarga) {
        
        // Create sort direction
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        // Handle special sort cases
        Sort sort;
        switch (sortBy.toLowerCase()) {
            case "terbaru":
                sort = Sort.by(Sort.Direction.DESC, "createdAt");
                break;
            case "terlama":
                sort = Sort.by(Sort.Direction.ASC, "createdAt");
                break;
            case "terpopuler":
                // Sort by reverse stock (lower stock indicates higher sales/popularity)
                sort = Sort.by(Sort.Direction.ASC, "stock");
                break;
            case "termahal":
                sort = Sort.by(Sort.Direction.DESC, "harga");
                break;
            case "termurah":
                sort = Sort.by(Sort.Direction.ASC, "harga");
                break;
            default:
                sort = Sort.by(direction, sortBy);
        }
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Build specification for filtering
        Specification<Barang> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (nama != null && !nama.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("nama")), 
                    "%" + nama.toLowerCase() + "%"
                ));
            }
            
            if (kategoriId != null) {
                predicates.add(criteriaBuilder.equal(root.get("kategori").get("id"), kategoriId));
            }
            
            if (minHarga != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("harga"), minHarga));
            }
            
            if (maxHarga != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("harga"), maxHarga));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        return barangRepository.findAll(spec, pageable);
    }
    
    public Optional<Barang> getBarangById(Long id) {
        return barangRepository.findById(id);
    }
    
    public Barang createBarang(Barang barang) {
        try {
            System.out.println("=== BARANG SERVICE - CREATE ===");
            System.out.println("Input barang: " + barang);
            System.out.println("Kategori: " + (barang.getKategori() != null ? barang.getKategori().getNama() : "null"));
            System.out.println("Gambar: " + barang.getGambar());
            
            // Set timestamps
            barang.setCreatedAt(LocalDateTime.now());
            barang.setUpdatedAt(LocalDateTime.now());
            
            // Save to database
            Barang savedBarang = barangRepository.save(barang);
            System.out.println("SUCCESS: Saved barang with ID: " + savedBarang.getId());
            System.out.println("SUCCESS: Saved image path: " + savedBarang.getGambar());
            
            return savedBarang;
        } catch (Exception e) {
            System.out.println("ERROR in BarangService.createBarang: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public Barang updateBarang(Long id, Barang barangDetails) {
        return barangRepository.findById(id)
                .map(barang -> {
                    System.out.println("=== BARANG SERVICE - UPDATE ===");
                    System.out.println("Updating barang ID: " + id);
                    System.out.println("New details: " + barangDetails);
                    System.out.println("New image: " + barangDetails.getGambar());
                    
                    barang.setNama(barangDetails.getNama());
                    barang.setBerat(barangDetails.getBerat());
                    barang.setStock(barangDetails.getStock());
                    barang.setHarga(barangDetails.getHarga());
                    barang.setPoin(barangDetails.getPoin());
                    barang.setGambar(barangDetails.getGambar());
                    
                    if (barangDetails.getKategori() != null && barangDetails.getKategori().getId() != null) {
                        Optional<Kategori> kategori = kategoriRepository.findById(barangDetails.getKategori().getId());
                        if (kategori.isEmpty()) {
                            throw new RuntimeException("Kategori not found with id: " + barangDetails.getKategori().getId());
                        }
                        barang.setKategori(kategori.get());
                    }
                    
                    barang.setUpdatedAt(LocalDateTime.now());
                    Barang savedBarang = barangRepository.save(barang);
                    
                    System.out.println("SUCCESS: Updated barang with image: " + savedBarang.getGambar());
                    return savedBarang;
                })
                .orElseThrow(() -> new RuntimeException("Barang not found with id: " + id));
    }
    
    public void deleteBarang(Long id) {
        if (!barangRepository.existsById(id)) {
            throw new RuntimeException("Barang not found with id: " + id);
        }
        barangRepository.deleteById(id);
    }
    
    public List<Barang> getBarangByKategori(Kategori kategori) {
        return barangRepository.findByKategori(kategori);
    }
    
    public List<Barang> getBarangByKategoriId(Long kategoriId) {
        return barangRepository.findByKategoriId(kategoriId);
    }
    
    public List<Barang> searchBarangByNama(String nama) {
        return barangRepository.findByNamaContainingIgnoreCase(nama);
    }
    
    public List<Barang> getBarangAvailable() {
        return barangRepository.findByStockGreaterThan(0);
    }
    
    public List<Barang> getBarangOutOfStock() {
        return barangRepository.findByStockLessThanEqual(0);
    }
    
    public Barang updateStock(Long id, Integer newStock) {
        return barangRepository.findById(id)
                .map(barang -> {
                    barang.setStock(newStock);
                    barang.setUpdatedAt(LocalDateTime.now());
                    return barangRepository.save(barang);
                })
                .orElseThrow(() -> new RuntimeException("Barang not found with id: " + id));
    }
    
    public Barang reduceStock(Long id, Integer quantity) {
        return barangRepository.findById(id)
                .map(barang -> {
                    if (barang.getStock() < quantity) {
                        throw new RuntimeException("Insufficient stock for barang: " + barang.getNama());
                    }
                    barang.setStock(barang.getStock() - quantity);
                    barang.setUpdatedAt(LocalDateTime.now());
                    return barangRepository.save(barang);
                })
                .orElseThrow(() -> new RuntimeException("Barang not found with id: " + id));
    }
    
    public long countTotalBarang() {
        return barangRepository.count();
    }
    
    public long countBarangAvailable() {
        return barangRepository.countByStockGreaterThan(0);
    }
    
    public Barang toggleStatus(Long id) {
        return barangRepository.findById(id)
                .map(barang -> {
                    barang.setIsActive(!barang.getIsActive());
                    barang.setUpdatedAt(LocalDateTime.now());
                    return barangRepository.save(barang);
                })
                .orElseThrow(() -> new RuntimeException("Barang not found with id: " + id));
    }
}