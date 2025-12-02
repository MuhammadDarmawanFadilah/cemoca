package com.shadcn.backend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private Long monthlyLoginCount;
    private List<UserInfoDTO> recentLogins;
    
    private Long totalBiographies;
    private List<UserInfoDTO> recentBiographies;
    
    private Long monthlyNewsCount;
    private List<BeritaStatsDTO> popularNews;
    
    private List<UsulanStatsDTO> popularProposals;
    
    private List<RecentCommentDTO> recentComments;
    
    private Long monthlyDocumentCount;
    private List<DocumentStatsDTO> popularDocuments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfoDTO {
        private String fullName;
        private String email;
        private String lastLoginDate;
        private String profileImageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BeritaStatsDTO {
        private Long id;
        private String title;
        private String author;
        private String publishDate;
        private Long viewCount;
        private Long commentCount;
        private String imageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsulanStatsDTO {
        private Long id;
        private String title;
        private String description;
        private String proposer;
        private String createdDate;
        private Long voteCount;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentCommentDTO {
        private String userName;
        private String comment;
        private String commentDate;
        private String type; // "berita", "usulan", "dokumen"
        private String itemTitle;
        private Long itemId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentStatsDTO {
        private Long id;
        private String title;
        private String description;
        private String author;
        private String uploadDate;
        private Long downloadCount;
        private Long commentCount;
        private String fileType;
    }
}
