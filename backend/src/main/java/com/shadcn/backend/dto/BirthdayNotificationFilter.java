package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BirthdayNotificationFilter {
    private Integer year;
    private String alumniYear;
    private String status;
    private String isExcluded;
    private String nama;
    private String startBirthDate;
    private String endBirthDate;
    private String maxDaysUntilBirthday;
    // Keep old parameters for backward compatibility
    private String startDate;    private String endDate;
    // Location filters
    private String provinsi;
    private String kota;
    private String kecamatan;
    private String kelurahan;
    private Integer page = 0;
    private Integer size = 10;
    private String sortBy = "notificationDate";
    private String sortDirection = "desc";
}
