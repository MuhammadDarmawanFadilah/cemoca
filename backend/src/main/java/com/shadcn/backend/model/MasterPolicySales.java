package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "master_policy_sales",
        indexes = {
                @Index(name = "idx_master_policy_sales_company_code", columnList = "company_code"),
                @Index(name = "idx_master_policy_sales_agent_code", columnList = "agent_code"),
            @Index(name = "idx_master_policy_sales_policy_date", columnList = "policy_date"),
                @Index(name = "idx_master_policy_sales_policy_fyp", columnList = "policy_fyp"),
                @Index(name = "idx_master_policy_sales_created_by", columnList = "created_by"),
                @Index(name = "idx_master_policy_sales_created_at", columnList = "created_at")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MasterPolicySales {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 50, message = "Company Code maksimal 50 karakter")
    @Column(name = "company_code", length = 50)
    private String companyCode;

    @NotBlank(message = "Agent Code tidak boleh kosong")
    @Size(max = 50, message = "Agent Code maksimal 50 karakter")
    @Column(name = "agent_code", nullable = false, length = 50)
    private String agentCode;

    @NotNull(message = "Policy Date tidak boleh kosong")
    @Column(name = "policy_date", nullable = false)
    private LocalDate policyDate;

    @NotNull(message = "Policy FYP tidak boleh kosong")
    @Column(name = "policy_fyp", nullable = false, precision = 19, scale = 2)
    private BigDecimal policyFyp;

    @NotNull(message = "Policy APE tidak boleh kosong")
    @Column(name = "policy_ape", nullable = false, precision = 19, scale = 2)
    private BigDecimal policyApe;

    @Size(max = 120, message = "Created By maksimal 120 karakter")
    @Column(name = "created_by", length = 120)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
