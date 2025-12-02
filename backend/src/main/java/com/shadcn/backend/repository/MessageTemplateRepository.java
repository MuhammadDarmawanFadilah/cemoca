package com.shadcn.backend.repository;

import com.shadcn.backend.model.MessageTemplate;
import com.shadcn.backend.model.MessageTemplate.TemplateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageTemplateRepository extends JpaRepository<MessageTemplate, Long> {
    
    List<MessageTemplate> findByType(TemplateType type);
    
    List<MessageTemplate> findByTypeOrderByLanguageNameAsc(TemplateType type);
    
    Optional<MessageTemplate> findByTypeAndLanguageCode(TemplateType type, String languageCode);
    
    Optional<MessageTemplate> findByTypeAndIsDefaultTrue(TemplateType type);
    
    List<MessageTemplate> findAllByOrderByTypeAscLanguageNameAsc();
    
    boolean existsByTypeAndLanguageCode(TemplateType type, String languageCode);
}
