package com.shadcn.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shadcn.backend.model.ReminderHistory;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.ReminderHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReminderHistoryService {
    
    private final ReminderHistoryRepository reminderHistoryRepository;
    
    @Transactional
    public ReminderHistory createReminderHistory(User user, LocalDate reminderDate, String message) {
        ReminderHistory reminderHistory = reminderHistoryRepository.findByUserIdAndReminderDate(user.getId(), reminderDate)
            .orElse(ReminderHistory.builder()
                .user(user)
                .reminderDate(reminderDate)
                .reminderCount(0)
                .status(ReminderHistory.ReminderStatus.PENDING)
                .build());
        
        reminderHistory.setReminderCount(reminderHistory.getReminderCount() + 1);
        reminderHistory.setLastReminderAt(LocalDateTime.now());
        reminderHistory.setMessage(message);
        reminderHistory.setStatus(ReminderHistory.ReminderStatus.SENT);
        
        return reminderHistoryRepository.save(reminderHistory);
    }
    
    @Transactional
    public void markAsCompleted(Long userId, LocalDate reminderDate) {
        reminderHistoryRepository.findByUserIdAndReminderDate(userId, reminderDate)
            .ifPresent(rh -> {
                rh.setStatus(ReminderHistory.ReminderStatus.COMPLETED);
                reminderHistoryRepository.save(rh);
            });
    }
    
    @Transactional
    public void markAsExpired(Long userId, LocalDate reminderDate) {
        reminderHistoryRepository.findByUserIdAndReminderDate(userId, reminderDate)
            .ifPresent(rh -> {
                rh.setStatus(ReminderHistory.ReminderStatus.EXPIRED);
                reminderHistoryRepository.save(rh);
            });
    }
    
    public Page<ReminderHistory> getAllReminderHistory(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reminderHistoryRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    public List<ReminderHistory> getReminderHistoryByUser(Long userId) {
        return reminderHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public List<ReminderHistory> getPendingRemindersForToday() {
        LocalDate today = LocalDate.now();
        return reminderHistoryRepository.findByReminderDateAndStatus(today, ReminderHistory.ReminderStatus.PENDING);
    }
}
