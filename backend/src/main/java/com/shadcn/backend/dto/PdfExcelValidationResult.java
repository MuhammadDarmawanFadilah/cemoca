package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PdfExcelValidationResult {
    private boolean valid;
    private List<String> errors;
    private List<PdfExcelRow> rows;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PdfExcelRow {
        private Integer rowNumber;
        private String name;
        private String phone;
        private boolean validPhone;
        private String phoneError;
    }
}
