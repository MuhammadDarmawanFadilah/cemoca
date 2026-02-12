package com.shadcn.backend.config;

import com.shadcn.backend.model.Role;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.RoleRepository;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Data loader untuk membuat admin default saat aplikasi pertama kali dijalankan
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminDataLoader implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${app.admin.fullname:Administrator Sistem}")
    private String adminFullname;

    @Value("${app.admin.phone:08123456789}")
    private String adminPhone;

    @Override
    public void run(String... args) {
        try {
            log.info("Starting Admin Data Loader...");

            // 1. Create or get ADMIN role
            Role adminRole = createOrGetAdminRole();

            // 2. Create or get PASIEN role (for patients/users)
            Role pasienRole = createOrGetPasienRole();

            // 3. Create default admin user if not exists
            createDefaultAdminUser(adminRole);

            log.info("Admin Data Loader completed successfully");
        } catch (Exception e) {
            log.error("Error in Admin Data Loader", e);
        }
    }

    private Role createOrGetAdminRole() {
        return roleRepository.findByRoleName("ADMIN")
            .orElseGet(() -> {
                log.info("Creating ADMIN role...");
                Role role = new Role();
                role.setName("ADMIN");
                role.setDescription("Administrator dengan akses penuh ke sistem");
                role.setCreatedAt(LocalDateTime.now());
                role.setUpdatedAt(LocalDateTime.now());
                Role savedRole = roleRepository.save(role);
                log.info("ADMIN role created with ID: {}", savedRole.getId());
                return savedRole;
            });
    }

    private Role createOrGetPasienRole() {
        return roleRepository.findByRoleName("PASIEN")
            .orElseGet(() -> {
                log.info("Creating PASIEN role...");
                Role role = new Role();
                role.setName("PASIEN");
                role.setDescription("Pasien dengan akses terbatas");
                role.setCreatedAt(LocalDateTime.now());
                role.setUpdatedAt(LocalDateTime.now());
                Role savedRole = roleRepository.save(role);
                log.info("PASIEN role created with ID: {}", savedRole.getId());
                return savedRole;
            });
    }

    private void createDefaultAdminUser(Role adminRole) {
        if (userRepository.existsByUsername(adminUsername)) {
            log.info("Admin user '{}' already exists, skipping creation", adminUsername);
            return;
        }

        log.info("Creating default admin user: {}", adminUsername);

        User admin = User.builder()
            .username(adminUsername)
            .email(adminEmail)
            .fullName(adminFullname)
            .password(passwordEncoder.encode(adminPassword))
            .phoneNumber(adminPhone)
            .role(adminRole)
            .status(User.UserStatus.ACTIVE)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        User savedAdmin = userRepository.save(admin);
        log.info("Default admin user created successfully with ID: {}", savedAdmin.getId());
        log.info("Username: {}", adminUsername);
        log.info("Password: {} (please change after first login)", adminPassword);
    }
}
