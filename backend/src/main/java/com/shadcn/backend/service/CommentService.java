package com.shadcn.backend.service;

import com.shadcn.backend.dto.CommentRequest;
import com.shadcn.backend.dto.CommentResponse;
import com.shadcn.backend.model.KomentarBerita;
import com.shadcn.backend.model.KomentarBeritaVote;
import com.shadcn.backend.model.Berita;
import com.shadcn.backend.repository.KomentarBeritaRepository;
import com.shadcn.backend.repository.KomentarBeritaVoteRepository;
import com.shadcn.backend.repository.BeritaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CommentService {    @Autowired
    private KomentarBeritaRepository komentarRepository;

    @Autowired
    private KomentarBeritaVoteRepository voteRepository;

    @Autowired
    private BeritaRepository beritaRepository;    public CommentResponse createComment(CommentRequest request) {
        // Validate beritaId is provided for new comments (not replies)
        if (request.getBeritaId() == null) {
            throw new RuntimeException("Berita ID tidak boleh kosong untuk komentar baru");
        }
        
        Optional<Berita> beritaOpt = beritaRepository.findById(request.getBeritaId());
        if (!beritaOpt.isPresent()) {
            throw new RuntimeException("Berita tidak ditemukan");
        }

        // Validate foto field - should only contain filename, not path
        String foto = request.getFoto();
        if (foto != null && !foto.trim().isEmpty()) {
            // Check if foto contains path separators (/, \) or protocol (http, https)
            if (foto.contains("/") || foto.contains("\\") || foto.startsWith("http")) {
                throw new RuntimeException("Field foto hanya boleh berisi nama file, bukan path atau URL");
            }
        }        KomentarBerita komentar = new KomentarBerita();
        komentar.setBerita(beritaOpt.get());
        komentar.setNamaPengguna(request.getNama());
        komentar.setBiografiId(request.getBiografiId());
        komentar.setKonten(request.getKonten());
        komentar.setFotoPengguna(foto); // Set foto pengguna
        komentar.setTanggalKomentar(LocalDateTime.now());
        komentar.setUpdatedAt(LocalDateTime.now());
        komentar.setLikes(0);
        komentar.setDislikes(0);

        // If this is a reply
        if (request.getParentId() != null) {
            Optional<KomentarBerita> parentOpt = komentarRepository.findById(request.getParentId());
            if (parentOpt.isPresent()) {
                komentar.setParentKomentar(parentOpt.get());
            }
        }

        KomentarBerita savedKomentar = komentarRepository.save(komentar);
        return convertToResponse(savedKomentar);
    }

    public List<CommentResponse> getCommentsByBerita(Long beritaId) {
        List<KomentarBerita> comments = komentarRepository.findByBeritaIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(beritaId);
        return comments.stream()
                .map(this::convertToResponseWithReplies)
                .collect(Collectors.toList());
    }

    public Page<CommentResponse> getCommentsByBeritaPaginated(Long beritaId, Pageable pageable) {
        Page<KomentarBerita> commentsPage = komentarRepository.findByBeritaIdAndParentKomentarIsNull(beritaId, pageable);
        return commentsPage.map(this::convertToResponseWithReplies);
    }    public CommentResponse likeComment(Long commentId, Long biografiId, String userName) {
        Optional<KomentarBerita> komentarOpt = komentarRepository.findById(commentId);
        if (!komentarOpt.isPresent()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }

        KomentarBerita komentar = komentarOpt.get();
        
        // Check if user already voted
        Optional<KomentarBeritaVote> existingVote = voteRepository.findByKomentarIdAndBiografiId(commentId, biografiId);
          if (existingVote.isPresent()) {
            KomentarBeritaVote vote = existingVote.get();
            if (vote.getVoteType() == KomentarBeritaVote.VoteType.LIKE) {
                // User already liked, remove the like (toggle)
                voteRepository.delete(vote);
            } else {
                // User had disliked, change to like
                vote.setVoteType(KomentarBeritaVote.VoteType.LIKE);
                vote.setUserName(userName);
                voteRepository.save(vote);
            }
        } else {
            // New vote
            KomentarBeritaVote newVote = new KomentarBeritaVote();
            newVote.setKomentar(komentar);
            newVote.setBiografiId(biografiId);
            newVote.setUserName(userName);
            newVote.setVoteType(KomentarBeritaVote.VoteType.LIKE);
            voteRepository.save(newVote);
        }
        
        // Update counters based on actual votes
        updateCommentCounters(komentar);
        komentar.setUpdatedAt(LocalDateTime.now());
        KomentarBerita savedKomentar = komentarRepository.save(komentar);
        return convertToResponse(savedKomentar);
    }

    public CommentResponse dislikeComment(Long commentId, Long biografiId, String userName) {
        Optional<KomentarBerita> komentarOpt = komentarRepository.findById(commentId);
        if (!komentarOpt.isPresent()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }

        KomentarBerita komentar = komentarOpt.get();
        
        // Check if user already voted
        Optional<KomentarBeritaVote> existingVote = voteRepository.findByKomentarIdAndBiografiId(commentId, biografiId);
        
        if (existingVote.isPresent()) {
            KomentarBeritaVote vote = existingVote.get();
            if (vote.getVoteType() == KomentarBeritaVote.VoteType.DISLIKE) {
                // User already disliked, remove the dislike (toggle)
                voteRepository.delete(vote);
            } else {
                // User had liked, change to dislike
                vote.setVoteType(KomentarBeritaVote.VoteType.DISLIKE);
                vote.setUserName(userName);
                voteRepository.save(vote);
            }        } else {
            // New vote
            KomentarBeritaVote newVote = new KomentarBeritaVote();
            newVote.setKomentar(komentar);
            newVote.setBiografiId(biografiId);
            newVote.setUserName(userName);
            newVote.setVoteType(KomentarBeritaVote.VoteType.DISLIKE);
            voteRepository.save(newVote);
        }
        
        // Update counters based on actual votes
        updateCommentCounters(komentar);
        komentar.setUpdatedAt(LocalDateTime.now());
        KomentarBerita savedKomentar = komentarRepository.save(komentar);
        return convertToResponse(savedKomentar);
    }
    
    private void updateCommentCounters(KomentarBerita komentar) {
        long likes = voteRepository.countLikesByKomentarId(komentar.getId());
        long dislikes = voteRepository.countDislikesByKomentarId(komentar.getId());
        komentar.setLikes((int) likes);
        komentar.setDislikes((int) dislikes);
    }

    public CommentResponse replyToComment(Long commentId, CommentRequest request) {
        Optional<KomentarBerita> parentOpt = komentarRepository.findById(commentId);
        if (!parentOpt.isPresent()) {
            throw new RuntimeException("Komentar parent tidak ditemukan");
        }

        KomentarBerita parentKomentar = parentOpt.get();        // Create reply request with parent ID
        CommentRequest replyRequest = new CommentRequest();
        replyRequest.setBeritaId(parentKomentar.getBerita().getId());
        replyRequest.setNama(request.getNama());
        replyRequest.setBiografiId(request.getBiografiId());
        replyRequest.setKonten(request.getKonten());
        replyRequest.setFoto(request.getFoto()); // Set foto pengguna untuk balasan
        replyRequest.setParentId(commentId);

        return createComment(replyRequest);
    }

    public List<CommentResponse> getCommentReplies(Long commentId) {
        List<KomentarBerita> replies = komentarRepository.findByParentKomentarIdOrderByTanggalKomentarAsc(commentId);
        return replies.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public long getCommentCount(Long beritaId) {
        return komentarRepository.countByBeritaId(beritaId);
    }

    public CommentResponse updateComment(Long commentId, String newContent) {
        Optional<KomentarBerita> komentarOpt = komentarRepository.findById(commentId);
        if (!komentarOpt.isPresent()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }

        KomentarBerita komentar = komentarOpt.get();
        komentar.setKonten(newContent);
        komentar.setUpdatedAt(LocalDateTime.now());
        
        KomentarBerita savedKomentar = komentarRepository.save(komentar);
        return convertToResponse(savedKomentar);
    }

    public void deleteComment(Long commentId) {
        Optional<KomentarBerita> komentarOpt = komentarRepository.findById(commentId);
        if (!komentarOpt.isPresent()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }

        komentarRepository.deleteById(commentId);
    }

    public CommentResponse getCommentById(Long commentId) {
        Optional<KomentarBerita> komentarOpt = komentarRepository.findById(commentId);
        if (!komentarOpt.isPresent()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }

        return convertToResponse(komentarOpt.get());
    }    private CommentResponse convertToResponse(KomentarBerita komentar) {
        CommentResponse response = new CommentResponse();
        response.setId(komentar.getId());
        response.setBeritaId(komentar.getBerita().getId());
        response.setBiografiId(komentar.getBiografiId());
        response.setNama(komentar.getNamaPengguna());
        response.setKonten(komentar.getKonten());
        response.setFoto(komentar.getFotoPengguna()); // Set foto pengguna
        response.setParentId(komentar.getParentKomentar() != null ? komentar.getParentKomentar().getId() : null);
        response.setLikes(komentar.getLikes());
        response.setDislikes(komentar.getDislikes());
        response.setCreatedAt(komentar.getTanggalKomentar());
        response.setUpdatedAt(komentar.getUpdatedAt());
        
        return response;
    }private CommentResponse convertToResponseWithReplies(KomentarBerita komentar) {
        CommentResponse response = convertToResponse(komentar);
        
        // Load replies recursively
        List<KomentarBerita> replies = komentarRepository.findByParentKomentarIdOrderByTanggalKomentarAsc(komentar.getId());
        List<CommentResponse> replyResponses = replies.stream()
                .map(this::convertToResponseWithReplies) // Recursive call to load nested replies
                .collect(Collectors.toList());
        
        response.setReplies(replyResponses);
        
        return response;
    }
}
