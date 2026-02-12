package com.shadcn.backend.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shadcn.backend.dto.DailyStatusResponse;
import com.shadcn.backend.dto.IntakeHistoryRequest;
import com.shadcn.backend.dto.PatientStatus;
import com.shadcn.backend.model.IntakeHistory;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.IntakeHistoryRepository;
import com.shadcn.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IntakeHistoryService {
    
    private final IntakeHistoryRepository intakeHistoryRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public IntakeHistory createIntakeHistory(IntakeHistoryRequest request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
        
        boolean exists = intakeHistoryRepository.existsByUserIdAndIntakeDate(
            request.getUserId(), 
            request.getIntakeDate()
        );
        
        if (exists) {
            throw new RuntimeException("Anda sudah mencatat minum obat hari ini");
        }
        
        IntakeHistory intakeHistory = IntakeHistory.builder()
            .user(user)
            .intakeDate(request.getIntakeDate())
            .intakeTime(request.getIntakeTime())
            .videoPath(request.getVideoPath())
            .build();
        
        return intakeHistoryRepository.save(intakeHistory);
    }
    
    public IntakeHistory getIntakeHistory(Long id) {
        return intakeHistoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Histori tidak ditemukan"));
    }
    
    public Page<IntakeHistory> getAllIntakeHistory(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return intakeHistoryRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    public List<IntakeHistory> getIntakeHistoryByUser(Long userId) {
        return intakeHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public boolean hasIntakeToday(Long userId) {
        LocalDate today = LocalDate.now();
        return intakeHistoryRepository.existsByUserIdAndIntakeDate(userId, today);
    }
    
    public IntakeHistory getTodayIntake(Long userId) {
        LocalDate today = LocalDate.now();
        return intakeHistoryRepository.findByUserIdAndIntakeDate(userId, today)
            .orElse(null);
    }
    
    public List<IntakeHistory> getIntakeHistoryByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return intakeHistoryRepository.findByUserIdAndDateRange(userId, startDate, endDate);
    }
    
    @Transactional
    public IntakeHistory replaceTodayIntake(IntakeHistoryRequest request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
        
        LocalDate today = LocalDate.now();
        // Delete existing today's record
        intakeHistoryRepository.findByUserIdAndIntakeDate(request.getUserId(), today)
            .ifPresent(existing -> intakeHistoryRepository.delete(existing));
        
        IntakeHistory intakeHistory = IntakeHistory.builder()
            .user(user)
            .intakeDate(request.getIntakeDate())
            .intakeTime(request.getIntakeTime())
            .videoPath(request.getVideoPath())
            .build();
        
        return intakeHistoryRepository.save(intakeHistory);
    }
    
    public boolean canTakeIntakeNow(User user) {
        LocalTime now = LocalTime.now();
        LocalTime medicationTime = user.getMedicationTime();
        
        if (medicationTime == null) {
            return false;
        }
        
        return !now.isBefore(medicationTime);
    }
    
    public DailyStatusResponse getDailyStatus(LocalDate date) {
        // Get all PASIEN users
        List<User> patients = userRepository.findByRole_RoleName("PASIEN");
        
        List<PatientStatus> patientStatuses = new ArrayList<>();
        int sudahMinum = 0;
        int belumMinum = 0;
        int terlambat = 0;
        int sudahTerlambat = 0;
        
        for (User patient : patients) {
            Optional<IntakeHistory> intakeOpt = intakeHistoryRepository
                .findByUserIdAndIntakeDate(patient.getId(), date);
            
            PatientStatus status = PatientStatus.builder()
                .userId(patient.getId())
                .fullName(patient.getFullName())
                .phoneNumber(patient.getPhoneNumber())
                .photoPath(patient.getPhotoPath())
                .medicationTime(patient.getMedicationTime())
                .late(false)
                .build();
            
            if (intakeOpt.isPresent()) {
                IntakeHistory intake = intakeOpt.get();
                status.setIntakeId(intake.getId());
                status.setIntakeDate(intake.getIntakeDate());
                status.setIntakeTime(intake.getIntakeTime());
                status.setVideoPath(intake.getVideoPath());
                
                // Check if terlambat (taken after medication time)
                boolean isLate = patient.getMedicationTime() != null && 
                    intake.getIntakeTime().isAfter(patient.getMedicationTime());
                
                status.setLate(isLate);
                
                if (isLate) {
                    status.setStatus("TERLAMBAT");
                    terlambat++;
                    sudahTerlambat++;
                } else {
                    status.setStatus("SUDAH");
                    sudahMinum++;
                }
            } else {
                status.setStatus("BELUM");
                belumMinum++;
            }
            
            patientStatuses.add(status);
        }
        
        return DailyStatusResponse.builder()
            .date(date)
            .totalPatients(patients.size())
            .sudah(sudahMinum)
            .belum(belumMinum)
            .terlambat(terlambat)
            .sudahTerlambat(sudahTerlambat)
            .patients(patientStatuses)
            .build();
    }
}
