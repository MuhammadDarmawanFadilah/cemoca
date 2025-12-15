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

    @NotBlank(message = "Agent Code wajib diisi")
    @Size(max = 50, message = "Agent Code maksimal 50 karakter")
    @JsonAlias({"agent_code", "agentCode"})
    private String agentCode;

    @NotNull(message = "Policy Date wajib diisi")
    @JsonAlias({"policy_date", "policyDate"})
    private LocalDate policyDate;

    @NotBlank(message = "Policy Code wajib diisi")
    @Size(max = 80, message = "Policy Code maksimal 80 karakter")
    @JsonAlias({"policy_code", "policyCode"})
    private String policyCode;

    @NotNull(message = "Policy APE wajib diisi")
    @JsonAlias({"policy_ape", "policyApe"})
    private BigDecimal policyApe;
}
