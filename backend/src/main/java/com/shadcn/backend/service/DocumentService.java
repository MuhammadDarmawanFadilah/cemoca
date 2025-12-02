package com.shadcn.backend.service;

import com.shadcn.backend.config.AppProperties;
import com.shadcn.backend.dto.CommentRequest;
import com.shadcn.backend.dto.CommentResponse;
import com.shadcn.backend.dto.DocumentCreateRequest;
import com.shadcn.backend.dto.DocumentUpdateRequest;
import com.shadcn.backend.dto.DocumentResponse;
import com.shadcn.backend.dto.KomentarDocumentDto;
import com.shadcn.backend.exception.ValidationException;
import com.shadcn.backend.model.Document;
import com.shadcn.backend.model.KomentarDocument;
import com.shadcn.backend.model.KomentarDocumentVote;
import com.shadcn.backend.repository.DocumentRepository;
import com.shadcn.backend.repository.KomentarDocumentRepository;
import com.shadcn.backend.repository.KomentarDocumentVoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final KomentarDocumentRepository komentarDocumentRepository;
    private final KomentarDocumentVoteRepository komentarDocumentVoteRepository;
    private final AppProperties appProperties;

    @Value("${app.upload.document-dir:/storage/documents}")
    private String uploadDir;

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "text/markdown",
        "application/zip",
        "application/x-rar-compressed",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/bmp"
    );    public Page<DocumentResponse> getAllDocuments(int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<Document> documents = documentRepository.findByIsActiveTrueOrderByCreatedAtDesc(pageable);
        return documents.map(this::convertToResponse);
    }    public Page<DocumentResponse> getAllDocumentsWithFilters(int page, int size, String sortBy, String sortDir, 
                                                            String fileType, String author, String title) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<Document> documents;
        
        // Build dynamic query based on filters
        boolean hasFileType = fileType != null && !fileType.equals("all");
        boolean hasAuthor = author != null && !author.trim().isEmpty();
        boolean hasTitle = title != null && !title.trim().isEmpty();
        
        if (hasFileType && hasAuthor && hasTitle) {
            documents = documentRepository.findByIsActiveTrueAndFileTypeContainingIgnoreCaseAndAuthorContainingIgnoreCaseAndTitleContainingIgnoreCase(
                fileType, author, title, pageable);
        } else if (hasFileType && hasAuthor) {
            documents = documentRepository.findByIsActiveTrueAndFileTypeContainingIgnoreCaseAndAuthorContainingIgnoreCase(
                fileType, author, pageable);
        } else if (hasFileType && hasTitle) {
            documents = documentRepository.findByIsActiveTrueAndFileTypeContainingIgnoreCaseAndTitleContainingIgnoreCase(
                fileType, title, pageable);
        } else if (hasAuthor && hasTitle) {
            documents = documentRepository.findByIsActiveTrueAndAuthorContainingIgnoreCaseAndTitleContainingIgnoreCase(
                author, title, pageable);
        } else if (hasFileType) {
            documents = documentRepository.findByIsActiveTrueAndFileTypeContainingIgnoreCase(fileType, pageable);
        } else if (hasAuthor) {
            documents = documentRepository.findByIsActiveTrueAndAuthorContainingIgnoreCase(author, pageable);
        } else if (hasTitle) {
            documents = documentRepository.findByIsActiveTrueAndTitleContainingIgnoreCase(title, pageable);
        } else {
            documents = documentRepository.findByIsActiveTrueOrderByCreatedAtDesc(pageable);
        }
        
        return documents.map(this::convertToResponse);
    }

    public List<DocumentResponse> searchDocuments(String keyword) {
        List<Document> documents = documentRepository.searchDocuments(keyword);
        return documents.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }    public Page<DocumentResponse> searchDocuments(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Document> documents = documentRepository.searchDocuments(keyword, pageable);
        return documents.map(this::convertToResponse);
    }

    public Page<DocumentResponse> searchDocumentsWithFilters(String keyword, int page, int size, 
                                                           String sortBy, String sortDir, String fileType) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<Document> documents;
        
        if (fileType != null && !fileType.equals("all")) {
            documents = documentRepository.searchDocumentsWithFileType(keyword, fileType, pageable);
        } else {
            documents = documentRepository.searchDocuments(keyword, pageable);
        }
        
        return documents.map(this::convertToResponse);
    }

    public Optional<DocumentResponse> getDocumentById(Long id) {
        return documentRepository.findById(id)
                .filter(Document::getIsActive)
                .map(this::convertToResponse);
    }

    public DocumentResponse createDocument(DocumentCreateRequest request, MultipartFile file) throws IOException {
        validateFile(file);
        
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "unknown_file";
        }
        
        String fileExtension = originalFilename.contains(".") ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        
        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Create document entity
        Document document = new Document();        document.setTitle(request.getTitle());
        document.setAuthor(request.getAuthor());
        document.setSummary(request.getSummary());
        document.setIllustrationImage(request.getIllustrationImage());
        document.setFileName(originalFilename);
        document.setFilePath(filePath.toString());
        document.setFileSize(file.getSize());
        document.setFileType(getFileExtension(originalFilename));
        document.setMimeType(file.getContentType());
        document.setDownloadCount(0);
        document.setIsActive(true);

        Document savedDocument = documentRepository.save(document);
        log.info("Document created successfully: {}", savedDocument.getId());
        
        return convertToResponse(savedDocument);
    }

    public DocumentResponse updateDocument(Long id, DocumentUpdateRequest request) {
        Document document = documentRepository.findById(id)
                .filter(Document::getIsActive)
                .orElseThrow(() -> new RuntimeException("Document not found"));        document.setTitle(request.getTitle());
        document.setAuthor(request.getAuthor());
        document.setSummary(request.getSummary());
        document.setIllustrationImage(request.getIllustrationImage());

        Document updatedDocument = documentRepository.save(document);
        log.info("Document updated successfully: {}", updatedDocument.getId());
        
        return convertToResponse(updatedDocument);
    }

    public DocumentResponse updateDocumentWithFile(Long id, DocumentUpdateRequest request, MultipartFile file) throws IOException {
        Document document = documentRepository.findById(id)
                .filter(Document::getIsActive)
                .orElseThrow(() -> new RuntimeException("Document not found"));        // Update basic fields
        document.setTitle(request.getTitle());
        document.setAuthor(request.getAuthor());
        document.setSummary(request.getSummary());
        document.setIllustrationImage(request.getIllustrationImage());

        // If new file is provided, validate and update file
        if (file != null && !file.isEmpty()) {
            validateFile(file);
            
            // Delete old file
            try {
                Files.deleteIfExists(Paths.get(document.getFilePath()));
            } catch (IOException e) {
                log.warn("Failed to delete old file: {}", document.getFilePath(), e);
            }

            // Save new file
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                originalFilename = "unknown_file";
            }
            
            String fileExtension = originalFilename.contains(".") ? 
                    originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
                    
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            document.setFileName(originalFilename);
            document.setFilePath(filePath.toString());
            document.setFileSize(file.getSize());
            document.setFileType(getFileExtension(originalFilename));
            document.setMimeType(file.getContentType());
        }

        Document updatedDocument = documentRepository.save(document);
        log.info("Document updated with file successfully: {}", updatedDocument.getId());
        
        return convertToResponse(updatedDocument);
    }

    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .filter(Document::getIsActive)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Soft delete
        document.setIsActive(false);
        documentRepository.save(document);
        
        log.info("Document soft deleted successfully: {}", id);
    }

    public void permanentDeleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Delete physical file
        try {
            Files.deleteIfExists(Paths.get(document.getFilePath()));
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", document.getFilePath(), e);
        }

        // Delete from database
        documentRepository.delete(document);
        log.info("Document permanently deleted successfully: {}", id);
    }

    public Resource downloadDocument(Long id) throws IOException {
        Document document = documentRepository.findById(id)
                .filter(Document::getIsActive)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Increment download count
        document.setDownloadCount(document.getDownloadCount() + 1);
        documentRepository.save(document);

        Path filePath = Paths.get(document.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());
        
        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new IOException("File not found or not readable: " + document.getFileName());
        }
    }    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ValidationException("File tidak boleh kosong");
        }

        long maxFileSize = appProperties.getDocument().getMaxFileSize().toBytes();
        if (file.getSize() > maxFileSize) {
            long maxFileSizeMB = maxFileSize / (1024 * 1024);
            throw new ValidationException("Ukuran file melebihi batas maksimum " + maxFileSizeMB + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new ValidationException("Tipe file tidak diperbolehkan: " + (contentType != null ? contentType : "unknown") + 
                    ". Tipe file yang diperbolehkan: PDF, Word, Excel, PowerPoint, Text, CSV, Markdown, ZIP, RAR, JPEG, PNG, GIF, BMP");
        }
    }private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }    private DocumentResponse convertToResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .author(document.getAuthor())
                .summary(document.getSummary())
                .fileName(document.getFileName())
                .fileType(document.getFileType())
                .mimeType(document.getMimeType())
                .fileSize(document.getFileSize())
                .illustrationImage(document.getIllustrationImage())
                .downloadCount(document.getDownloadCount())
                .isActive(document.getIsActive())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    // Comment-related methods
    public CommentResponse createComment(CommentRequest request, Long documentId) {
        Optional<Document> documentOpt = documentRepository.findById(documentId);
        if (!documentOpt.isPresent()) {
            throw new RuntimeException("Document tidak ditemukan");
        }

        // Validate foto field - should only contain filename, not path
        String foto = request.getFoto();
        if (foto != null && !foto.trim().isEmpty()) {
            if (foto.contains("/") || foto.contains("\\") || foto.startsWith("http")) {
                throw new RuntimeException("Field foto hanya boleh berisi nama file, bukan path atau URL");
            }
        }

        KomentarDocument komentar = new KomentarDocument();
        komentar.setDocument(documentOpt.get());
        komentar.setNamaPengguna(request.getNama());
        komentar.setBiografiId(request.getBiografiId());
        komentar.setKonten(request.getKonten());
        komentar.setFotoPengguna(foto);
        komentar.setTanggalKomentar(LocalDateTime.now());
        komentar.setUpdatedAt(LocalDateTime.now());
        komentar.setLikes(0);
        komentar.setDislikes(0);

        // If this is a reply
        if (request.getParentId() != null) {
            Optional<KomentarDocument> parentOpt = komentarDocumentRepository.findById(request.getParentId());
            if (parentOpt.isPresent()) {
                komentar.setParentKomentar(parentOpt.get());
            }
        }

        KomentarDocument savedKomentar = komentarDocumentRepository.save(komentar);
        return convertToCommentResponse(savedKomentar);
    }

    public List<CommentResponse> getCommentsByDocument(Long documentId) {
        List<KomentarDocument> comments = komentarDocumentRepository.findByDocumentIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(documentId);
        return comments.stream()
                .map(this::convertToCommentResponseWithReplies)
                .collect(Collectors.toList());
    }
    
    // Get comments as DTOs to avoid lazy loading issues - paginated
    public Page<KomentarDocumentDto> getCommentsByDocumentDto(Long documentId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<KomentarDocumentDto> parentComments = komentarDocumentRepository.findParentCommentsDtoByDocumentId(documentId, pageable);
        
        // For each parent comment, fetch its replies recursively
        parentComments.getContent().forEach(comment -> {
            List<KomentarDocumentDto> replies = getRepliesRecursively(comment.getId());
            comment.setReplies(replies);
        });
        
        return parentComments;
    }
    
    // Get comments as DTOs without pagination
    public List<KomentarDocumentDto> getCommentsByDocumentDtoList(Long documentId) {
        Page<KomentarDocumentDto> page = getCommentsByDocumentDto(documentId, 0, Integer.MAX_VALUE);
        return page.getContent();
    }
    
    // Recursively fetch replies and their nested replies
    private List<KomentarDocumentDto> getRepliesRecursively(Long parentId) {
        List<KomentarDocumentDto> replies = komentarDocumentRepository.findRepliesDtoByParentId(parentId);
        
        // For each reply, get its nested replies
        replies.forEach(reply -> {
            List<KomentarDocumentDto> nestedReplies = getRepliesRecursively(reply.getId());
            if (!nestedReplies.isEmpty()) {
                reply.setReplies(nestedReplies);
            }
        });
        
        return replies;
    }

    public CommentResponse likeComment(Long commentId, Long biografiId, String userName) {
        Optional<KomentarDocument> komentarOpt = komentarDocumentRepository.findById(commentId);
        if (!komentarOpt.isPresent()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }

        KomentarDocument komentar = komentarOpt.get();
        
        // Check if user already voted
        Optional<KomentarDocumentVote> existingVote = komentarDocumentVoteRepository.findByKomentarIdAndBiografiId(commentId, biografiId);
        
        if (existingVote.isPresent()) {
            KomentarDocumentVote vote = existingVote.get();
            if (vote.getVoteType() == KomentarDocumentVote.VoteType.LIKE) {
                // User already liked, remove the like (toggle)
                komentarDocumentVoteRepository.delete(vote);
            } else {
                // User had disliked, change to like
                vote.setVoteType(KomentarDocumentVote.VoteType.LIKE);
                vote.setUserName(userName);
                komentarDocumentVoteRepository.save(vote);
            }
        } else {
            // New vote
            KomentarDocumentVote newVote = new KomentarDocumentVote();
            newVote.setKomentar(komentar);
            newVote.setBiografiId(biografiId);
            newVote.setUserName(userName);
            newVote.setVoteType(KomentarDocumentVote.VoteType.LIKE);
            komentarDocumentVoteRepository.save(newVote);
        }
        
        // Update counters based on actual votes
        updateDocumentCommentCounters(komentar);
        komentar.setUpdatedAt(LocalDateTime.now());
        KomentarDocument savedKomentar = komentarDocumentRepository.save(komentar);
        return convertToCommentResponse(savedKomentar);
    }

    public CommentResponse dislikeComment(Long commentId, Long biografiId, String userName) {
        Optional<KomentarDocument> komentarOpt = komentarDocumentRepository.findById(commentId);
        if (!komentarOpt.isPresent()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }

        KomentarDocument komentar = komentarOpt.get();
        
        // Check if user already voted
        Optional<KomentarDocumentVote> existingVote = komentarDocumentVoteRepository.findByKomentarIdAndBiografiId(commentId, biografiId);
        
        if (existingVote.isPresent()) {
            KomentarDocumentVote vote = existingVote.get();
            if (vote.getVoteType() == KomentarDocumentVote.VoteType.DISLIKE) {
                // User already disliked, remove the dislike (toggle)
                komentarDocumentVoteRepository.delete(vote);
            } else {
                // User had liked, change to dislike
                vote.setVoteType(KomentarDocumentVote.VoteType.DISLIKE);
                vote.setUserName(userName);
                komentarDocumentVoteRepository.save(vote);
            }
        } else {
            // New vote
            KomentarDocumentVote newVote = new KomentarDocumentVote();
            newVote.setKomentar(komentar);
            newVote.setBiografiId(biografiId);
            newVote.setUserName(userName);
            newVote.setVoteType(KomentarDocumentVote.VoteType.DISLIKE);
            komentarDocumentVoteRepository.save(newVote);
        }
        
        // Update counters based on actual votes
        updateDocumentCommentCounters(komentar);
        komentar.setUpdatedAt(LocalDateTime.now());
        KomentarDocument savedKomentar = komentarDocumentRepository.save(komentar);
        return convertToCommentResponse(savedKomentar);
    }

    private void updateDocumentCommentCounters(KomentarDocument komentar) {
        long likes = komentarDocumentVoteRepository.countLikesByKomentarId(komentar.getId());
        long dislikes = komentarDocumentVoteRepository.countDislikesByKomentarId(komentar.getId());
        komentar.setLikes((int) likes);
        komentar.setDislikes((int) dislikes);
    }    public CommentResponse replyToComment(Long commentId, CommentRequest request, Long documentId) {
        Optional<KomentarDocument> parentOpt = komentarDocumentRepository.findById(commentId);
        if (!parentOpt.isPresent()) {
            throw new RuntimeException("Komentar parent tidak ditemukan");
        }
        
        // Create reply request with parent ID
        CommentRequest replyRequest = new CommentRequest();
        replyRequest.setNama(request.getNama());
        replyRequest.setBiografiId(request.getBiografiId());
        replyRequest.setKonten(request.getKonten());
        replyRequest.setFoto(request.getFoto());
        replyRequest.setParentId(commentId);

        return createComment(replyRequest, documentId);
    }

    private CommentResponse convertToCommentResponse(KomentarDocument komentar) {
        CommentResponse response = new CommentResponse();
        response.setId(komentar.getId());
        response.setBeritaId(komentar.getDocument().getId()); // Using beritaId field to represent documentId for compatibility
        response.setBiografiId(komentar.getBiografiId());
        response.setNama(komentar.getNamaPengguna());
        response.setKonten(komentar.getKonten());
        response.setFoto(komentar.getFotoPengguna());
        response.setParentId(komentar.getParentKomentar() != null ? komentar.getParentKomentar().getId() : null);
        response.setLikes(komentar.getLikes());
        response.setDislikes(komentar.getDislikes());
        response.setCreatedAt(komentar.getTanggalKomentar());
        response.setUpdatedAt(komentar.getUpdatedAt());
        
        return response;
    }

    private CommentResponse convertToCommentResponseWithReplies(KomentarDocument komentar) {
        CommentResponse response = convertToCommentResponse(komentar);
        
        // Load replies recursively
        List<KomentarDocument> replies = komentarDocumentRepository.findByParentKomentarIdOrderByTanggalKomentarAsc(komentar.getId());
        List<CommentResponse> replyResponses = replies.stream()
                .map(this::convertToCommentResponseWithReplies)
                .collect(Collectors.toList());
        
        response.setReplies(replyResponses);
        
        return response;
    }

    public long getCommentCount(Long documentId) {
        return komentarDocumentRepository.countByDocumentId(documentId);
    }
}
