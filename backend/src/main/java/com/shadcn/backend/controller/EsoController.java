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
import com.shadcn.backend.model.Eso;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.service.EsoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/sehat/eso")
@RequiredArgsConstructor
public class EsoController {
    
    private final EsoService esoService;
    private final UserRepository userRepository;
    
    @PostMapping
    public ResponseEntity<Eso> createPost(
        @Valid @RequestBody InfoPostRequest request,
        Authentication authentication
    ) {
        String username = (authentication != null) ? authentication.getName() : "admin";
        User user = userRepository.findByUsername(username)
            .orElse(userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Tidak ada user di database")));
        
        Eso eso = esoService.createPost(user, request);
        return ResponseEntity.ok(eso);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Eso> updatePost(
        @PathVariable Long id,
        @Valid @RequestBody InfoPostRequest request
    ) {
        Eso eso = esoService.updatePost(id, request);
        return ResponseEntity.ok(eso);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Eso> getPost(@PathVariable Long id) {
        Eso eso = esoService.getPost(id);
        return ResponseEntity.ok(eso);
    }
    
    @GetMapping
    public ResponseEntity<Page<Eso>> getAllPosts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Page<Eso> posts = esoService.getAllPosts(page, size);
        return ResponseEntity.ok(posts);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        esoService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
