package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserFilterRequest {
    private String search;
    private Long roleId;
    private String status;
    private int page = 0;
    private int size = 10;
    private String sortBy = "fullName";
    private String sortDirection = "asc";
}
