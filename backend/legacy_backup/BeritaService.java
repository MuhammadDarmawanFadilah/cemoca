package com.shadcn.backend.service;

import com.shadcn.backend.dto.BeritaDetailDto;
import com.shadcn.backend.dto.BeritaFilterRequest;
import com.shadcn.backend.dto.BeritaRequest;
import com.shadcn.backend.dto.BeritaSummaryDto;
import com.shadcn.backend.dto.PagedResponse;
import com.shadcn.backend.model.Berita;
import com.shadcn.backend.model.KomentarBerita;
import com.shadcn.backend.repository.BeritaRepository;
import com.shadcn.backend.repository.KomentarBeritaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BeritaService {
    
    private final BeritaRepository beritaRepository;
    private final KomentarBeritaRepository komentarBeritaRepository;
    
    // Get all berita with pagination and filters
    public PagedResponse<Berita> getAllBerita(BeritaFilterRequest filterRequest) {
        Sort sort = Sort.by(
            filterRequest.getSortDirection().equalsIgnoreCase("desc") ? 
            Sort.Direction.DESC : Sort.Direction.ASC,
            filterRequest.getSortBy()
        );
        
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
        Page<Berita> beritaPage;
          if (filterRequest.isPopular()) {
            beritaPage = beritaRepository.findByStatusOrderByJumlahViewDescCreatedAtDesc(
                filterRequest.getStatus(), pageable);        } else if (filterRequest.getKeyword() != null && !filterRequest.getKeyword().trim().isEmpty()) {
            beritaPage = beritaRepository.findByJudulContainingIgnoreCaseOrKontenContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(
                filterRequest.getKeyword().trim(), filterRequest.getKeyword().trim(), filterRequest.getStatus().name(), pageable);
        } else if (filterRequest.getKategori() != null) {
            beritaPage = beritaRepository.findByKategoriAndStatusOrderByCreatedAtDesc(
                filterRequest.getKategori(), filterRequest.getStatus(), pageable);
        } else {
            beritaPage = beritaRepository.findByStatusOrderByCreatedAtDesc(
                filterRequest.getStatus(), pageable);
        }
        
        return new PagedResponse<>(
            beritaPage.getContent(),
            beritaPage.getNumber(),
            beritaPage.getSize(),
            beritaPage.getTotalElements(),
            beritaPage.getTotalPages(),
            beritaPage.isFirst(),
            beritaPage.isLast(),
            beritaPage.isEmpty()
        );
    }
    
    // Get berita by ID
    public Optional<Berita> getBeritaById(Long id) {
        return beritaRepository.findById(id);
    }
    
    // Get berita by ID and increment view count
    @Transactional
    public Optional<Berita> getBeritaByIdAndIncrementView(Long id) {
        Optional<Berita> berita = beritaRepository.findById(id);
        if (berita.isPresent()) {
            beritaRepository.incrementViewCount(id);
            // Refresh the entity to get updated view count
            Berita updatedBerita = berita.get();
            updatedBerita.setJumlahView(updatedBerita.getJumlahView() + 1);
            return Optional.of(updatedBerita);
        }
        return berita;
    }      // Create new berita
    public Berita createBerita(BeritaRequest beritaRequest) {
        log.info("Creating new berita with title: {}", beritaRequest.getJudul());
        
        Berita berita = new Berita();
        berita.setJudul(beritaRequest.getJudul());
        berita.setRingkasan(beritaRequest.getRingkasan());
        if (beritaRequest.getRingkasanWordCount() != null) {
            berita.setRingkasanWordCount(beritaRequest.getRingkasanWordCount());
        }
        berita.setKonten(beritaRequest.getKonten());
        berita.setPenulis(beritaRequest.getPenulis());
        if (beritaRequest.getPenulisBiografiId() != null) {
            berita.setPenulisBiografiId(beritaRequest.getPenulisBiografiId());
        }
        berita.setGambarUrl(beritaRequest.getGambarUrl());
        if (beritaRequest.getMediaLampiran() != null) {
            berita.setMediaLampiran(beritaRequest.getMediaLampiran());
        }
        berita.setStatus(beritaRequest.getStatus());
        berita.setKategori(beritaRequest.getKategori());
        berita.setTags(beritaRequest.getTags());
        
        return beritaRepository.save(berita);
    }
      // Update berita
    public Berita updateBerita(Long id, BeritaRequest beritaRequest) {
        log.info("Updating berita with ID: {}", id);
        
        Berita berita = beritaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Berita tidak ditemukan dengan ID: " + id));
        
        berita.setJudul(beritaRequest.getJudul());
        berita.setRingkasan(beritaRequest.getRingkasan());
        if (beritaRequest.getRingkasanWordCount() != null) {
            berita.setRingkasanWordCount(beritaRequest.getRingkasanWordCount());
        }
        berita.setKonten(beritaRequest.getKonten());
        berita.setPenulis(beritaRequest.getPenulis());
        if (beritaRequest.getPenulisBiografiId() != null) {
            berita.setPenulisBiografiId(beritaRequest.getPenulisBiografiId());
        }
        berita.setGambarUrl(beritaRequest.getGambarUrl());
        if (beritaRequest.getMediaLampiran() != null) {
            berita.setMediaLampiran(beritaRequest.getMediaLampiran());
        }
        berita.setStatus(beritaRequest.getStatus());
        berita.setKategori(beritaRequest.getKategori());
        berita.setTags(beritaRequest.getTags());
        
        return beritaRepository.save(berita);
    }
    
    // Delete berita
    public void deleteBerita(Long id) {
        log.info("Deleting berita with ID: {}", id);
        
        if (!beritaRepository.existsById(id)) {
            throw new RuntimeException("Berita tidak ditemukan dengan ID: " + id);
        }
        
        beritaRepository.deleteById(id);
    }
    
    // Like berita
    @Transactional
    public void likeBerita(Long id) {
        if (!beritaRepository.existsById(id)) {
            throw new RuntimeException("Berita tidak ditemukan dengan ID: " + id);
        }
        beritaRepository.incrementLikeCount(id);
    }
    
    // Get latest berita
    public List<Berita> getLatestBerita() {
        return beritaRepository.findTop5ByStatusOrderByCreatedAtDesc(Berita.StatusBerita.PUBLISHED);    }
    
    // Get popular berita (updated for controller compatibility)
    public List<Berita> getPopularBerita(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return beritaRepository.findByStatusOrderByJumlahViewDescCreatedAtDesc(
            Berita.StatusBerita.PUBLISHED, pageable).getContent();
    }
    
    // Get berita statistics
    public BeritaStats getBeritaStats() {
        long totalBerita = beritaRepository.count();
        long publishedBerita = beritaRepository.countByStatus(Berita.StatusBerita.PUBLISHED);
        long draftBerita = beritaRepository.countByStatus(Berita.StatusBerita.DRAFT);
        long archivedBerita = beritaRepository.countByStatus(Berita.StatusBerita.ARCHIVED);
          return new BeritaStats(totalBerita, publishedBerita, draftBerita, archivedBerita);
    }
    
    // Method for controller compatibility
    public Page<Berita> getBeritaWithFilter(BeritaFilterRequest filterRequest, Pageable pageable) {
        if (filterRequest.getSearch() != null && !filterRequest.getSearch().trim().isEmpty()) {
            return beritaRepository.findByJudulContainingIgnoreCaseOrKontenContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(
                filterRequest.getSearch().trim(), filterRequest.getSearch().trim(), filterRequest.getStatus().name(), pageable);
        } else if (filterRequest.getKategori() != null) {
            return beritaRepository.findByKategoriAndStatusOrderByCreatedAtDesc(
                filterRequest.getKategori(), filterRequest.getStatus(), pageable);
        } else {
            return beritaRepository.findByStatusOrderByCreatedAtDesc(
                filterRequest.getStatus(), pageable);
        }
    }
      // Optimized method for list endpoints to avoid N+1 problem
    public Page<BeritaSummaryDto> getBeritaSummaryWithFilter(BeritaFilterRequest filterRequest, Pageable pageable) {
        if (filterRequest.getSearch() != null && !filterRequest.getSearch().trim().isEmpty()) {
            String search = "%" + filterRequest.getSearch().trim() + "%";
            return beritaRepository.findBeritaSummaryBySearch(
                search, filterRequest.getStatus(), pageable);
        } else if (filterRequest.getKategori() != null) {
            return beritaRepository.findBeritaSummaryByKategoriAndStatus(
                filterRequest.getKategori(), filterRequest.getStatus(), pageable);
        } else {
            return beritaRepository.findBeritaSummaryByStatus(
                filterRequest.getStatus(), pageable);
        }
    }
    
    // Increment view count
    @Transactional
    public void incrementView(Long id) {
        beritaRepository.incrementViewCount(id);
    }    // Get published berita with search and category filter
    public Page<Berita> getPublishedBerita(String search, String kategori, Pageable pageable) {
        log.info("Getting published berita - search: '{}', kategori: '{}'", search, kategori);
        
        // Normalize parameters
        String trimmedSearch = (search != null) ? search.trim() : "";
        String trimmedKategori = (kategori != null) ? kategori.trim() : "";
        
        boolean hasSearch = !trimmedSearch.isEmpty();
        boolean hasKategori = !trimmedKategori.isEmpty() && !trimmedKategori.equals("ALL");        if (hasSearch && hasKategori) {
            // Both search and category filter
            try {
                // Validate kategori enum, but use string for query
                Berita.KategoriBerita.valueOf(trimmedKategori.toUpperCase());
                return beritaRepository.findByJudulContainingIgnoreCaseOrKontenContainingIgnoreCaseAndStatusAndKategoriOrderByCreatedAtDesc(
                    trimmedSearch, trimmedSearch, "PUBLISHED", trimmedKategori.toUpperCase(), pageable);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid category value: {}, searching without category filter", trimmedKategori);
                return beritaRepository.findByJudulContainingIgnoreCaseOrKontenContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(
                    trimmedSearch, trimmedSearch, "PUBLISHED", pageable);
            }
        } else if (hasSearch) {
            // Search only by title and content for better coverage
            return beritaRepository.findByJudulContainingIgnoreCaseOrKontenContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(
                trimmedSearch, trimmedSearch, "PUBLISHED", pageable);
        } else if (hasKategori) {
            // Category filter only
            try {
                Berita.KategoriBerita kategoriEnum = Berita.KategoriBerita.valueOf(trimmedKategori.toUpperCase());
                return beritaRepository.findByKategoriAndStatusOrderByCreatedAtDesc(
                    kategoriEnum, Berita.StatusBerita.PUBLISHED, pageable);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid category value: {}, returning all published berita", trimmedKategori);
                return beritaRepository.findByStatusOrderByCreatedAtDesc(Berita.StatusBerita.PUBLISHED, pageable);
            }
        } else {
            // No filters, return all published berita
            return beritaRepository.findByStatusOrderByCreatedAtDesc(Berita.StatusBerita.PUBLISHED, pageable);
        }
    }

    // Get berita by category
    public Page<Berita> getBeritaByKategori(String kategori, Pageable pageable) {
        try {
            Berita.KategoriBerita kategoriEnum = Berita.KategoriBerita.valueOf(kategori.toUpperCase());
            return beritaRepository.findByKategoriAndStatusOrderByCreatedAtDesc(
                kategoriEnum, Berita.StatusBerita.PUBLISHED, pageable);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid category value: {}, returning empty results", kategori);
            // Return empty page if invalid category
            return Page.empty(pageable);
        }
    }
    
    // Overloaded method for backward compatibility
    public List<Berita> getPopularBerita(int limit) {
        return getPopularBerita(0, limit);
    }
    
    // Increment like count
    @Transactional
    public void incrementLike(Long id) {
        beritaRepository.incrementLikeCount(id);
    }
    
    // Update status
    @Transactional
    public Berita updateStatus(Long id, String status) {
        Optional<Berita> beritaOpt = beritaRepository.findById(id);
        if (beritaOpt.isPresent()) {
            Berita berita = beritaOpt.get();
            berita.setStatus(Berita.StatusBerita.valueOf(status));
            return beritaRepository.save(berita);
        }        throw new RuntimeException("Berita not found with id: " + id);
    }    // Search berita
    public Page<Berita> searchBerita(String keyword, Pageable pageable) {
        return beritaRepository.findByJudulContainingIgnoreCaseOrKontenContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(
            keyword, keyword, "PUBLISHED", pageable);
    }
    
    // Get berita detail with optimized comments loading to avoid N+1 queries
    @Transactional
    public Optional<BeritaDetailDto> getBeritaDetailById(Long id) {
        // First, get the berita without comments
        Optional<Berita> beritaOpt = beritaRepository.findByIdWithoutComments(id);
        if (!beritaOpt.isPresent()) {
            return Optional.empty();
        }
        
        Berita berita = beritaOpt.get();
        
        // Then, get all parent comments in one query
        List<KomentarBerita> parentComments = komentarBeritaRepository.findParentCommentsByBeritaId(id);
        
        // If there are parent comments, get all their replies in one query
        List<KomentarBerita> replies = new ArrayList<>();
        if (!parentComments.isEmpty()) {
            List<Long> parentIds = parentComments.stream()
                    .map(KomentarBerita::getId)
                    .collect(Collectors.toList());
            replies = komentarBeritaRepository.findRepliesByParentIds(parentIds);
        }
        
        // Group replies by parent comment ID
        Map<Long, List<KomentarBerita>> repliesMap = replies.stream()
                .collect(Collectors.groupingBy(reply -> reply.getParentKomentar().getId()));
        
        // Convert to DTOs
        List<BeritaDetailDto.KomentarSummaryDto> komentarDtos = parentComments.stream()
                .map(comment -> {
                    BeritaDetailDto.KomentarSummaryDto dto = new BeritaDetailDto.KomentarSummaryDto();
                    dto.setId(comment.getId());                    dto.setKonten(comment.getKonten());
                    dto.setNamaPengguna(comment.getNamaPengguna());
                    dto.setBiografiId(comment.getBiografiId());
                    dto.setFotoPengguna(comment.getFotoPengguna());
                    dto.setTanggalKomentar(comment.getTanggalKomentar());
                    dto.setUpdatedAt(comment.getUpdatedAt());
                    dto.setLikes(comment.getLikes());
                    dto.setDislikes(comment.getDislikes());
                    
                    // Add replies if any
                    List<KomentarBerita> commentReplies = repliesMap.get(comment.getId());
                    if (commentReplies != null) {
                        List<BeritaDetailDto.KomentarSummaryDto> replyDtos = commentReplies.stream()
                                .map(reply -> {
                                    BeritaDetailDto.KomentarSummaryDto replyDto = new BeritaDetailDto.KomentarSummaryDto();
                                    replyDto.setId(reply.getId());                                    replyDto.setKonten(reply.getKonten());
                                    replyDto.setNamaPengguna(reply.getNamaPengguna());
                                    replyDto.setBiografiId(reply.getBiografiId());
                                    replyDto.setFotoPengguna(reply.getFotoPengguna());
                                    replyDto.setTanggalKomentar(reply.getTanggalKomentar());
                                    replyDto.setUpdatedAt(reply.getUpdatedAt());
                                    replyDto.setLikes(reply.getLikes());
                                    replyDto.setDislikes(reply.getDislikes());
                                    replyDto.setReplies(new ArrayList<>()); // No nested replies for now
                                    return replyDto;
                                })
                                .collect(Collectors.toList());
                        dto.setReplies(replyDtos);
                    } else {
                        dto.setReplies(new ArrayList<>());
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
        
        // Create the detail DTO
        BeritaDetailDto detailDto = new BeritaDetailDto();
        detailDto.setId(berita.getId());
        detailDto.setJudul(berita.getJudul());
        detailDto.setRingkasan(berita.getRingkasan());
        detailDto.setKonten(berita.getKonten());
        detailDto.setPenulis(berita.getPenulis());
        detailDto.setPenulisBiografiId(berita.getPenulisBiografiId());
        detailDto.setRingkasanWordCount(berita.getRingkasanWordCount());
        detailDto.setGambarUrl(berita.getGambarUrl());
        detailDto.setMediaLampiran(berita.getMediaLampiran());
        detailDto.setStatus(berita.getStatus().name());
        detailDto.setKategori(berita.getKategori().name());
        detailDto.setTags(berita.getTags());
        detailDto.setJumlahView(berita.getJumlahView());
        detailDto.setJumlahLike(berita.getJumlahLike());
        detailDto.setCreatedAt(berita.getCreatedAt());
        detailDto.setUpdatedAt(berita.getUpdatedAt());
        detailDto.setKomentar(komentarDtos);
        
        return Optional.of(detailDto);
    }    // Get popular berita using DTO to avoid N+1 queries
    public List<BeritaSummaryDto> getPopularBeritaSummary(int limit) {
        // Get popular berita by view count - using optimized query
        Pageable pageable = PageRequest.of(0, limit);
        Page<BeritaSummaryDto> popularPage = beritaRepository.findPopularBeritaSummaryByStatus(Berita.StatusBerita.PUBLISHED, pageable);
        return popularPage.getContent();
    }

    // Get published berita using DTO to avoid N+1 queries
    public Page<BeritaSummaryDto> getPublishedBeritaSummary(String search, String kategori, Pageable pageable) {
        try {
            if (search != null && !search.trim().isEmpty()) {
                return beritaRepository.findBeritaSummaryBySearch(search.trim(), Berita.StatusBerita.PUBLISHED, pageable);
            } else if (kategori != null && !kategori.trim().isEmpty()) {
                Berita.KategoriBerita kategoriEnum = Berita.KategoriBerita.valueOf(kategori.toUpperCase());
                return beritaRepository.findBeritaSummaryByKategoriAndStatus(kategoriEnum, Berita.StatusBerita.PUBLISHED, pageable);
            } else {
                return beritaRepository.findBeritaSummaryByStatus(Berita.StatusBerita.PUBLISHED, pageable);
            }
        } catch (IllegalArgumentException e) {
            log.warn("Invalid category value: {}, returning all published berita", kategori);
            return beritaRepository.findBeritaSummaryByStatus(Berita.StatusBerita.PUBLISHED, pageable);
        }
    }

    // Stats class
    public static class BeritaStats {
        public final long totalBerita;
        public final long publishedBerita;
        public final long draftBerita;
        public final long archivedBerita;
        
        public BeritaStats(long totalBerita, long publishedBerita, long draftBerita, long archivedBerita) {
            this.totalBerita = totalBerita;
            this.publishedBerita = publishedBerita;
            this.draftBerita = draftBerita;
            this.archivedBerita = archivedBerita;
        }
    }
}
