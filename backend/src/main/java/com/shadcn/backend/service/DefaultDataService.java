package com.shadcn.backend.service;

import com.shadcn.backend.model.Role;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.RoleRepository;
import com.shadcn.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DefaultDataService implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    @Transactional
    public void run(String... args) throws Exception {
        try {
            createDefaultRoles();
            createDefaultAdmin();
        } catch (Exception e) {
            // Log error but don't fail the application startup
            System.err.println("Warning: Could not initialize default data - " + e.getMessage());
        }
    }
    
    private void createDefaultRoles() {
        try {
            // Create ADMIN role if not exists
            if (!roleRepository.existsByName("ADMIN")) {
                Role adminRole = new Role();
                adminRole.setName("ADMIN");
                adminRole.setDescription("Administrator role with full access");
                roleRepository.save(adminRole);
                System.out.println("Created ADMIN role");
            }
            
            // Create MODERATOR role if not exists
            if (!roleRepository.existsByName("MODERATOR")) {
                Role moderatorRole = new Role();
                moderatorRole.setName("MODERATOR");
                moderatorRole.setDescription("Moderator role for content management");
                roleRepository.save(moderatorRole);
                System.out.println("Created MODERATOR role");
            }
            
            // Create USER role if not exists
            if (!roleRepository.existsByName("USER")) {
                Role userRole = new Role();
                userRole.setName("USER");
                userRole.setDescription("Regular user role");
                roleRepository.save(userRole);
                System.out.println("Created USER role");
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not create default roles - " + e.getMessage());
        }
    }
    
    private void createDefaultAdmin() {
        try {
            if (!userRepository.existsByUsername("admin")) {
                Role adminRole = roleRepository.findByName("ADMIN").orElse(null);
                if (adminRole != null) {
                    User admin = User.builder()
                        .username("admin")
                        .email("admin@camoca.com")
                        .fullName("Administrator")
                        .password(passwordEncoder.encode("admin123"))
                        .phoneNumber("08123456789")
                        .role(adminRole)
                        .status(User.UserStatus.ACTIVE)
                        .build();
                    
                    userRepository.save(admin);
                    System.out.println("Created default admin user (username: admin, password: admin123)");
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not create default admin - " + e.getMessage());
        }
    }
}