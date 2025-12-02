package com.shadcn.backend.service;

import com.shadcn.backend.dto.MasterAgamaRequest;
import com.shadcn.backend.dto.MasterAgamaResponse;
import com.shadcn.backend.exception.DuplicateResourceException;
import com.shadcn.backend.exception.ResourceNotFoundException;
import com.shadcn.backend.exception.ValidationException;
import com.shadcn.backend.model.MasterAgama;
import com.shadcn.backend.repository.MasterAgamaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasterAgamaService {
    
    private final MasterAgamaRepository repository;
      @Transactional(readOnly = true)
    public Page<MasterAgamaResponse> findAll(String search, Boolean isActive, int page, int size, String sortBy, String sortDir) {
        log.info("Finding all master agama with search: {}, isActive: {}, page: {}, size: {}, sortBy: {}, sortDir: {}", 
                search, isActive, page, size, sortBy, sortDir);
        
        // Create sort direction
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<MasterAgama> entities = repository.findWithFilters(search, isActive, pageable);
        
        return entities.map(this::toResponse);
    }

    // Overloaded method for backward compatibility
    @Transactional(readOnly = true)
    public Page<MasterAgamaResponse> findAll(String search, Boolean isActive, int page, int size) {
        return findAll(search, isActive, page, size, "sortOrder", "asc");
    }
    
    @Transactional(readOnly = true)
    public List<MasterAgamaResponse> findAllActive() {
        log.info("Finding all active master agama");
        List<MasterAgama> entities = repository.findByIsActiveTrueOrderBySortOrderAscNamaAsc();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
      @Transactional(readOnly = true)
    public MasterAgamaResponse findById(Long id) {
        log.info("Finding master agama by id: {}", id);
        MasterAgama entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data agama dengan ID " + id + " tidak ditemukan"));
        return toResponse(entity);
    }
      @Transactional
    public MasterAgamaResponse create(MasterAgamaRequest request) {
        log.info("Creating master agama: {}", request);
        
        // Validate input
        if (request.getNama() == null || request.getNama().trim().isEmpty()) {
            throw new ValidationException("Nama agama tidak boleh kosong");
        }
        
        // Check if name already exists
        if (repository.findByNamaIgnoreCase(request.getNama().trim()).isPresent()) {
            throw new DuplicateResourceException("Agama dengan nama '" + request.getNama().trim() + "' sudah terdaftar dalam sistem");
        }
        
        MasterAgama entity = toEntity(request);
        MasterAgama saved = repository.save(entity);
        
        log.info("Created master agama with id: {}", saved.getId());
        return toResponse(saved);
    }
      @Transactional
    public MasterAgamaResponse update(Long id, MasterAgamaRequest request) {
        log.info("Updating master agama with id: {} - {}", id, request);
        
        MasterAgama existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data agama dengan ID " + id + " tidak ditemukan"));
        
        // Validate input
        if (request.getNama() == null || request.getNama().trim().isEmpty()) {
            throw new ValidationException("Nama agama tidak boleh kosong");
        }
        
        // Check if name already exists (excluding current record)
        if (repository.existsByNamaIgnoreCaseAndIdNot(request.getNama().trim(), id)) {
            throw new DuplicateResourceException("Agama dengan nama '" + request.getNama().trim() + "' sudah terdaftar dalam sistem");
        }
          existing.setNama(request.getNama());
        existing.setDeskripsi(request.getDeskripsi());
        existing.setIsActive(request.getIsActive());
        existing.setSortOrder(request.getSortOrder());
        
        MasterAgama saved = repository.save(existing);
        
        log.info("Updated master agama with id: {}", saved.getId());
        return toResponse(saved);
    }
      @Transactional
    public void delete(Long id) {
        log.info("Deleting master agama with id: {}", id);
        
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Data agama dengan ID " + id + " tidak ditemukan");
        }
        
        repository.deleteById(id);
        log.info("Deleted master agama with id: {}", id);
    }

    @Transactional
    public MasterAgamaResponse toggleActive(Long id) {
        log.info("Toggling active status for master agama with id: {}", id);
        
        MasterAgama entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data agama dengan ID " + id + " tidak ditemukan"));
        
        entity.setIsActive(!entity.getIsActive());
        MasterAgama saved = repository.save(entity);
        
        log.info("Toggled active status for master agama with id: {} to {}", id, saved.getIsActive());
        return toResponse(saved);
    }
    
    /**
     * Reset dan reinisialisasi data agama (untuk development only)
     */
    @Transactional
    public void resetAndInitializeData() {
        log.warn("⚠️ DEVELOPMENT ONLY: Reset dan reinisialisasi data agama");
        repository.deleteAll();
        
        // Re-initialize dengan data default agama Indonesia
        initializeDefaultAgamaData();
        
        log.info("✅ Reset dan reinisialisasi data agama selesai");
    }
    
    /**
     * Inisialisasi data agama default Indonesia jika belum ada
     */
    @Transactional
    public void initializeDefaultAgamaData() {
        long existingCount = repository.count();
        if (existingCount > 0) {
            log.info("Data agama sudah ada ({} records), skip inisialisasi", existingCount);
            return;
        }
        
        log.info("Menginisialisasi data agama default Indonesia...");
          // Data agama resmi di Indonesia berdasarkan UU No. 1/PNPS/1965
        String[][] agamaData = {
            {"Islam", "Agama Islam adalah agama monoteis yang diajarkan oleh Nabi Muhammad SAW. Merupakan agama mayoritas di Indonesia dengan lebih dari 87% penduduk beragama Islam."},
            {"Kristen Protestan", "Agama Kristen Protestan adalah denominasi Kristen yang berkembang dari reformasi gereja pada abad ke-16. Merupakan agama minoritas terbesar kedua di Indonesia."},
            {"Kristen Katolik", "Agama Kristen Katolik adalah denominasi Kristen tertua yang dipimpin oleh Paus di Vatikan. Memiliki sejarah panjang di Indonesia sejak masa kolonial."},
            {"Hindu", "Agama Hindu adalah agama tertua di dunia yang berkembang di India. Di Indonesia terutama dianut di Bali dan sebagian Jawa serta Sumatra."},
            {"Buddha", "Agama Buddha didirikan oleh Siddhartha Gautama (Buddha) di India pada abad ke-6 SM. Memiliki sejarah panjang di Indonesia dengan berbagai aliran."},
            {"Konghucu", "Agama Konghucu didasarkan pada ajaran Kong Hu Cu (Konfusius). Diakui sebagai agama resmi di Indonesia pada tahun 2000 setelah era reformasi."}
        };
        
        for (int i = 0; i < agamaData.length; i++) {
            MasterAgama agama = new MasterAgama();
            agama.setNama(agamaData[i][0]);
            agama.setDeskripsi(agamaData[i][1]);
            agama.setIsActive(true);
            agama.setSortOrder(i + 1);
            
            repository.save(agama);
            log.debug("✓ Inserted agama: {}", agamaData[i][0]);
        }
        
        log.info("✅ Berhasil menginisialisasi {} agama resmi Indonesia", agamaData.length);
    }

    private MasterAgamaResponse toResponse(MasterAgama entity) {
        return new MasterAgamaResponse(
                entity.getId(),
                entity.getNama(),
                entity.getDeskripsi(),
                entity.getIsActive(),
                entity.getSortOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
    
    private MasterAgama toEntity(MasterAgamaRequest request) {
        MasterAgama entity = new MasterAgama();
        entity.setNama(request.getNama());
        entity.setDeskripsi(request.getDeskripsi());
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        return entity;
    }
}
