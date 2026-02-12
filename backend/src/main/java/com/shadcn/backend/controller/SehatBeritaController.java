package com.shadcn.backend.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.shadcn.backend.dto.InfoPostRequest;
import com.shadcn.backend.model.Berita;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.service.SehatBeritaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/sehat/berita")
@RequiredArgsConstructor
public class SehatBeritaController {
    
    private final SehatBeritaService sehatBeritaService;
    private final UserRepository userRepository;
    
    @PostMapping
    public ResponseEntity<Berita> createPost(
        @Valid @RequestBody InfoPostRequest request,
        Authentication authentication
    ) {
        String username = (authentication != null) ? authentication.getName() : "admin";
        User user = userRepository.findByUsername(username)
            .orElse(userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Tidak ada user di database")));
        
        Berita berita = sehatBeritaService.createPost(user, request);
        return ResponseEntity.ok(berita);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Berita> updatePost(
        @PathVariable Long id,
        @Valid @RequestBody InfoPostRequest request
    ) {
        Berita berita = sehatBeritaService.updatePost(id, request);
        return ResponseEntity.ok(berita);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Berita> getPost(@PathVariable Long id) {
        Berita berita = sehatBeritaService.getPost(id);
        return ResponseEntity.ok(berita);
    }
    
    @GetMapping
    public ResponseEntity<Page<Berita>> getAllPosts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Page<Berita> posts = sehatBeritaService.getAllPosts(page, size);
        return ResponseEntity.ok(posts);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        sehatBeritaService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
