package com.shadcn.backend.service;

import com.shadcn.backend.dto.MasterSpesialisasiKedokteranRequest;
import com.shadcn.backend.dto.MasterSpesialisasiKedokteranResponse;
import com.shadcn.backend.model.MasterSpesialisasiKedokteran;
import com.shadcn.backend.repository.MasterSpesialisasiKedokteranRepository;
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
public class MasterSpesialisasiKedokteranService {
    
    private final MasterSpesialisasiKedokteranRepository repository;
    
    @Transactional(readOnly = true)
    public Page<MasterSpesialisasiKedokteranResponse> findAll(String search, Boolean isActive, int page, int size) {
        log.info("Finding all master spesialisasi kedokteran with search: {}, isActive: {}, page: {}, size: {}", 
                search, isActive, page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<MasterSpesialisasiKedokteran> entities = repository.findWithFilters(search, isActive, pageable);
        
        return entities.map(this::toResponse);
    }
    
    @Transactional(readOnly = true)
    public List<MasterSpesialisasiKedokteranResponse> findAllActive() {
        log.info("Finding all active master spesialisasi kedokteran");
        List<MasterSpesialisasiKedokteran> entities = repository.findByIsActiveTrueOrderBySortOrderAscNamaAsc();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public MasterSpesialisasiKedokteranResponse findById(Long id) {
        log.info("Finding master spesialisasi kedokteran by id: {}", id);
        MasterSpesialisasiKedokteran entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master spesialisasi kedokteran not found with id: " + id));
        return toResponse(entity);
    }
    
    @Transactional
    public MasterSpesialisasiKedokteranResponse create(MasterSpesialisasiKedokteranRequest request) {
        log.info("Creating master spesialisasi kedokteran: {}", request);
        
        // Check if name already exists
        if (repository.findByNamaIgnoreCase(request.getNama()).isPresent()) {
            throw new RuntimeException("Spesialisasi kedokteran dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        MasterSpesialisasiKedokteran entity = toEntity(request);
        MasterSpesialisasiKedokteran saved = repository.save(entity);
        
        log.info("Created master spesialisasi kedokteran with id: {}", saved.getId());
        return toResponse(saved);
    }
    
    @Transactional
    public MasterSpesialisasiKedokteranResponse update(Long id, MasterSpesialisasiKedokteranRequest request) {
        log.info("Updating master spesialisasi kedokteran with id: {} - {}", id, request);
        
        MasterSpesialisasiKedokteran existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master spesialisasi kedokteran not found with id: " + id));
        
        // Check if name already exists (excluding current record)
        if (repository.existsByNamaIgnoreCaseAndIdNot(request.getNama(), id)) {
            throw new RuntimeException("Spesialisasi kedokteran dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        existing.setNama(request.getNama());
        existing.setDeskripsi(request.getDeskripsi());
        existing.setIsActive(request.getIsActive());
        existing.setSortOrder(request.getSortOrder());
        
        MasterSpesialisasiKedokteran saved = repository.save(existing);
        
        log.info("Updated master spesialisasi kedokteran with id: {}", saved.getId());
        return toResponse(saved);
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("Deleting master spesialisasi kedokteran with id: {}", id);
        
        if (!repository.existsById(id)) {
            throw new RuntimeException("Master spesialisasi kedokteran not found with id: " + id);
        }
        
        repository.deleteById(id);
        log.info("Deleted master spesialisasi kedokteran with id: {}", id);
    }
    
    @Transactional
    public MasterSpesialisasiKedokteranResponse toggleActive(Long id) {
        log.info("Toggling active status for master spesialisasi kedokteran with id: {}", id);
        
        MasterSpesialisasiKedokteran entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master spesialisasi kedokteran not found with id: " + id));
        
        entity.setIsActive(!entity.getIsActive());
        MasterSpesialisasiKedokteran saved = repository.save(entity);
        
        log.info("Toggled active status for master spesialisasi kedokteran with id: {} to {}", id, saved.getIsActive());
        return toResponse(saved);
    }
    
    private MasterSpesialisasiKedokteranResponse toResponse(MasterSpesialisasiKedokteran entity) {
        return new MasterSpesialisasiKedokteranResponse(
                entity.getId(),
                entity.getNama(),
                entity.getDeskripsi(),
                entity.getIsActive(),
                entity.getSortOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
    
    private MasterSpesialisasiKedokteran toEntity(MasterSpesialisasiKedokteranRequest request) {
        MasterSpesialisasiKedokteran entity = new MasterSpesialisasiKedokteran();
        entity.setNama(request.getNama());
        entity.setDeskripsi(request.getDeskripsi());
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        return entity;
    }
}
