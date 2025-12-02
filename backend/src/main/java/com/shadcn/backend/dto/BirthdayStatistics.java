package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BirthdayStatistics {
    private Long totalBirthdays;
    private Long sent;
    private Long pending;
    private Long failed;
    private Long excluded;
    private Integer year;
}
