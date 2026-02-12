package com.shadcn.backend.scheduler;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.shadcn.backend.model.User;
import com.shadcn.backend.service.IntakeHistoryService;
import com.shadcn.backend.service.NotificationService;
import com.shadcn.backend.service.PatientService;
import com. shadcn.backend.service.ReminderHistoryService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MedicationReminderScheduler {
    
    private static final Logger logger = LoggerFactory.getLogger(MedicationReminderScheduler.class);
    
    private final PatientService patientService;
    private final IntakeHistoryService intakeHistoryService;
    private final ReminderHistoryService reminderHistoryService;
    private final NotificationService notificationService;
    
    @Scheduled(cron = "0 */15 * * * *")
    public void checkMedicationReminders() {
        logger.info("Checking medication reminders...");
        
        LocalTime now = LocalTime.now();
        LocalDate today = LocalDate.now();
        
        List<User> patients = patientService.getAllPatientsList();
        
        for (User patient : patients) {
            try {
                if (patient.getMedicationTime() == null) {
                    continue;
                }
                
                LocalTime medicationTime = patient.getMedicationTime();
                LocalTime twoHoursAfter = medicationTime.plusHours(2);
                
                if (now.isBefore(medicationTime) || now.isAfter(twoHoursAfter)) {
                    continue;
                }
                
                boolean hasIntake = intakeHistoryService.hasIntakeToday(patient.getId());
                
                if (!hasIntake) {
                    sendReminderNotification(patient, today);
                } else {
                    reminderHistoryService.markAsCompleted(patient.getId(), today);
                }
                
            } catch (Exception e) {
                logger.error("Error checking reminder for patient {}: {}", patient.getId(), e.getMessage());
            }
        }
    }
    
    @Scheduled(cron = "0 0 23 * * *")
    public void expireOldReminders() {
        logger.info("Expiring old reminders...");
        
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<User> patients = patientService.getAllPatientsList();
        
        for (User patient : patients) {
            try {
                boolean hasIntake = intakeHistoryService.hasIntakeToday(patient.getId());
                
                if (!hasIntake) {
                    reminderHistoryService.markAsExpired(patient.getId(), yesterday);
                }
            } catch (Exception e) {
                logger.error("Error expiring reminder for patient {}: {}", patient.getId(), e.getMessage());
            }
        }
    }
    
    private void sendReminderNotification(User patient, LocalDate reminderDate) {
        try {
            String message = String.format(
                "Halo %s, jangan lupa untuk minum obat Anda pada jam %s. Silakan rekam video minum obat melalui aplikasi Sehat Bersama.",
                patient.getFullName(),
                patient.getMedicationTime().toString()
            );
            
            notificationService.sendTextMessage(
                patient.getPhoneNumber(),
                message
            );
            
            reminderHistoryService.createReminderHistory(patient, reminderDate, message);
            
            logger.info("Reminder sent to patient {} ({})", patient.getFullName(), patient.getPhoneNumber());
            
        } catch (Exception e) {
            logger.error("Error sending reminder to patient {}: {}", patient.getId(), e.getMessage());
        }
    }
}
