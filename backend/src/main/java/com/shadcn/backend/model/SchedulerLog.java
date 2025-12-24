package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "file_manager_scheduler_logs")
@Data
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class SchedulerLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "company_code", length = 50)
    private String companyCode;
    
    @Column(name = "import_type", length = 50)
    private String importType; // AgencyList or PolicyList
    
    @Column(name = "file_name", length = 255)
    private String fileName;
    
    @Column(name = "file_path", length = 1000)
    private String filePath;
    
    @Column(name = "status", length = 20)
    private String status; // SUCCESS, FAILED
    
    @Column(name = "created_count")
    private Integer createdCount;
    
    @Column(name = "updated_count")
    private Integer updatedCount;
    
    @Column(name = "error_count")
    private Integer errorCount;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "processed_by", length = 100)
    private String processedBy; // SCHEDULER or MANUAL
    
    @CreationTimestamp
    @Column(name = "processed_at", updatable = false)
    private LocalDateTime processedAt;
}
