package com.shadcn.backend.service;

import com.shadcn.backend.dto.CertificateTemplateRequest;
import com.shadcn.backend.dto.CertificateTemplateResponse;
import com.shadcn.backend.model.CertificateTemplate;
import com.shadcn.backend.repository.CertificateTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateTemplateService {
    
    private final CertificateTemplateRepository repository;
    
    public String generateTemplateCode(String prefix) {
        String code;
        int attempts = 0;
        do {
            String randomPart = String.format("%06d", new Random().nextInt(1000000));
            code = prefix + "-" + randomPart;
            attempts++;
            if (attempts > 10) {
                code = prefix + "-" + System.currentTimeMillis();
                break;
            }
        } while (repository.existsByTemplateCode(code));
        return code;
    }
    
    @Transactional(readOnly = true)
    public Page<CertificateTemplateResponse> findAll(String search, Boolean isActive, int page, int size) {
        log.info("Finding all certificate templates with search: {}, isActive: {}, page: {}, size: {}", 
                search, isActive, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CertificateTemplate> entities = repository.findWithFilters(search, isActive, pageable);
        
        return entities.map(this::toResponse);
    }
    
    @Transactional(readOnly = true)
    public List<CertificateTemplateResponse> findAllActive() {
        log.info("Finding all active certificate templates");
        List<CertificateTemplate> entities = repository.findByIsActiveTrueOrderByTemplateNameAsc();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public CertificateTemplateResponse findById(Long id) {
        log.info("Finding certificate template by id: {}", id);
        CertificateTemplate entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate Template not found with id: " + id));
        return toResponse(entity);
    }
    
    @Transactional(readOnly = true)
    public CertificateTemplateResponse findByTemplateCode(String templateCode) {
        log.info("Finding certificate template by code: {}", templateCode);
        CertificateTemplate entity = repository.findByTemplateCode(templateCode)
                .orElseThrow(() -> new RuntimeException("Certificate Template not found with code: " + templateCode));
        return toResponse(entity);
    }
    
    @Transactional
    public CertificateTemplateResponse create(CertificateTemplateRequest request) {
        log.info("Creating new certificate template: {}", request.getTemplateName());
        
        if (repository.existsByTemplateCode(request.getTemplateCode())) {
            throw new RuntimeException("Template dengan kode '" + request.getTemplateCode() + "' sudah ada");
        }
        
        CertificateTemplate entity = new CertificateTemplate();
        mapRequestToEntity(request, entity);
        
        entity = repository.save(entity);
        log.info("Successfully created certificate template with id: {}", entity.getId());
        
        return toResponse(entity);
    }
    
    @Transactional
    public CertificateTemplateResponse update(Long id, CertificateTemplateRequest request) {
        log.info("Updating certificate template with id: {}", id);
        
        CertificateTemplate entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate Template not found with id: " + id));
        
        if (repository.existsByTemplateCodeAndIdNot(request.getTemplateCode(), id)) {
            throw new RuntimeException("Template dengan kode '" + request.getTemplateCode() + "' sudah ada");
        }
        
        mapRequestToEntity(request, entity);
        
        entity = repository.save(entity);
        log.info("Successfully updated certificate template with id: {}", id);
        
        return toResponse(entity);
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("Deleting certificate template with id: {}", id);
        
        if (!repository.existsById(id)) {
            throw new RuntimeException("Certificate Template not found with id: " + id);
        }
        
        repository.deleteById(id);
        log.info("Successfully deleted certificate template with id: {}", id);
    }
    
    @Transactional
    public CertificateTemplateResponse toggleActive(Long id) {
        log.info("Toggling active status for certificate template with id: {}", id);
        
        CertificateTemplate entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate Template not found with id: " + id));
        
        entity.setIsActive(!entity.getIsActive());
        entity = repository.save(entity);
        
        log.info("Successfully toggled active status for certificate template with id: {} to {}", id, entity.getIsActive());
        return toResponse(entity);
    }
    
    private void mapRequestToEntity(CertificateTemplateRequest request, CertificateTemplate entity) {
        entity.setTemplateCode(request.getTemplateCode());
        entity.setTemplateName(request.getTemplateName());
        entity.setDescription(request.getDescription());
        entity.setImageUrl(request.getImageUrl());
        entity.setVariableCount(request.getVariableCount());
        
        entity.setVariable1Name(request.getVariable1Name());
        entity.setVariable1X(request.getVariable1X());
        entity.setVariable1Y(request.getVariable1Y());
        entity.setVariable1FontSize(request.getVariable1FontSize() != null ? request.getVariable1FontSize() : 24);
        entity.setVariable1Color(request.getVariable1Color() != null ? request.getVariable1Color() : "#000000");
        
        entity.setVariable2Name(request.getVariable2Name());
        entity.setVariable2X(request.getVariable2X());
        entity.setVariable2Y(request.getVariable2Y());
        entity.setVariable2FontSize(request.getVariable2FontSize() != null ? request.getVariable2FontSize() : 24);
        entity.setVariable2Color(request.getVariable2Color() != null ? request.getVariable2Color() : "#000000");
        
        entity.setVariable3Name(request.getVariable3Name());
        entity.setVariable3X(request.getVariable3X());
        entity.setVariable3Y(request.getVariable3Y());
        entity.setVariable3FontSize(request.getVariable3FontSize() != null ? request.getVariable3FontSize() : 24);
        entity.setVariable3Color(request.getVariable3Color() != null ? request.getVariable3Color() : "#000000");
        
        entity.setVariable4Name(request.getVariable4Name());
        entity.setVariable4X(request.getVariable4X());
        entity.setVariable4Y(request.getVariable4Y());
        entity.setVariable4FontSize(request.getVariable4FontSize() != null ? request.getVariable4FontSize() : 24);
        entity.setVariable4Color(request.getVariable4Color() != null ? request.getVariable4Color() : "#000000");
        
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
    }
    
    private CertificateTemplateResponse toResponse(CertificateTemplate entity) {
        CertificateTemplateResponse response = new CertificateTemplateResponse();
        response.setId(entity.getId());
        response.setTemplateCode(entity.getTemplateCode());
        response.setTemplateName(entity.getTemplateName());
        response.setDescription(entity.getDescription());
        response.setImageUrl(entity.getImageUrl());
        response.setVariableCount(entity.getVariableCount());
        
        response.setVariable1Name(entity.getVariable1Name());
        response.setVariable1X(entity.getVariable1X());
        response.setVariable1Y(entity.getVariable1Y());
        response.setVariable1FontSize(entity.getVariable1FontSize());
        response.setVariable1Color(entity.getVariable1Color());
        
        response.setVariable2Name(entity.getVariable2Name());
        response.setVariable2X(entity.getVariable2X());
        response.setVariable2Y(entity.getVariable2Y());
        response.setVariable2FontSize(entity.getVariable2FontSize());
        response.setVariable2Color(entity.getVariable2Color());
        
        response.setVariable3Name(entity.getVariable3Name());
        response.setVariable3X(entity.getVariable3X());
        response.setVariable3Y(entity.getVariable3Y());
        response.setVariable3FontSize(entity.getVariable3FontSize());
        response.setVariable3Color(entity.getVariable3Color());
        
        response.setVariable4Name(entity.getVariable4Name());
        response.setVariable4X(entity.getVariable4X());
        response.setVariable4Y(entity.getVariable4Y());
        response.setVariable4FontSize(entity.getVariable4FontSize());
        response.setVariable4Color(entity.getVariable4Color());
        
        response.setIsActive(entity.getIsActive());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        
        return response;
    }
}
