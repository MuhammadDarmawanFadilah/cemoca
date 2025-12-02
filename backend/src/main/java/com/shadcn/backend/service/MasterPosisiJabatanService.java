package com.shadcn.backend.service;

import com.shadcn.backend.dto.MasterPosisiJabatanRequest;
import com.shadcn.backend.dto.MasterPosisiJabatanResponse;
import com.shadcn.backend.model.MasterPosisiJabatan;
import com.shadcn.backend.repository.MasterPosisiJabatanRepository;
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
public class MasterPosisiJabatanService {
    
    private final MasterPosisiJabatanRepository repository;
    
    @Transactional(readOnly = true)
    public Page<MasterPosisiJabatanResponse> findAll(String search, Boolean isActive, int page, int size) {
        log.info("Finding all master posisi jabatan with search: {}, isActive: {}, page: {}, size: {}", 
                search, isActive, page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<MasterPosisiJabatan> entities = repository.findWithFilters(search, isActive, pageable);
        
        return entities.map(this::toResponse);
    }
    
    @Transactional(readOnly = true)
    public List<MasterPosisiJabatanResponse> findAllActive() {
        log.info("Finding all active master posisi jabatan");
        List<MasterPosisiJabatan> entities = repository.findByIsActiveTrueOrderBySortOrderAscNamaAsc();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public MasterPosisiJabatanResponse findById(Long id) {
        log.info("Finding master posisi jabatan by id: {}", id);
        MasterPosisiJabatan entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master posisi jabatan not found with id: " + id));
        return toResponse(entity);
    }
    
    @Transactional
    public MasterPosisiJabatanResponse create(MasterPosisiJabatanRequest request) {
        log.info("Creating master posisi jabatan: {}", request);
        
        // Check if name already exists
        if (repository.findByNamaIgnoreCase(request.getNama()).isPresent()) {
            throw new RuntimeException("Posisi jabatan dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        MasterPosisiJabatan entity = toEntity(request);
        MasterPosisiJabatan saved = repository.save(entity);
        
        log.info("Created master posisi jabatan with id: {}", saved.getId());
        return toResponse(saved);
    }
    
    @Transactional
    public MasterPosisiJabatanResponse update(Long id, MasterPosisiJabatanRequest request) {
        log.info("Updating master posisi jabatan with id: {} - {}", id, request);
        
        MasterPosisiJabatan existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master posisi jabatan not found with id: " + id));
        
        // Check if name already exists (excluding current record)
        if (repository.existsByNamaIgnoreCaseAndIdNot(request.getNama(), id)) {
            throw new RuntimeException("Posisi jabatan dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        existing.setNama(request.getNama());
        existing.setDeskripsi(request.getDeskripsi());
        existing.setIsActive(request.getIsActive());
        existing.setSortOrder(request.getSortOrder());
        
        MasterPosisiJabatan saved = repository.save(existing);
        
        log.info("Updated master posisi jabatan with id: {}", saved.getId());
        return toResponse(saved);
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("Deleting master posisi jabatan with id: {}", id);
        
        if (!repository.existsById(id)) {
            throw new RuntimeException("Master posisi jabatan not found with id: " + id);
        }
        
        repository.deleteById(id);
        log.info("Deleted master posisi jabatan with id: {}", id);
    }
    
    @Transactional
    public MasterPosisiJabatanResponse toggleActive(Long id) {
        log.info("Toggling active status for master posisi jabatan with id: {}", id);
        
        MasterPosisiJabatan entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master posisi jabatan not found with id: " + id));
        
        entity.setIsActive(!entity.getIsActive());
        MasterPosisiJabatan saved = repository.save(entity);
        
        log.info("Toggled active status for master posisi jabatan with id: {} to {}", id, saved.getIsActive());
        return toResponse(saved);
    }
    
    private MasterPosisiJabatanResponse toResponse(MasterPosisiJabatan entity) {
        return new MasterPosisiJabatanResponse(
                entity.getId(),
                entity.getNama(),
                entity.getDeskripsi(),
                entity.getIsActive(),
                entity.getSortOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
    
    private MasterPosisiJabatan toEntity(MasterPosisiJabatanRequest request) {
        MasterPosisiJabatan entity = new MasterPosisiJabatan();
        entity.setNama(request.getNama());
        entity.setDeskripsi(request.getDeskripsi());
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        return entity;
    }
}
