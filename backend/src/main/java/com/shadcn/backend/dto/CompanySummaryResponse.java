package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanySummaryResponse {
    private String companyCode;
    private String companyName;
    private long totalUsers;
    private long activeUsers;

    public boolean isActive() {
        return activeUsers > 0;
    }
}
