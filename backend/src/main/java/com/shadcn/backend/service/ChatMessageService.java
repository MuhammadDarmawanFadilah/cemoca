package com.shadcn.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shadcn.backend.dto.ChatMessageRequest;
import com.shadcn.backend.model.ChatMessage;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.ChatMessageRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatMessageService {
    
    private final ChatMessageRepository chatMessageRepository;
    
    @Transactional
    public ChatMessage sendMessage(User user, ChatMessageRequest request) {
        ChatMessage chatMessage = ChatMessage.builder()
            .user(user)
            .message(request.getMessage())
            .mediaPath(request.getMediaPath())
            .build();
        
        return chatMessageRepository.save(chatMessage);
    }
    
    public Page<ChatMessage> getAllMessages(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    public ChatMessage getMessage(Long id) {
        return chatMessageRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pesan tidak ditemukan"));
    }
}
