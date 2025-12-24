package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MasterPolicySalesRequest {

    @NotBlank(message = "Agent Code is required")
    @Size(max = 50, message = "Agent Code must be at most 50 characters")
    @JsonAlias({"agent_code", "agentCode"})
    private String agentCode;

    @NotNull(message = "Policy FYP is required")
    @JsonAlias({"policy_fyp", "policyFyp"})
    private BigDecimal policyFyp;

    @NotNull(message = "Policy Date is required")
    @JsonAlias({"policy_date", "policyDate"})
    private LocalDate policyDate;

    @NotNull(message = "Policy APE is required")
    @JsonAlias({"policy_ape", "policyApe"})
    private BigDecimal policyApe;
}
