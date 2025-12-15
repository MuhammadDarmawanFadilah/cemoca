package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class MasterAgencyAgentApiImportRequest {

    @NotBlank(message = "Company Code wajib diisi")
    @JsonAlias({"company_code", "companyCode"})
    private String companyCode;

    @JsonAlias({"company_name", "companyName"})
    private String companyName;

    @JsonAlias({"remove_existing", "removeExisting"})
    private Boolean removeExisting;

    @NotNull(message = "Items wajib diisi")
    @Valid
    @JsonAlias({"items", "data"})
    private List<MasterAgencyAgentRequest> items;

    public String getCompanyCode() {
        return companyCode;
    }

    public void setCompanyCode(String companyCode) {
        this.companyCode = companyCode;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public Boolean getRemoveExisting() {
        return removeExisting;
    }

    public void setRemoveExisting(Boolean removeExisting) {
        this.removeExisting = removeExisting;
    }

    public List<MasterAgencyAgentRequest> getItems() {
        return items;
    }

    public void setItems(List<MasterAgencyAgentRequest> items) {
        this.items = items;
    }
}
