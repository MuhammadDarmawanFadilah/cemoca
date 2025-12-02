package com.shadcn.backend.controller;

import com.shadcn.backend.dto.CommentRequest;
import com.shadcn.backend.dto.CommentResponse;
import com.shadcn.backend.dto.DocumentCreateRequest;
import com.shadcn.backend.dto.DocumentUpdateRequest;
import com.shadcn.backend.dto.DocumentResponse;
import com.shadcn.backend.dto.KomentarDocumentDto;
import com.shadcn.backend.service.DocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
@Validated
@CrossOrigin(origins = "${frontend.url}", maxAge = 3600)
public class DocumentController {

    private final DocumentService documentService;    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String title) {
          try {
            // Handle sort parameter mapping
            if ("newest".equals(sort)) {
                sortBy = "createdAt";
                sortDir = "desc";
            } else if ("oldest".equals(sort)) {
                sortBy = "createdAt";
                sortDir = "asc";
            } else if ("mostDownloaded".equals(sort)) {
                sortBy = "downloadCount";
                sortDir = "desc";
            } else if ("title".equals(sort)) {
                sortBy = "title";
                sortDir = "asc";
            }
              Page<DocumentResponse> documentsPage = documentService.getAllDocumentsWithFilters(
                page, size, sortBy, sortDir, fileType, author, title);
            
            Map<String, Object> response = new HashMap<>();
            response.put("documents", documentsPage.getContent());
            response.put("currentPage", documentsPage.getNumber());
            response.put("totalItems", documentsPage.getTotalElements());
            response.put("totalPages", documentsPage.getTotalPages());
            response.put("hasNext", documentsPage.hasNext());
            response.put("hasPrevious", documentsPage.hasPrevious());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting all documents", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve documents");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchDocuments(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String sort) {
          try {
            // Handle legacy sort parameter mapping for backward compatibility
            if (sort != null) {
                if ("newest".equals(sort)) {
                    sortBy = "createdAt";
                    sortDir = "desc";
                } else if ("oldest".equals(sort)) {
                    sortBy = "createdAt";
                    sortDir = "asc";
                } else if ("mostDownloaded".equals(sort)) {
                    sortBy = "downloadCount";
                    sortDir = "desc";
                } else if ("title".equals(sort)) {
                    sortBy = "title";
                    sortDir = "asc";
                }
            }
            
            Page<DocumentResponse> documentsPage = documentService.searchDocumentsWithFilters(
                keyword, page, size, sortBy, sortDir, fileType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("documents", documentsPage.getContent());
            response.put("currentPage", documentsPage.getNumber());
            response.put("totalItems", documentsPage.getTotalElements());
            response.put("totalPages", documentsPage.getTotalPages());
            response.put("hasNext", documentsPage.hasNext());
            response.put("hasPrevious", documentsPage.hasPrevious());
            response.put("keyword", keyword);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error searching documents", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to search documents");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDocumentById(@PathVariable Long id) {
        try {
            return documentService.getDocumentById(id)
                    .map(document -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("document", document);
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("error", "Document not found");
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("Error getting document by id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createDocument(
            @RequestPart("document") @Valid DocumentCreateRequest request,
            @RequestPart("file") @NotNull MultipartFile file) {
        
        try {
            DocumentResponse document = documentService.createDocument(request, file);
            
            Map<String, Object> response = new HashMap<>();
            response.put("document", document);
            response.put("message", "Document created successfully");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            log.error("IO Error creating document", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create document");
            errorResponse.put("message", "Terjadi kesalahan saat menyimpan file. Silakan coba lagi.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (Exception e) {
            log.error("Error creating document", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDocument(
            @PathVariable Long id,
            @RequestBody @Valid DocumentUpdateRequest request) {
        
        try {
            DocumentResponse document = documentService.updateDocument(id, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("document", document);
            response.put("message", "Document updated successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating document: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error updating document: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }    @PutMapping(value = "/{id}/with-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateDocumentWithFile(
            @PathVariable Long id,
            @RequestPart("document") @Valid DocumentUpdateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        
        try {
            DocumentResponse document = documentService.updateDocumentWithFile(id, request, file);
            
            Map<String, Object> response = new HashMap<>();
            response.put("document", document);
            response.put("message", "Document updated successfully");
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("IO Error updating document with file: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update document");
            errorResponse.put("message", "Terjadi kesalahan saat menyimpan file. Silakan coba lagi.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (RuntimeException e) {
            log.error("Error updating document with file: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error updating document with file: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteDocument(@PathVariable Long id) {
        try {
            documentService.deleteDocument(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Document deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error deleting document: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error deleting document: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Map<String, Object>> permanentDeleteDocument(@PathVariable Long id) {
        try {
            documentService.permanentDeleteDocument(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Document permanently deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error permanently deleting document: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to permanently delete document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error permanently deleting document: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to permanently delete document");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        try {
            Resource resource = documentService.downloadDocument(id);
            DocumentResponse document = documentService.getDocumentById(id)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            String contentDisposition = "attachment";
            // Untuk file gambar, bisa menggunakan inline untuk preview di browser
            if (document.getMimeType() != null && 
                (document.getMimeType().startsWith("image/") || 
                 document.getMimeType().equals("application/pdf"))) {
                contentDisposition = "inline";
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(
                        document.getMimeType() != null ? document.getMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           contentDisposition + "; filename=\"" + document.getFileName() + "\"")
                    .body(resource);
        } catch (IOException e) {
            log.error("IO Error downloading document: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            log.error("Error downloading document: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error downloading document: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDocumentStats() {
        try {
            // This can be implemented to show document statistics
            Map<String, Object> stats = new HashMap<>();
            stats.put("message", "Document statistics endpoint");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting document stats", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve document statistics");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Comment endpoints
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long id, 
            @Valid @RequestBody CommentRequest request) {
        try {
            CommentResponse response = documentService.createComment(request, id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating comment for document " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @GetMapping("/{id}/comments")
    public ResponseEntity<List<KomentarDocumentDto>> getComments(@PathVariable Long id) {
        try {
            List<KomentarDocumentDto> comments = documentService.getCommentsByDocumentDtoList(id);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            log.error("Error getting comments for document " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/comments/{commentId}/like")
    public ResponseEntity<CommentResponse> likeComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> request) {
        try {
            Long biografiId = request.get("biografiId") != null ? 
                ((Number) request.get("biografiId")).longValue() : null;
            String userName = (String) request.get("userName");
            
            CommentResponse response = documentService.likeComment(commentId, biografiId, userName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error liking comment " + commentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/comments/{commentId}/dislike")
    public ResponseEntity<CommentResponse> dislikeComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> request) {
        try {
            Long biografiId = request.get("biografiId") != null ? 
                ((Number) request.get("biografiId")).longValue() : null;
            String userName = (String) request.get("userName");
            
            CommentResponse response = documentService.dislikeComment(commentId, biografiId, userName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error disliking comment " + commentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/comments/{commentId}/reply")
    public ResponseEntity<CommentResponse> replyToComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request) {
        try {
            CommentResponse response = documentService.replyToComment(commentId, request, id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error replying to comment " + commentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/comments/count")
    public ResponseEntity<Map<String, Long>> getCommentCount(@PathVariable Long id) {
        try {
            long count = documentService.getCommentCount(id);
            Map<String, Long> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting comment count for document " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
