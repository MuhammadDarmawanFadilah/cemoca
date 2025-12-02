package com.shadcn.backend.service;

import com.shadcn.backend.dto.MasterPosisiRequest;
import com.shadcn.backend.dto.MasterPosisiResponse;
import com.shadcn.backend.model.MasterPosisi;
import com.shadcn.backend.repository.MasterPosisiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasterPosisiService {
    
    private final MasterPosisiRepository repository;
    
    @Transactional(readOnly = true)
    public Page<MasterPosisiResponse> findAll(String search, String kategori, Boolean isActive, int page, int size) {
        log.info("Finding all master posisi with search: {}, kategori: {}, isActive: {}, page: {}, size: {}", 
                search, kategori, isActive, page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<MasterPosisi> entities = repository.findWithFilters(search, kategori, isActive, pageable);
        
        return entities.map(this::toResponse);
    }
    
    @Transactional(readOnly = true)
    public List<MasterPosisiResponse> findAllActive() {
        log.info("Finding all active master posisi");
        List<MasterPosisi> entities = repository.findByIsActiveTrueOrderBySortOrderAscNamaAsc();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<MasterPosisiResponse> findByCategory(String kategori) {
        log.info("Finding master posisi by category: {}", kategori);
        List<MasterPosisi> entities = repository.findByKategoriAndIsActiveTrueOrderBySortOrderAscNamaAsc(kategori);
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<String> findAllCategories() {
        log.info("Finding all master posisi categories");
        return repository.findDistinctKategori();
    }
    
    @Transactional(readOnly = true)
    public MasterPosisiResponse findById(Long id) {
        log.info("Finding master posisi by id: {}", id);
        MasterPosisi entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master Posisi not found with id: " + id));
        return toResponse(entity);
    }
    
    @Transactional
    public MasterPosisiResponse create(MasterPosisiRequest request) {
        log.info("Creating new master posisi: {}", request.getNama());
        
        // Check if name already exists
        if (repository.findByNamaIgnoreCase(request.getNama()).isPresent()) {
            throw new RuntimeException("Posisi dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        MasterPosisi entity = new MasterPosisi();
        entity.setNama(request.getNama());
        entity.setKategori(request.getKategori());
        entity.setDeskripsi(request.getDeskripsi());
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        
        entity = repository.save(entity);
        log.info("Successfully created master posisi with id: {}", entity.getId());
        
        return toResponse(entity);
    }
    
    @Transactional
    public MasterPosisiResponse update(Long id, MasterPosisiRequest request) {
        log.info("Updating master posisi with id: {}", id);
        
        MasterPosisi entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master Posisi not found with id: " + id));
        
        // Check if name already exists (excluding current entity)
        if (repository.existsByNamaIgnoreCaseAndIdNot(request.getNama(), id)) {
            throw new RuntimeException("Posisi dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        entity.setNama(request.getNama());
        entity.setKategori(request.getKategori());
        entity.setDeskripsi(request.getDeskripsi());
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        
        entity = repository.save(entity);
        log.info("Successfully updated master posisi with id: {}", id);
        
        return toResponse(entity);
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("Deleting master posisi with id: {}", id);
        
        if (!repository.existsById(id)) {
            throw new RuntimeException("Master Posisi not found with id: " + id);
        }
        
        repository.deleteById(id);
        log.info("Successfully deleted master posisi with id: {}", id);
    }
    
    @Transactional
    public MasterPosisiResponse toggleActive(Long id) {
        log.info("Toggling active status for master posisi with id: {}", id);
        
        MasterPosisi entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master Posisi not found with id: " + id));
        
        entity.setIsActive(!entity.getIsActive());
        entity = repository.save(entity);
        
        log.info("Successfully toggled active status for master posisi with id: {} to {}", id, entity.getIsActive());
        return toResponse(entity);
    }
    
    private MasterPosisiResponse toResponse(MasterPosisi entity) {
        return new MasterPosisiResponse(
                entity.getId(),
                entity.getNama(),
                entity.getKategori(),
                entity.getDeskripsi(),
                entity.getIsActive(),
                entity.getSortOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
