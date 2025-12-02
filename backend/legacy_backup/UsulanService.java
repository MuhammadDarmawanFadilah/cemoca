package com.shadcn.backend.service;

import com.shadcn.backend.dto.UsulanDetailDto;
import com.shadcn.backend.dto.UsulanSummaryDto;
import com.shadcn.backend.dto.KomentarUsulanDto;
import com.shadcn.backend.model.*;
import com.shadcn.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsulanService {
      private final UsulanRepository usulanRepository;
    private final VoteUsulanRepository voteUsulanRepository;
    private final KomentarUsulanRepository komentarUsulanRepository;
    private final KomentarUsulanVoteRepository komentarUsulanVoteRepository;
    private final PelaksanaanRepository pelaksanaanRepository;
    private final ImageService imageService;    // Get active usulan with pagination and advanced filtering
    public Page<Usulan> getActiveUsulan(int page, int size, String search, String judul, 
                                       String namaPengusul, String status, 
                                       LocalDate tanggalMulaiFrom, LocalDate tanggalMulaiTo,
                                       LocalDate tanggalSelesaiFrom, LocalDate tanggalSelesaiTo,
                                       String sortBy, String sortDirection) {
        Pageable pageable = PageRequest.of(page, size);
        LocalDate currentDate = LocalDate.now();
        
        // Default status to "AKTIF" if not provided or is "all"
        String actualStatus = (status == null || status.equals("all")) ? "AKTIF" : status;
        
        return usulanRepository.searchUsulanWithFilters(
            search, judul, namaPengusul, actualStatus,
            tanggalMulaiFrom, tanggalMulaiTo, tanggalSelesaiFrom, tanggalSelesaiTo,
            currentDate, sortBy, sortDirection, pageable
        );
    }
    
    // Backward compatibility method
    public Page<Usulan> getActiveUsulan(int page, int size, String keyword) {
        return getActiveUsulan(page, size, keyword, null, null, null, 
                             null, null, null, null, "createdAt", "desc");
    }
    
    // Get usulan for pelaksanaan (expired usulan)
    public Page<Usulan> getUsulanForPelaksanaan(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return usulanRepository.findUsulanForPelaksanaan(pageable);
    }
    
    // Get usulan with pelaksanaan
    public Page<Usulan> getUsulanWithPelaksanaan(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return usulanRepository.findUsulanWithPelaksanaan(pageable);
    }
    
    // Get usulan by id
    public Optional<Usulan> getUsulanById(Long id) {
        return usulanRepository.findById(id);
    }
      // Get usulan detail by id (optimized to avoid N+1 problem)
    public Optional<UsulanDetailDto> getUsulanDetailById(Long id) {
        // First query to load usulan with komentar
        Usulan usulanWithKomentar = usulanRepository.findUsulanWithKomentar(id);
        if (usulanWithKomentar == null) {
            return Optional.empty();
        }
        
        // Second query to load votes
        Usulan usulanWithVotes = usulanRepository.findUsulanWithVotes(id);
        
        // Merge the data
        usulanWithKomentar.setVotes(usulanWithVotes != null ? usulanWithVotes.getVotes() : null);
        
        return Optional.of(convertToDetailDto(usulanWithKomentar));
    }
    
    // Convert Usulan entity to UsulanDetailDto
    private UsulanDetailDto convertToDetailDto(Usulan usulan) {
        UsulanDetailDto dto = new UsulanDetailDto();
        dto.setId(usulan.getId());
        dto.setJudul(usulan.getJudul());
        dto.setRencanaKegiatan(usulan.getRencanaKegiatan());
        dto.setTanggalMulai(usulan.getTanggalMulai());
        dto.setTanggalSelesai(usulan.getTanggalSelesai());
        dto.setDurasiUsulan(usulan.getDurasiUsulan());
        dto.setGambarUrl(usulan.getGambarUrl());
        dto.setNamaPengusul(usulan.getNamaPengusul());
        dto.setEmailPengusul(usulan.getEmailPengusul());
        dto.setJumlahUpvote(usulan.getJumlahUpvote());
        dto.setJumlahDownvote(usulan.getJumlahDownvote());
        dto.setStatus(usulan.getStatus());
        dto.setCreatedAt(usulan.getCreatedAt());
        dto.setUpdatedAt(usulan.getUpdatedAt());
        
        // Convert komentar
        if (usulan.getKomentar() != null) {
            dto.setKomentar(usulan.getKomentar().stream()
                .map(k -> {                    UsulanDetailDto.KomentarSummaryDto komentarDto = new UsulanDetailDto.KomentarSummaryDto();
                    komentarDto.setId(k.getId());
                    komentarDto.setKonten(k.getKonten());
                    komentarDto.setNamaPengguna(k.getNamaPengguna());
                    komentarDto.setBiografiId(k.getBiografiId());
                    // Skip replies count for now to avoid lazy loading issues
                    komentarDto.setReplies("");
                    komentarDto.setTanggalKomentar(k.getTanggalKomentar());
                    komentarDto.setUpdatedAt(k.getUpdatedAt());
                    komentarDto.setLikes(k.getLikes());
                    komentarDto.setDislikes(k.getDislikes());
                    return komentarDto;
                }).toList());
        }
        
        // Convert votes
        if (usulan.getVotes() != null) {
            dto.setVotes(usulan.getVotes().stream()
                .map(v -> {
                    UsulanDetailDto.VoteSummaryDto voteDto = new UsulanDetailDto.VoteSummaryDto();
                    voteDto.setId(v.getId());
                    voteDto.setEmailVoter(v.getEmailVoter());
                    voteDto.setNamaVoter(v.getNamaVoter());
                    voteDto.setTipeVote(v.getTipeVote().toString());
                    voteDto.setCreatedAt(v.getCreatedAt());
                    return voteDto;
                }).toList());
        }
        
        // Calculate derived fields
        dto.setScore(usulan.getScore());
        dto.setSisaHari(usulan.getSisaHari());
        dto.setExpired(usulan.isExpired());
        
        return dto;
    }
    
    // Create new usulan
    @Transactional
    public Usulan createUsulan(Usulan usulan, MultipartFile gambar) {
        try {            // Upload gambar if provided
            if (gambar != null && !gambar.isEmpty()) {
                String filename = imageService.saveImage(gambar);
                String gambarUrl = imageService.getImageUrl(filename);
                usulan.setGambarUrl(gambarUrl);
            }
            
            return usulanRepository.save(usulan);
        } catch (Exception e) {
            log.error("Error creating usulan: {}", e.getMessage());
            throw new RuntimeException("Gagal membuat usulan: " + e.getMessage());
        }
    }
    
    // Vote on usulan
    @Transactional
    public void voteUsulan(Long usulanId, String emailVoter, String namaVoter, VoteUsulan.TipeVote tipeVote) {
        Optional<Usulan> usulanOpt = usulanRepository.findById(usulanId);
        if (usulanOpt.isEmpty()) {
            throw new RuntimeException("Usulan tidak ditemukan");
        }
        
        Usulan usulan = usulanOpt.get();
        
        // Check if user already voted
        Optional<VoteUsulan> existingVote = voteUsulanRepository.findByUsulanIdAndEmailVoter(usulanId, emailVoter);
        
        if (existingVote.isPresent()) {
            VoteUsulan vote = existingVote.get();
            // If same vote type, remove vote (toggle)
            if (vote.getTipeVote() == tipeVote) {
                voteUsulanRepository.delete(vote);
                updateUsulanVoteCount(usulan);
                return;
            } else {
                // Change vote type
                vote.setTipeVote(tipeVote);
                voteUsulanRepository.save(vote);
            }
        } else {
            // Create new vote
            VoteUsulan newVote = new VoteUsulan();
            newVote.setUsulan(usulan);
            newVote.setEmailVoter(emailVoter);
            newVote.setNamaVoter(namaVoter);
            newVote.setTipeVote(tipeVote);
            voteUsulanRepository.save(newVote);
        }
        
        updateUsulanVoteCount(usulan);
    }
    
    // Update vote count for usulan
    private void updateUsulanVoteCount(Usulan usulan) {
        long upvoteCount = voteUsulanRepository.countByUsulanIdAndTipeVote(usulan.getId(), VoteUsulan.TipeVote.UPVOTE);
        long downvoteCount = voteUsulanRepository.countByUsulanIdAndTipeVote(usulan.getId(), VoteUsulan.TipeVote.DOWNVOTE);
        
        usulan.setJumlahUpvote(upvoteCount);
        usulan.setJumlahDownvote(downvoteCount);
        usulanRepository.save(usulan);
    }
    
    // Get user's vote for usulan
    public Optional<VoteUsulan> getUserVote(Long usulanId, String emailVoter) {
        return voteUsulanRepository.findByUsulanIdAndEmailVoter(usulanId, emailVoter);
    }
    
    // Add comment to usulan
    @Transactional
    public KomentarUsulan addComment(Long usulanId, KomentarUsulan komentar) {
        Optional<Usulan> usulanOpt = usulanRepository.findById(usulanId);
        if (usulanOpt.isEmpty()) {
            throw new RuntimeException("Usulan tidak ditemukan");
        }
        
        komentar.setUsulan(usulanOpt.get());
        return komentarUsulanRepository.save(komentar);
    }
    
    // Reply to comment
    @Transactional
    public KomentarUsulan replyToComment(Long parentId, KomentarUsulan reply) {
        Optional<KomentarUsulan> parentOpt = komentarUsulanRepository.findById(parentId);
        if (parentOpt.isEmpty()) {
            throw new RuntimeException("Komentar parent tidak ditemukan");
        }
        
        KomentarUsulan parent = parentOpt.get();
        reply.setUsulan(parent.getUsulan());
        reply.setParentKomentar(parent);
        return komentarUsulanRepository.save(reply);
    }
    
    // Get comments for usulan
    public Page<KomentarUsulan> getComments(Long usulanId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return komentarUsulanRepository.findByUsulanIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(usulanId, pageable);
    }
    
    // Get comments as DTOs to avoid lazy loading issues
    public Page<KomentarUsulanDto> getCommentsDto(Long usulanId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<KomentarUsulanDto> parentComments = komentarUsulanRepository.findParentCommentsDtoByUsulanId(usulanId, pageable);
        
        // For each parent comment, fetch its replies recursively
        parentComments.getContent().forEach(comment -> {
            List<KomentarUsulanDto> replies = getRepliesRecursively(comment.getId());
            comment.setReplies(replies);
        });
        
        return parentComments;
    }
    
    // Recursively fetch replies and their nested replies
    private List<KomentarUsulanDto> getRepliesRecursively(Long parentId) {
        List<KomentarUsulanDto> replies = komentarUsulanRepository.findRepliesDtoByParentId(parentId);
        
        // For each reply, get its nested replies
        replies.forEach(reply -> {
            List<KomentarUsulanDto> nestedReplies = getRepliesRecursively(reply.getId());
            if (!nestedReplies.isEmpty()) {
                reply.setReplies(nestedReplies);
            }
        });
        
        return replies;
    }
    
    // Like a comment
    public KomentarUsulan likeComment(Long commentId, Long biografiId, String userName) {
        Optional<KomentarUsulan> komentarOpt = komentarUsulanRepository.findById(commentId);
        if (komentarOpt.isEmpty()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }
        
        KomentarUsulan komentar = komentarOpt.get();
        
        // Check if user already voted
        Optional<KomentarUsulanVote> existingVote = komentarUsulanVoteRepository.findByKomentarIdAndBiografiId(commentId, biografiId);
          if (existingVote.isPresent()) {
            KomentarUsulanVote vote = existingVote.get();
            if (vote.getVoteType() == KomentarUsulanVote.VoteType.LIKE) {
                // User already liked, remove the like (toggle)
                komentarUsulanVoteRepository.delete(vote);
            } else {
                // User had disliked, change to like
                vote.setVoteType(KomentarUsulanVote.VoteType.LIKE);
                vote.setUserName(userName);
                komentarUsulanVoteRepository.save(vote);
            }
        } else {
            // New vote
            KomentarUsulanVote newVote = new KomentarUsulanVote();
            newVote.setKomentar(komentar);
            newVote.setBiografiId(biografiId);
            newVote.setUserName(userName);
            newVote.setVoteType(KomentarUsulanVote.VoteType.LIKE);
            komentarUsulanVoteRepository.save(newVote);
        }
        
        // Update counters based on actual votes
        updateKomentarCounters(komentar);
        return komentarUsulanRepository.save(komentar);
    }
    
    // Dislike a comment
    public KomentarUsulan dislikeComment(Long commentId, Long biografiId, String userName) {
        Optional<KomentarUsulan> komentarOpt = komentarUsulanRepository.findById(commentId);
        if (komentarOpt.isEmpty()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }
        
        KomentarUsulan komentar = komentarOpt.get();
        
        // Check if user already voted
        Optional<KomentarUsulanVote> existingVote = komentarUsulanVoteRepository.findByKomentarIdAndBiografiId(commentId, biografiId);
        
        if (existingVote.isPresent()) {
            KomentarUsulanVote vote = existingVote.get();
            if (vote.getVoteType() == KomentarUsulanVote.VoteType.DISLIKE) {
                // User already disliked, remove the dislike (toggle)
                komentarUsulanVoteRepository.delete(vote);
            } else {
                // User had liked, change to dislike
                vote.setVoteType(KomentarUsulanVote.VoteType.DISLIKE);
                vote.setUserName(userName);
                komentarUsulanVoteRepository.save(vote);
            }
        } else {
            // New vote
            KomentarUsulanVote newVote = new KomentarUsulanVote();
            newVote.setKomentar(komentar);
            newVote.setBiografiId(biografiId);
            newVote.setUserName(userName);
            newVote.setVoteType(KomentarUsulanVote.VoteType.DISLIKE);
            komentarUsulanVoteRepository.save(newVote);
        }
        
        // Update counters based on actual votes
        updateKomentarCounters(komentar);
        return komentarUsulanRepository.save(komentar);
    }
    
    private void updateKomentarCounters(KomentarUsulan komentar) {
        long likes = komentarUsulanVoteRepository.countLikesByKomentarId(komentar.getId());
        long dislikes = komentarUsulanVoteRepository.countDislikesByKomentarId(komentar.getId());
        komentar.setLikes((int) likes);
        komentar.setDislikes((int) dislikes);
    }
    
    // Get comment count for usulan
    public long getCommentCount(Long usulanId) {
        return komentarUsulanRepository.countByUsulanId(usulanId);
    }
    
    // Manually move an usulan to pelaksanaan
    @Transactional
    public Pelaksanaan moveToPelaksanaan(Long usulanId) {
        Optional<Usulan> usulanOpt = usulanRepository.findById(usulanId);
        if (usulanOpt.isEmpty()) {
            throw new RuntimeException("Usulan tidak ditemukan");
        }
        
        Usulan usulan = usulanOpt.get();
        
        // Check if pelaksanaan already exists
        Optional<Pelaksanaan> existingPelaksanaan = pelaksanaanRepository.findByUsulanId(usulan.getId());
        if (existingPelaksanaan.isPresent()) {
            return existingPelaksanaan.get();
        }
        
        // Create new pelaksanaan
        Pelaksanaan pelaksanaan = new Pelaksanaan();
        pelaksanaan.setUsulan(usulan);
        pelaksanaan.setStatus(Pelaksanaan.StatusPelaksanaan.PENDING);
        Pelaksanaan savedPelaksanaan = pelaksanaanRepository.save(pelaksanaan);
        
        // Update usulan status
        usulan.setStatus(Usulan.StatusUsulan.DALAM_PELAKSANAAN);
        usulanRepository.save(usulan);
        
        return savedPelaksanaan;
    }
    
    // Update an existing usulan
    @Transactional
    public Usulan updateUsulan(Long usulanId, String judul, String rencanaKegiatan, 
                              LocalDate tanggalMulai, LocalDate tanggalSelesai, 
                              LocalDate durasiUsulan, MultipartFile gambar) {
        Optional<Usulan> usulanOpt = usulanRepository.findById(usulanId);
        if (usulanOpt.isEmpty()) {
            throw new RuntimeException("Usulan tidak ditemukan");
        }
        
        Usulan usulan = usulanOpt.get();
        
        try {
            // Update basic fields
            usulan.setJudul(judul);
            usulan.setRencanaKegiatan(rencanaKegiatan);
            usulan.setTanggalMulai(tanggalMulai);
            usulan.setTanggalSelesai(tanggalSelesai);
            usulan.setDurasiUsulan(durasiUsulan);
            
            // Handle image update
            if (gambar != null && !gambar.isEmpty()) {
                // Delete old image if exists
                if (usulan.getGambarUrl() != null) {
                    try {
                        imageService.deleteImage(usulan.getGambarUrl());
                    } catch (Exception e) {
                        log.warn("Could not delete old image: {}", e.getMessage());
                    }
                }
                
                // Save new image
                String filename = imageService.saveImage(gambar);
                String gambarUrl = imageService.getImageUrl(filename);
                usulan.setGambarUrl(gambarUrl);
            }
            
            return usulanRepository.save(usulan);
        } catch (Exception e) {
            log.error("Error updating usulan: {}", e.getMessage());
            throw new RuntimeException("Gagal mengupdate usulan: " + e.getMessage());
        }
    }
    
    // Scheduled task to move expired usulan to pelaksanaan
    @Scheduled(cron = "0 0 1 * * ?") // Run daily at 1 AM
    @Transactional
    public void processExpiredUsulan() {
        log.info("Processing expired usulan...");
        LocalDate currentDate = LocalDate.now();
        List<Usulan> expiredUsulan = usulanRepository.findExpiredUsulan(currentDate);
        
        for (Usulan usulan : expiredUsulan) {
            usulan.setStatus(Usulan.StatusUsulan.EXPIRED);
            usulanRepository.save(usulan);
            
            // Create pelaksanaan record
            Optional<Pelaksanaan> existingPelaksanaan = pelaksanaanRepository.findByUsulanId(usulan.getId());
            if (existingPelaksanaan.isEmpty()) {
                Pelaksanaan pelaksanaan = new Pelaksanaan();
                pelaksanaan.setUsulan(usulan);
                pelaksanaan.setStatus(Pelaksanaan.StatusPelaksanaan.PENDING);
                pelaksanaanRepository.save(pelaksanaan);
                
                usulan.setStatus(Usulan.StatusUsulan.DALAM_PELAKSANAAN);
                usulanRepository.save(usulan);
            }
        }
        
        log.info("Processed {} expired usulan", expiredUsulan.size());
    }
      // Get active usulan as DTO - preferred method to avoid lazy loading
    public Page<UsulanSummaryDto> getActiveUsulanSummary(int page, int size, String search, String judul, 
                                                        String namaPengusul, String status, 
                                                        LocalDate tanggalMulaiFrom, LocalDate tanggalMulaiTo,
                                                        LocalDate tanggalSelesaiFrom, LocalDate tanggalSelesaiTo,
                                                        String sortBy, String sortDirection) {
        // Use the existing entity method and transform to DTO
        Page<Usulan> usulanPage = getActiveUsulan(page, size, search, judul, namaPengusul, status,
                tanggalMulaiFrom, tanggalMulaiTo, tanggalSelesaiFrom, tanggalSelesaiTo,
                sortBy, sortDirection);
        
        // Transform to DTO to avoid lazy loading
        return usulanPage.map(UsulanSummaryDto::new);
    }
}
