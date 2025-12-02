package com.shadcn.backend.service;

import com.shadcn.backend.dto.MasterHobiRequest;
import com.shadcn.backend.dto.MasterHobiResponse;
import com.shadcn.backend.model.MasterHobi;
import com.shadcn.backend.repository.MasterHobiRepository;
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
public class MasterHobiService {
    
    private final MasterHobiRepository repository;
    
    @Transactional(readOnly = true)
    public Page<MasterHobiResponse> findAll(String search, String kategori, Boolean isActive, int page, int size) {
        log.info("Finding all master hobi with search: {}, kategori: {}, isActive: {}, page: {}, size: {}", 
                search, kategori, isActive, page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<MasterHobi> entities = repository.findWithFilters(search, kategori, isActive, pageable);
        
        return entities.map(this::toResponse);
    }
    
    @Transactional(readOnly = true)
    public List<MasterHobiResponse> findAllActive() {
        log.info("Finding all active master hobi");
        List<MasterHobi> entities = repository.findByIsActiveTrueOrderBySortOrderAscNamaAsc();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<MasterHobiResponse> findByCategory(String kategori) {
        log.info("Finding master hobi by category: {}", kategori);
        List<MasterHobi> entities = repository.findByKategoriAndIsActiveTrueOrderBySortOrderAscNamaAsc(kategori);
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<String> findAllCategories() {
        log.info("Finding all master hobi categories");
        return repository.findDistinctKategori();
    }
    
    @Transactional(readOnly = true)
    public MasterHobiResponse findById(Long id) {
        log.info("Finding master hobi by id: {}", id);
        MasterHobi entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master Hobi not found with id: " + id));
        return toResponse(entity);
    }
    
    @Transactional
    public MasterHobiResponse create(MasterHobiRequest request) {
        log.info("Creating new master hobi: {}", request.getNama());
        
        // Check if name already exists
        if (repository.findByNamaIgnoreCase(request.getNama()).isPresent()) {
            throw new RuntimeException("Hobi dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        MasterHobi entity = new MasterHobi();
        entity.setNama(request.getNama());
        entity.setKategori(request.getKategori());
        entity.setDeskripsi(request.getDeskripsi());
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        
        entity = repository.save(entity);
        log.info("Successfully created master hobi with id: {}", entity.getId());
        
        return toResponse(entity);
    }
    
    @Transactional
    public MasterHobiResponse update(Long id, MasterHobiRequest request) {
        log.info("Updating master hobi with id: {}", id);
        
        MasterHobi entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master Hobi not found with id: " + id));
        
        // Check if name already exists (excluding current entity)
        if (repository.existsByNamaIgnoreCaseAndIdNot(request.getNama(), id)) {
            throw new RuntimeException("Hobi dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        entity.setNama(request.getNama());
        entity.setKategori(request.getKategori());
        entity.setDeskripsi(request.getDeskripsi());
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        
        entity = repository.save(entity);
        log.info("Successfully updated master hobi with id: {}", id);
        
        return toResponse(entity);
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("Deleting master hobi with id: {}", id);
        
        if (!repository.existsById(id)) {
            throw new RuntimeException("Master Hobi not found with id: " + id);
        }
        
        repository.deleteById(id);
        log.info("Successfully deleted master hobi with id: {}", id);
    }
    
    @Transactional
    public MasterHobiResponse toggleActive(Long id) {
        log.info("Toggling active status for master hobi with id: {}", id);
        
        MasterHobi entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Master Hobi not found with id: " + id));
        
        entity.setIsActive(!entity.getIsActive());
        entity = repository.save(entity);
        
        log.info("Successfully toggled active status for master hobi with id: {} to {}", id, entity.getIsActive());
        return toResponse(entity);
    }
    
    private MasterHobiResponse toResponse(MasterHobi entity) {
        return new MasterHobiResponse(
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
