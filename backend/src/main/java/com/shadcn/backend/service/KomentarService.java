package com.shadcn.backend.service;

import com.shadcn.backend.dto.KomentarRequest;
import com.shadcn.backend.dto.KomentarBeritaDto;
import com.shadcn.backend.model.KomentarBerita;
import com.shadcn.backend.model.Berita;
import com.shadcn.backend.repository.KomentarBeritaRepository;
import com.shadcn.backend.repository.BeritaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class KomentarService {

    @Autowired
    private KomentarBeritaRepository komentarRepository;

    @Autowired
    private BeritaRepository beritaRepository;

    public KomentarBerita tambahKomentar(KomentarRequest request) {
        Optional<Berita> beritaOpt = beritaRepository.findById(request.getBeritaId());
        if (!beritaOpt.isPresent()) {
            throw new RuntimeException("Berita tidak ditemukan");
        }        KomentarBerita komentar = new KomentarBerita();
        komentar.setBerita(beritaOpt.get());
        komentar.setNamaPengguna(request.getNamaPengguna());
        komentar.setBiografiId(request.getBiografiId());
        komentar.setKonten(request.getKonten());
        komentar.setTanggalKomentar(LocalDateTime.now());

        // Jika ada parent komentar (reply)
        if (request.getParentKomentarId() != null) {
            Optional<KomentarBerita> parentOpt = komentarRepository.findById(request.getParentKomentarId());
            if (parentOpt.isPresent()) {
                komentar.setParentKomentar(parentOpt.get());
            }
        }

        return komentarRepository.save(komentar);
    }

    public List<KomentarBerita> getKomentarByBerita(Long beritaId) {
        return komentarRepository.findByBeritaIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(beritaId);
    }

    public Page<KomentarBerita> getKomentarByBeritaPaginated(Long beritaId, Pageable pageable) {
        return komentarRepository.findByBeritaIdAndParentKomentarIsNull(beritaId, pageable);
    }
    
    // Get comments as DTOs to avoid lazy loading issues
    public Page<KomentarBeritaDto> getKomentarByBeritaPaginatedDto(Long beritaId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<KomentarBeritaDto> parentComments = komentarRepository.findParentCommentsDtoByBeritaId(beritaId, pageable);
        
        // For each parent comment, fetch its replies recursively
        parentComments.getContent().forEach(comment -> {
            List<KomentarBeritaDto> replies = getRepliesRecursively(comment.getId());
            comment.setReplies(replies);
        });
        
        return parentComments;
    }
    
    // Recursively fetch replies and their nested replies
    private List<KomentarBeritaDto> getRepliesRecursively(Long parentId) {
        List<KomentarBeritaDto> replies = komentarRepository.findRepliesDtoByParentId(parentId);
        
        // For each reply, get its nested replies
        replies.forEach(reply -> {
            List<KomentarBeritaDto> nestedReplies = getRepliesRecursively(reply.getId());
            if (!nestedReplies.isEmpty()) {
                reply.setReplies(nestedReplies);
            }
        });
        
        return replies;
    }

    public List<KomentarBerita> getBalasanKomentar(Long parentKomentarId) {
        return komentarRepository.findByParentKomentarIdOrderByTanggalKomentarAsc(parentKomentarId);
    }

    public void hapusKomentar(Long komentarId) {
        // Hapus semua balasan terlebih dahulu
        List<KomentarBerita> balasan = komentarRepository.findByParentKomentarIdOrderByTanggalKomentarAsc(komentarId);
        for (KomentarBerita balas : balasan) {
            komentarRepository.delete(balas);
        }
        
        // Hapus komentar utama
        komentarRepository.deleteById(komentarId);
    }

    public KomentarBerita updateKomentar(Long komentarId, String kontenBaru) {
        Optional<KomentarBerita> komentarOpt = komentarRepository.findById(komentarId);
        if (!komentarOpt.isPresent()) {
            throw new RuntimeException("Komentar tidak ditemukan");
        }

        KomentarBerita komentar = komentarOpt.get();
        komentar.setKonten(kontenBaru);
        komentar.setTanggalKomentar(LocalDateTime.now()); // Update timestamp

        return komentarRepository.save(komentar);
    }

    public long hitungTotalKomentar(Long beritaId) {
        return komentarRepository.countByBeritaId(beritaId);
    }

    public KomentarBerita getKomentarById(Long komentarId) {
        return komentarRepository.findById(komentarId)
            .orElseThrow(() -> new RuntimeException("Komentar tidak ditemukan"));
    }
}
