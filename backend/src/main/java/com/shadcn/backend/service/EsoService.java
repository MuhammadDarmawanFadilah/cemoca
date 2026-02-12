package com.shadcn.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shadcn.backend.dto.InfoPostRequest;
import com.shadcn.backend.model.Eso;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.EsoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EsoService {
    
    private final EsoRepository esoRepository;
    
    @Transactional
    public Eso createPost(User author, InfoPostRequest request) {
        Eso eso = Eso.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .mediaPath(request.getMediaPath())
            .mediaType(request.getMediaType())
            .author(author)
            .build();
        
        return esoRepository.save(eso);
    }
    
    @Transactional
    public Eso updatePost(Long id, InfoPostRequest request) {
        Eso eso = esoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ESO tidak ditemukan"));
        
        eso.setTitle(request.getTitle());
        eso.setDescription(request.getDescription());
        
        if (request.getMediaPath() != null) {
            eso.setMediaPath(request.getMediaPath());
            eso.setMediaType(request.getMediaType());
        }
        
        return esoRepository.save(eso);
    }
    
    public Eso getPost(Long id) {
        return esoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ESO tidak ditemukan"));
    }
    
    public Page<Eso> getAllPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return esoRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    @Transactional
    public void deletePost(Long id) {
        Eso eso = esoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ESO tidak ditemukan"));
        esoRepository.delete(eso);
    }
}
