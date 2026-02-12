package com.shadcn.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shadcn.backend.dto.InfoPostRequest;
import com.shadcn.backend.model.Berita;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.BeritaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SehatBeritaService {
    
    private final BeritaRepository beritaRepository;
    
    @Transactional
    public Berita createPost(User author, InfoPostRequest request) {
        Berita berita = new Berita();
        berita.setJudul(request.getTitle());
        berita.setRingkasan(request.getDescription());
        berita.setKonten(request.getDescription());
        berita.setPenulis(author.getFullName());
        
        // Handle media based on type
        if (request.getMediaPath() != null && !request.getMediaPath().isEmpty()) {
            if ("video".equalsIgnoreCase(request.getMediaType())) {
                // Store video as JSON array in mediaLampiran
                berita.setMediaLampiran("[\"" + request.getMediaPath() + "\"]");
            } else {
                // Store image in gambarUrl
                berita.setGambarUrl(request.getMediaPath());
            }
        }
        
        berita.setStatus(Berita.StatusBerita.PUBLISHED);
        
        return beritaRepository.save(berita);
    }
    
    @Transactional
    public Berita updatePost(Long id, InfoPostRequest request) {
        Berita berita = beritaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Berita tidak ditemukan"));
        
        berita.setJudul(request.getTitle());
        berita.setRingkasan(request.getDescription());
        berita.setKonten(request.getDescription());
        
        if (request.getMediaPath() != null && !request.getMediaPath().isEmpty()) {
            if ("video".equalsIgnoreCase(request.getMediaType())) {
                // Store video as JSON array in mediaLampiran
                berita.setMediaLampiran("[\"" + request.getMediaPath() + "\"]");
                berita.setGambarUrl(null);
            } else {
                // Store image in gambarUrl
                berita.setGambarUrl(request.getMediaPath());
                berita.setMediaLampiran(null);
            }
        }
        
        return beritaRepository.save(berita);
    }
    
    public Berita getPost(Long id) {
        return beritaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Berita tidak ditemukan"));
    }
    
    public Page<Berita> getAllPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return beritaRepository.findByStatusOrderByCreatedAtDesc(Berita.StatusBerita.PUBLISHED, pageable);
    }
    
    @Transactional
    public void deletePost(Long id) {
        Berita berita = beritaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Berita tidak ditemukan"));
        beritaRepository.delete(berita);
    }
}
