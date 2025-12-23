package com.shadcn.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class LearningScheduleDemoSeedRequest {
    private String companyCode;
    private List<String> phones;
}
