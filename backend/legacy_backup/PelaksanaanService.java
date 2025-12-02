package com.shadcn.backend.service;

import com.shadcn.backend.model.*;
import com.shadcn.backend.repository.*;
import com.shadcn.backend.dto.ParticipantSummaryDto;
import com.shadcn.backend.dto.AlumniKehadiranFullDto;
import com.shadcn.backend.dto.AlumniKehadiranDto;
import com.shadcn.backend.dto.KomentarPelaksanaanDto;
import com.shadcn.backend.dto.DokumentasiSummaryDto;
import com.shadcn.backend.dto.DokumentasiDetailDto;
import com.shadcn.backend.dto.PelaksanaanDetailDto;
import com.shadcn.backend.dto.PelaksanaanFullDto;
import com.shadcn.backend.dto.PelaksanaanSummaryDto;
import com.shadcn.backend.dto.KomentarPelaksanaanDto;
import com.shadcn.backend.dto.PesertaPelaksanaanDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.ArrayList;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PelaksanaanService {    private final PelaksanaanRepository pelaksanaanRepository;
    private final DokumentasiPelaksanaanRepository dokumentasiRepository;
    private final KomentarPelaksanaanRepository komentarRepository;
    private final KomentarPelaksanaanVoteRepository komentarPelaksanaanVoteRepository;
    private final UsulanRepository usulanRepository;
    private final AlumniKehadiranRepository alumniKehadiranRepository;
    private final BiografiRepository biografiRepository;
    private final ImageService imageService;// Get all pelaksanaan with pagination and advanced filtering
    public Page<Pelaksanaan> getAllPelaksanaan(int page, int size, String judul,
                                              String namaPengusul, String status,
                                              LocalDate tanggalSelesaiFrom, LocalDate tanggalSelesaiTo,
                                              String sortBy, String sortDirection) {
        Pageable pageable = PageRequest.of(page, size);
          return pelaksanaanRepository.searchPelaksanaanWithFilters(
            judul, namaPengusul, status,
            tanggalSelesaiFrom, tanggalSelesaiTo,
            sortBy, sortDirection, pageable
        );
    }
    
    // Backward compatibility method
    public Page<Pelaksanaan> getAllPelaksanaan(int page, int size) {
        return getAllPelaksanaan(page, size, null, null, null, null, null, "createdAt", "desc");
    }
    
    // Get pelaksanaan by status
    public Page<Pelaksanaan> getPelaksanaanByStatus(Pelaksanaan.StatusPelaksanaan status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return pelaksanaanRepository.findByStatusOrderByUpdatedAtDesc(status, pageable);
    }    // Get pelaksanaan by id - optimized to avoid N+1 queries
    public Optional<Pelaksanaan> getPelaksanaanById(Long id) {
        return pelaksanaanRepository.findByIdWithUsulan(id);
    }
    
    // Get pelaksanaan full DTO to avoid circular references and StackOverflow
    public Optional<PelaksanaanFullDto> getPelaksanaanFullById(Long id) {
        return pelaksanaanRepository.findByIdWithUsulan(id)
                .map(PelaksanaanFullDto::new);
    }
    
    // Get pelaksanaan detail efficiently without loading comments 
    public Optional<PelaksanaanDetailDto> getPelaksanaanDetailById(Long id) {
        return pelaksanaanRepository.findPelaksanaanDetailById(id);
    }
    
    // Get pelaksanaan by usulan id
    public Optional<Pelaksanaan> getPelaksanaanByUsulanId(Long usulanId) {
        return pelaksanaanRepository.findByUsulanId(usulanId);
    }
    
    // Get pelaksanaan detail by usulan id - returns DTO to avoid lazy loading
    public Optional<PelaksanaanDetailDto> getPelaksanaanDetailByUsulanId(Long usulanId) {
        return pelaksanaanRepository.findByUsulanId(usulanId)
                .flatMap(pelaksanaan -> pelaksanaanRepository.findPelaksanaanDetailById(pelaksanaan.getId()));
    }
    
    // Update pelaksanaan status
    @Transactional
    public Pelaksanaan updateStatus(Long id, Pelaksanaan.StatusPelaksanaan status, String catatan) {
        Optional<Pelaksanaan> pelaksanaanOpt = pelaksanaanRepository.findById(id);
        if (pelaksanaanOpt.isEmpty()) {
            throw new RuntimeException("Pelaksanaan tidak ditemukan");
        }
        
        Pelaksanaan pelaksanaan = pelaksanaanOpt.get();
        pelaksanaan.setStatus(status);
        if (catatan != null) {
            pelaksanaan.setCatatan(catatan);
        }
        
        // Update usulan status
        Usulan usulan = pelaksanaan.getUsulan();
        if (status == Pelaksanaan.StatusPelaksanaan.SUKSES || status == Pelaksanaan.StatusPelaksanaan.GAGAL) {
            usulan.setStatus(Usulan.StatusUsulan.SELESAI);
            usulanRepository.save(usulan);
        }
        
        return pelaksanaanRepository.save(pelaksanaan);
    }
      // Update pelaksanaan
    @Transactional
    public Pelaksanaan updatePelaksanaan(Long id, String judulKegiatan, String deskripsi,
                                        String lokasiPelaksanaan, LocalDate tanggalMulai,
                                        LocalDate tanggalSelesai, String jumlahPeserta,
                                        String targetPeserta, String catatanPelaksanaan,
                                        MultipartFile foto) {
        Optional<Pelaksanaan> pelaksanaanOpt = pelaksanaanRepository.findById(id);
        if (pelaksanaanOpt.isEmpty()) {
            throw new RuntimeException("Pelaksanaan tidak ditemukan");
        }
        
        Pelaksanaan pelaksanaan = pelaksanaanOpt.get();
        Usulan usulan = pelaksanaan.getUsulan();
        
        // Update fields in Usulan if provided
        if (judulKegiatan != null && !judulKegiatan.trim().isEmpty()) {
            usulan.setJudul(judulKegiatan);
        }
        if (deskripsi != null) {
            usulan.setRencanaKegiatan(deskripsi);
        }
        if (tanggalMulai != null) {
            usulan.setTanggalMulai(tanggalMulai);
        }
        if (tanggalSelesai != null) {
            usulan.setTanggalSelesai(tanggalSelesai);
        }
        
        // Handle foto upload if provided
        if (foto != null && !foto.isEmpty()) {
            try {
                String fotoUrl = imageService.saveImage(foto);
                usulan.setGambarUrl(fotoUrl);
            } catch (Exception e) {
                log.error("Error uploading foto: {}", e.getMessage());
                throw new RuntimeException("Gagal mengupload foto: " + e.getMessage());
            }
        }
        
        // Update catatan in Pelaksanaan if provided
        if (catatanPelaksanaan != null) {
            pelaksanaan.setCatatan(catatanPelaksanaan);
        }
        
        // Save both entities
        usulanRepository.save(usulan);
        return pelaksanaanRepository.save(pelaksanaan);
    }
    
    // Add dokumentasi (foto kegiatan)
    @Transactional
    public DokumentasiPelaksanaan addDokumentasi(Long pelaksanaanId, String judul, String deskripsi, 
                                                String namaUploader, String emailUploader, MultipartFile foto) {
        Optional<Pelaksanaan> pelaksanaanOpt = pelaksanaanRepository.findById(pelaksanaanId);
        if (pelaksanaanOpt.isEmpty()) {
            throw new RuntimeException("Pelaksanaan tidak ditemukan");
        }
        
        try {
            DokumentasiPelaksanaan dokumentasi = new DokumentasiPelaksanaan();
            dokumentasi.setPelaksanaan(pelaksanaanOpt.get());
            dokumentasi.setJudul(judul);
            dokumentasi.setDeskripsi(deskripsi);
            dokumentasi.setNamaUploader(namaUploader);
            dokumentasi.setEmailUploader(emailUploader);
              // Upload foto if provided
            if (foto != null && !foto.isEmpty()) {
                String filename = imageService.saveImage(foto);
                String fotoUrl = imageService.getImageUrl(filename);
                dokumentasi.setFotoUrl(fotoUrl);
            }
            
            return dokumentasiRepository.save(dokumentasi);
        } catch (Exception e) {
            log.error("Error adding dokumentasi: {}", e.getMessage());
            throw new RuntimeException("Gagal menambah dokumentasi: " + e.getMessage());
        }
    }
      // Get dokumentasi by pelaksanaan id (efficient - summary only)
    public List<DokumentasiSummaryDto> getDokumentasiSummary(Long pelaksanaanId) {
        return dokumentasiRepository.findDokumentasiSummaryByPelaksanaanId(pelaksanaanId);
    }
    
    // Get dokumentasi by pelaksanaan id (full objects when needed)
    public List<DokumentasiPelaksanaan> getDokumentasi(Long pelaksanaanId) {
        return dokumentasiRepository.findByPelaksanaanIdOrderByCreatedAtDesc(pelaksanaanId);
    }
    
    // Get dokumentasi detail DTO by pelaksanaan id - preferred method
    public List<DokumentasiDetailDto> getDokumentasiDetail(Long pelaksanaanId) {
        return dokumentasiRepository.findByPelaksanaanIdOrderByCreatedAtDesc(pelaksanaanId)
                .stream()
                .map(DokumentasiDetailDto::new)
                .collect(Collectors.toList());
    }
    
    // Delete dokumentasi
    @Transactional
    public void deleteDokumentasi(Long dokumentasiId) {
        Optional<DokumentasiPelaksanaan> dokumentasiOpt = dokumentasiRepository.findById(dokumentasiId);
        if (dokumentasiOpt.isEmpty()) {
            throw new RuntimeException("Dokumentasi tidak ditemukan");
        }
        
        DokumentasiPelaksanaan dokumentasi = dokumentasiOpt.get();
        
        // Delete image file if exists
        if (dokumentasi.getFotoUrl() != null) {
            try {
                imageService.deleteImage(dokumentasi.getFotoUrl());
            } catch (Exception e) {
                log.warn("Could not delete image file: {}", e.getMessage());
            }
        }
        
        dokumentasiRepository.delete(dokumentasi);
    }
    
    // Add comment to pelaksanaan
    @Transactional
    public KomentarPelaksanaan addComment(Long pelaksanaanId, KomentarPelaksanaan komentar) {
        Optional<Pelaksanaan> pelaksanaanOpt = pelaksanaanRepository.findById(pelaksanaanId);
        if (pelaksanaanOpt.isEmpty()) {
            throw new RuntimeException("Pelaksanaan tidak ditemukan");
        }
        
        komentar.setPelaksanaan(pelaksanaanOpt.get());
        return komentarRepository.save(komentar);
    }
    
    // Reply to comment
    @Transactional
    public KomentarPelaksanaan replyToComment(Long parentId, KomentarPelaksanaan reply) {
        Optional<KomentarPelaksanaan> parentOpt = komentarRepository.findById(parentId);
        if (parentOpt.isEmpty()) {
            throw new RuntimeException("Komentar parent tidak ditemukan");
        }
        
        KomentarPelaksanaan parent = parentOpt.get();
        reply.setPelaksanaan(parent.getPelaksanaan());
        reply.setParentKomentar(parent);
        return komentarRepository.save(reply);
    }
      // Get comments for pelaksanaan
    public Page<KomentarPelaksanaan> getComments(Long pelaksanaanId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return komentarRepository.findByPelaksanaanIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(pelaksanaanId, pageable);
    }
      // Get comments as DTOs to avoid lazy loading issues
    public Page<KomentarPelaksanaanDto> getCommentsDto(Long pelaksanaanId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<KomentarPelaksanaanDto> parentComments = komentarRepository.findParentCommentsDtoByPelaksanaanId(pelaksanaanId, pageable);
        
        // For each parent comment, fetch its replies recursively
        parentComments.getContent().forEach(comment -> {
            List<KomentarPelaksanaanDto> replies = getRepliesRecursively(comment.getId());
            comment.setReplies(replies);
        });
        
        return parentComments;
    }
    
    // Recursively fetch replies and their nested replies
    private List<KomentarPelaksanaanDto> getRepliesRecursively(Long parentId) {
        List<KomentarPelaksanaanDto> replies = komentarRepository.findRepliesDtoByParentId(parentId);
        
        // For each reply, get its nested replies
        replies.forEach(reply -> {
            List<KomentarPelaksanaanDto> nestedReplies = getRepliesRecursively(reply.getId());
            if (!nestedReplies.isEmpty()) {
                reply.setReplies(nestedReplies);
            }
        });
        
        return replies;
    }
    
    // Alumni Kehadiran Methods
      // Save alumni participants for a pelaksanaan
    @Transactional
    public List<AlumniKehadiran> saveAlumniPeserta(Long pelaksanaanId, List<AlumniKehadiran> alumniPeserta) {
        Optional<Pelaksanaan> pelaksanaanOpt = pelaksanaanRepository.findById(pelaksanaanId);
        if (pelaksanaanOpt.isEmpty()) {
            throw new RuntimeException("Pelaksanaan tidak ditemukan");
        }
        
        Pelaksanaan pelaksanaan = pelaksanaanOpt.get();
        
        // Clear existing alumni peserta
        alumniKehadiranRepository.deleteByPelaksanaanId(pelaksanaanId);
        
        // Batch fetch biografi IDs to avoid N+1 queries
        List<Long> biografiIds = alumniPeserta.stream()
                .map(alumni -> alumni.getBiografi().getBiografiId())
                .toList();
        
        List<Biografi> biografiList = biografiRepository.findAllById(biografiIds);
        Map<Long, Biografi> biografiMap = biografiList.stream()
                .collect(Collectors.toMap(Biografi::getBiografiId, Function.identity()));
        
        // Prepare batch insert list
        List<AlumniKehadiran> validAlumniPeserta = new ArrayList<>();
        
        for (AlumniKehadiran alumni : alumniPeserta) {
            Long biografiId = alumni.getBiografi().getBiografiId();
            Biografi biografi = biografiMap.get(biografiId);
            
            if (biografi != null) {
                alumni.setPelaksanaan(pelaksanaan);
                alumni.setBiografi(biografi);
                validAlumniPeserta.add(alumni);
            } else {
                log.warn("Biografi with ID {} not found, skipping", biografiId);
            }
        }
        
        // Batch save all valid alumni peserta
        List<AlumniKehadiran> savedList = alumniKehadiranRepository.saveAll(validAlumniPeserta);
        
        log.info("Saved {} alumni peserta for pelaksanaan {}", savedList.size(), pelaksanaanId);
        
        return savedList;
    }
      // Get alumni participants for a pelaksanaan (efficient - only name and attendance)
    public List<ParticipantSummaryDto> getAlumniPesertaSummary(Long pelaksanaanId) {
        return alumniKehadiranRepository.findParticipantSummaryByPelaksanaanId(pelaksanaanId);
    }
    
    // Get alumni participants for a pelaksanaan (full objects when needed)
    public List<AlumniKehadiran> getAlumniPeserta(Long pelaksanaanId) {
        return alumniKehadiranRepository.findByPelaksanaanId(pelaksanaanId);
    }
    
    // Get alumni participants for a pelaksanaan (full DTO without lazy loading issues)
    public List<AlumniKehadiranFullDto> getAlumniPesertaFull(Long pelaksanaanId) {
        return alumniKehadiranRepository.findFullParticipantsByPelaksanaanId(pelaksanaanId);
    }
    
    // Get alumni participants sebagai DTO (solusi proper untuk lazy loading)
    public List<AlumniKehadiranDto> getAlumniPesertaDto(Long pelaksanaanId) {
        return alumniKehadiranRepository.findParticipantsWithoutLazyLoading(pelaksanaanId);
    }
      // Update alumni attendance status
    @Transactional
    public AlumniKehadiran updateAlumniKehadiran(Long pelaksanaanId, Long biografiId, Boolean hadir, String catatan) {
        Optional<AlumniKehadiran> existingOpt = alumniKehadiranRepository.findByPelaksanaanIdAndBiografiBiografiId(pelaksanaanId, biografiId);
        
        if (existingOpt.isPresent()) {
            AlumniKehadiran existing = existingOpt.get();
            existing.setHadir(hadir);
            existing.setCatatan(catatan);
            return alumniKehadiranRepository.save(existing);
        } else {
            // Create new entry
            Optional<Pelaksanaan> pelaksanaanOpt = pelaksanaanRepository.findById(pelaksanaanId);
            Optional<Biografi> biografiOpt = biografiRepository.findById(biografiId);
            
            if (pelaksanaanOpt.isPresent() && biografiOpt.isPresent()) {
                AlumniKehadiran newEntry = new AlumniKehadiran();
                newEntry.setPelaksanaan(pelaksanaanOpt.get());
                newEntry.setBiografi(biografiOpt.get());
                newEntry.setHadir(hadir);
                newEntry.setCatatan(catatan);
                return alumniKehadiranRepository.save(newEntry);
            } else {
                throw new RuntimeException("Pelaksanaan atau Biografi tidak ditemukan");
            }
        }
    }
      // OPTIMIZED method to avoid N+1 queries - returns summary DTOs instead of full entities
    public Page<PelaksanaanSummaryDto> getAllPelaksanaanSummary(int page, int size, String judul,
                                                               String namaPengusul, String status,
                                                               LocalDate tanggalSelesaiFrom, LocalDate tanggalSelesaiTo,
                                                               String sortBy, String sortDirection) {
        Pageable pageable = PageRequest.of(page, size);
        return pelaksanaanRepository.searchPelaksanaanSummaryWithFilters(
            judul, namaPengusul, status,
            tanggalSelesaiFrom, tanggalSelesaiTo,
            sortBy, sortDirection, pageable
        );
    }    
    // Get alumni participants with nested biografi structure for frontend
    public List<PesertaPelaksanaanDto> getPesertaPelaksanaanNested(Long pelaksanaanId) {
        List<AlumniKehadiranFullDto> fullDtos = alumniKehadiranRepository.findFullParticipantsByPelaksanaanId(pelaksanaanId);
        
        return fullDtos.stream()
                .map(dto -> {
                    PesertaPelaksanaanDto.BiografiNestedDto biografi = new PesertaPelaksanaanDto.BiografiNestedDto(
                        dto.getBiografiId(),
                        dto.getNamaLengkap(),
                        dto.getNim(),
                        dto.getAlumniTahun(),
                        dto.getEmail(),
                        dto.getNomorTelepon(),
                        dto.getFoto(),
                        dto.getJenisKelamin(),
                        dto.getAlamat(),
                        null // pekerjaanSaatIni not available in current DTO
                    );
                    
                    return new PesertaPelaksanaanDto(
                        dto.getId(),
                        dto.getHadir(),
                        dto.getCatatan(),
                        dto.getCreatedAt(),
                        dto.getUpdatedAt(),
                        biografi
                    );
                })
                .collect(java.util.stream.Collectors.toList());
    }    // Like a comment
    public KomentarPelaksanaan likeComment(Long commentId, Long biografiId, String userName) {
        Optional<KomentarPelaksanaan> komentarOpt = komentarRepository.findById(commentId);
        if (komentarOpt.isEmpty()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }
        
        KomentarPelaksanaan komentar = komentarOpt.get();
        
        // Check if user already voted
        Optional<KomentarPelaksanaanVote> existingVote = komentarPelaksanaanVoteRepository.findByKomentarIdAndBiografiId(commentId, biografiId);
          if (existingVote.isPresent()) {
            KomentarPelaksanaanVote vote = existingVote.get();
            if (vote.getVoteType() == KomentarPelaksanaanVote.VoteType.LIKE) {
                // User already liked, remove the like (toggle)
                komentarPelaksanaanVoteRepository.delete(vote);
            } else {
                // User had disliked, change to like
                vote.setVoteType(KomentarPelaksanaanVote.VoteType.LIKE);
                vote.setUserName(userName);
                komentarPelaksanaanVoteRepository.save(vote);
            }
        } else {
            // New vote
            KomentarPelaksanaanVote newVote = new KomentarPelaksanaanVote();
            newVote.setKomentar(komentar);
            newVote.setBiografiId(biografiId);
            newVote.setUserName(userName);
            newVote.setVoteType(KomentarPelaksanaanVote.VoteType.LIKE);
            komentarPelaksanaanVoteRepository.save(newVote);
        }
        
        // Update counters based on actual votes
        updateKomentarCounters(komentar);
        return komentarRepository.save(komentar);
    }
    
    // Dislike a comment
    public KomentarPelaksanaan dislikeComment(Long commentId, Long biografiId, String userName) {
        Optional<KomentarPelaksanaan> komentarOpt = komentarRepository.findById(commentId);
        if (komentarOpt.isEmpty()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }
        
        KomentarPelaksanaan komentar = komentarOpt.get();
        
        // Check if user already voted
        Optional<KomentarPelaksanaanVote> existingVote = komentarPelaksanaanVoteRepository.findByKomentarIdAndBiografiId(commentId, biografiId);
        
        if (existingVote.isPresent()) {
            KomentarPelaksanaanVote vote = existingVote.get();
            if (vote.getVoteType() == KomentarPelaksanaanVote.VoteType.DISLIKE) {
                // User already disliked, remove the dislike (toggle)
                komentarPelaksanaanVoteRepository.delete(vote);
            } else {
                // User had liked, change to dislike
                vote.setVoteType(KomentarPelaksanaanVote.VoteType.DISLIKE);
                vote.setUserName(userName);
                komentarPelaksanaanVoteRepository.save(vote);
            }
        } else {
            // New vote
            KomentarPelaksanaanVote newVote = new KomentarPelaksanaanVote();
            newVote.setKomentar(komentar);
            newVote.setBiografiId(biografiId);
            newVote.setUserName(userName);
            newVote.setVoteType(KomentarPelaksanaanVote.VoteType.DISLIKE);
            komentarPelaksanaanVoteRepository.save(newVote);
        }
        
        // Update counters based on actual votes
        updateKomentarCounters(komentar);
        return komentarRepository.save(komentar);
    }
    
    private void updateKomentarCounters(KomentarPelaksanaan komentar) {
        long likes = komentarPelaksanaanVoteRepository.countLikesByKomentarId(komentar.getId());
        long dislikes = komentarPelaksanaanVoteRepository.countDislikesByKomentarId(komentar.getId());
        komentar.setLikes((int) likes);
        komentar.setDislikes((int) dislikes);
    }
}
