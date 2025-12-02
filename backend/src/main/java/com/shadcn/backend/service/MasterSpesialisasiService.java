package com.shadcn.backend.service;

import com.shadcn.backend.dto.MasterSpesialisasiRequest;
import com.shadcn.backend.dto.MasterSpesialisasiResponse;
import com.shadcn.backend.model.MasterSpesialisasi;
import com.shadcn.backend.repository.MasterSpesialisasiRepository;
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
public class MasterSpesialisasiService {
    
    private final MasterSpesialisasiRepository repository;
    
    @Transactional(readOnly = true)
    public Page<MasterSpesialisasiResponse> findAll(String search, Boolean isActive, int page, int size) {
        log.info("Finding all master spesialisasi with search: {}, isActive: {}, page: {}, size: {}", 
                search, isActive, page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<MasterSpesialisasi> entities = repository.findWithFilters(search, isActive, pageable);
        
        return entities.map(this::toResponse);
    }
    
    @Transactional(readOnly = true)
    public List<MasterSpesialisasiResponse> findAllActive() {
        log.info("Finding all active master spesialisasi");
        List<MasterSpesialisasi> entities = repository.findByIsActiveTrueOrderBySortOrderAscNamaAsc();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public MasterSpesialisasiResponse findById(Long id) {
        log.info("Finding master spesialisasi by id: {}", id);
        MasterSpesialisasi entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master Spesialisasi not found with id: " + id));
        return toResponse(entity);
    }
    
    @Transactional
    public MasterSpesialisasiResponse create(MasterSpesialisasiRequest request) {
        log.info("Creating new master spesialisasi: {}", request.getNama());
        
        // Check if name already exists
        if (repository.findByNamaIgnoreCase(request.getNama()).isPresent()) {
            throw new RuntimeException("Spesialisasi dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        MasterSpesialisasi entity = new MasterSpesialisasi();
        entity.setNama(request.getNama());
        entity.setDeskripsi(request.getDeskripsi());
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        
        entity = repository.save(entity);
        log.info("Successfully created master spesialisasi with id: {}", entity.getId());
        
        return toResponse(entity);
    }
    
    @Transactional
    public MasterSpesialisasiResponse update(Long id, MasterSpesialisasiRequest request) {
        log.info("Updating master spesialisasi with id: {}", id);
        
        MasterSpesialisasi entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master Spesialisasi not found with id: " + id));
        
        // Check if name already exists (excluding current entity)
        if (repository.existsByNamaIgnoreCaseAndIdNot(request.getNama(), id)) {
            throw new RuntimeException("Spesialisasi dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        entity.setNama(request.getNama());
        entity.setDeskripsi(request.getDeskripsi());
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        
        entity = repository.save(entity);
        log.info("Successfully updated master spesialisasi with id: {}", id);
        
        return toResponse(entity);
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("Deleting master spesialisasi with id: {}", id);
        
        if (!repository.existsById(id)) {
            throw new RuntimeException("Master Spesialisasi not found with id: " + id);
        }
        
        repository.deleteById(id);
        log.info("Successfully deleted master spesialisasi with id: {}", id);
    }
    
    @Transactional
    public MasterSpesialisasiResponse toggleActive(Long id) {
        log.info("Toggling active status for master spesialisasi with id: {}", id);
        
        MasterSpesialisasi entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master Spesialisasi not found with id: " + id));
        
        entity.setIsActive(!entity.getIsActive());
        entity = repository.save(entity);
        
        log.info("Successfully toggled active status for master spesialisasi with id: {} to {}", id, entity.getIsActive());
        return toResponse(entity);
    }
    
    private MasterSpesialisasiResponse toResponse(MasterSpesialisasi entity) {
        return new MasterSpesialisasiResponse(
                entity.getId(),
                entity.getNama(),
                entity.getDeskripsi(),
                entity.getIsActive(),
                entity.getSortOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
