package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "master_agency_agent",
    uniqueConstraints = {
    @UniqueConstraint(name = "uk_master_agency_agent_company_agent_code", columnNames = {"company_code", "agent_code"})
    },
        indexes = {
        @Index(name = "idx_master_agency_agent_company_code", columnList = "company_code"),
    @Index(name = "idx_master_agency_agent_agent_code", columnList = "agent_code"),
                @Index(name = "idx_master_agency_agent_full_name", columnList = "full_name"),
                @Index(name = "idx_master_agency_agent_rank_code", columnList = "rank_code"),
        @Index(name = "idx_master_agency_agent_phone_no", columnList = "phone_no"),
            @Index(name = "idx_master_agency_agent_created_by", columnList = "created_by"),
                @Index(name = "idx_master_agency_agent_active", columnList = "is_active"),
                @Index(name = "idx_master_agency_agent_created_at", columnList = "created_at")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MasterAgencyAgent {

    public enum Gender {
        MALE,
        FEMALE
    }

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

    @NotBlank(message = "Full Name tidak boleh kosong")
    @Size(max = 150, message = "Full Name maksimal 150 karakter")
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Size(max = 80, message = "Short Name maksimal 80 karakter")
    @Column(name = "short_name", length = 80)
    private String shortName;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10)
    private Gender gender;

    @Size(max = 50, message = "Gender Title maksimal 50 karakter")
    @Column(name = "gender_title", length = 50)
    private String genderTitle;

    @NotBlank(message = "Phone no tidak boleh kosong")
    @Size(max = 25, message = "Phone no maksimal 25 karakter")
    @Column(name = "phone_no", nullable = false, length = 25)
    private String phoneNo;

    @NotBlank(message = "Rank Code tidak boleh kosong")
    @Size(max = 30, message = "Rank Code maksimal 30 karakter")
    @Column(name = "rank_code", nullable = false, length = 30)
    private String rankCode;

    @Size(max = 120, message = "Rank Full Title maksimal 120 karakter")
    @Column(name = "rank_title", length = 120)
    private String rankTitle;

    @Column(name = "appointment_date")
    private LocalDate appointmentDate;

    @Column(name = "is_active", nullable = false, columnDefinition = "BIT(1) DEFAULT 1")
    private Boolean isActive = true;

    @Size(max = 120, message = "Created By maksimal 120 karakter")
    @Column(name = "created_by", length = 120)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (isActive == null) {
            isActive = true;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
