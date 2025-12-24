package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCompanyRequest {

    @NotBlank(message = "Company name is required")
    @Size(max = 150, message = "Company name maksimal 150 karakter")
    private String companyName;
}
