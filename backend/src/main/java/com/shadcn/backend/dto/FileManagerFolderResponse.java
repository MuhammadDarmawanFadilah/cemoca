package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileManagerFolderResponse {
    private String companyCode;
    private String basePath;
    private List<FolderInfo> folders;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FolderInfo {
        private String name;
        private String path;
        private Integer fileCount;
        private List<FileInfo> files;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileInfo {
        private String name;
        private String path;
        private Long size;
        private String lastModified;
    }
}
