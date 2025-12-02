package com.shadcn.backend.test;

import com.shadcn.backend.repository.BirthdayNotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class BirthdayNotificationTest {
    
    @Autowired
    private BirthdayNotificationRepository birthdayNotificationRepository;
    
    public void testRepository() {
        // This is just to test if repository can be injected
        System.out.println("Repository loaded: " + birthdayNotificationRepository != null);
    }
}
