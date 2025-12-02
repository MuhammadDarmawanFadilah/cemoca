package com.shadcn.backend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewDTO {
    private OrganizationInfoDTO organizationInfo;
    private QuickStatsDTO quickStats;
    private List<MonthlyDataDTO> monthlyData;
    private List<ActivityFeedDTO> activityFeed;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizationInfoDTO {
        private String name;
        private String description;
        private String mission;
        private String vision;
        private String establishedYear;
        private String logoUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuickStatsDTO {
        private Long totalMembers;
        private Long activeMembers;
        private Long totalNews;
        private Long totalProposals;
        private Long totalDocuments;
        private Long monthlyLogins;
        private Double memberGrowthRate;
        private Double newsGrowthRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyDataDTO {
        private String month;
        private Long logins;
        private Long newMembers;
        private Long newsPublished;
        private Long proposalsSubmitted;
        private Long documentsUploaded;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityFeedDTO {
        private String type; // "login", "registration", "news", "proposal", "comment", "document"
        private String title;
        private String description;
        private String userName;
        private String userAvatar;
        private String timestamp;
        private String itemUrl;
        private String icon;
        private String color;
    }
}
