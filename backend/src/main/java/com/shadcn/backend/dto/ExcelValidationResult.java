package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExcelValidationResult {
    private boolean valid;
    private List<String> errors;
    private List<ExcelRow> rows;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExcelRow {
        private Integer rowNumber;
        private String name;
        private String phone;
        private String avatar;
        private boolean validPhone;
        private boolean validAvatar;
        private String phoneError;
        private String avatarError;
    }
}
