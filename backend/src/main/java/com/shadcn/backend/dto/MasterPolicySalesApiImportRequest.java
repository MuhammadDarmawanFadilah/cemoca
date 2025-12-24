package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class MasterPolicySalesApiImportRequest {

    @NotBlank(message = "Company Code is required")
    @JsonAlias({"company_code", "companyCode"})
    private String companyCode;

    @JsonAlias({"company_name", "companyName"})
    private String companyName;

    @JsonAlias({"remove_existing", "removeExisting"})
    private Boolean removeExisting;

    @Valid
    @NotNull(message = "Items is required")
    private List<MasterPolicySalesRequest> items;
}
