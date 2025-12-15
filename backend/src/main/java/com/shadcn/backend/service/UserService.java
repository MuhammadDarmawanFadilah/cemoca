package com.shadcn.backend.service;

import com.shadcn.backend.dto.RegistrationRequest;
import com.shadcn.backend.dto.UserRequest;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.RoleRepository;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User createUser(UserRequest userRequest) {
        log.info("Creating user with username: {}", userRequest.getUsername());
        
        // Validate password for creation
        if (userRequest.getPassword() == null || userRequest.getPassword().trim().isEmpty()) {
            throw new RuntimeException("Password is required for new user creation");
        }
        
        // Check if username or email already exists
        if (existsByUsername(userRequest.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (existsByEmail(userRequest.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Find role
        Role role = roleRepository.findById(userRequest.getRoleId())
            .orElseThrow(() -> new RuntimeException("Role not found with id: " + userRequest.getRoleId()));
        
        // Create user
        User user = User.builder()
            .username(userRequest.getUsername())
            .fullName(userRequest.getFullName())
            .email(userRequest.getEmail())
            .phoneNumber(userRequest.getPhoneNumber())
            .password(passwordEncoder.encode(userRequest.getPassword()))
            .role(role)
            .alamat(userRequest.getAlamat())
            .provinsi(userRequest.getProvinsi())
            .kota(userRequest.getKota())
            .kecamatan(userRequest.getKecamatan())
            .kelurahan(userRequest.getKelurahan())
            .kodePos(userRequest.getKodePos())
            .latitude(userRequest.getLatitude())
            .longitude(userRequest.getLongitude())
            .build();
        
        User savedUser = userRepository.save(user);
        log.info("User created successfully: {}", savedUser.getUsername());
        return savedUser;
    }

    public User registerUser(RegistrationRequest request) {
        log.info("Public registration for username: {}", request.getUsername());

        String username = request.getUsername() != null ? request.getUsername().trim() : null;
        String email = request.getEmail() != null ? request.getEmail().trim() : null;
        String companyName = request.getCompanyName() != null ? request.getCompanyName().trim() : null;
        String phoneNumber = request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null;
        String agencyRange = request.getAgencyRange() != null ? request.getAgencyRange().trim() : null;
        String reasonToUse = request.getReasonToUse() != null ? request.getReasonToUse().trim() : null;

        if (username == null || username.isBlank()) {
            throw new RuntimeException("Username is required");
        }
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }
        if (companyName == null || companyName.isBlank()) {
            throw new RuntimeException("Company name is required");
        }
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new RuntimeException("Phone number is required");
        }
        if (agencyRange == null || agencyRange.isBlank()) {
            throw new RuntimeException("Agency range is required");
        }
        if (reasonToUse == null || reasonToUse.isBlank()) {
            throw new RuntimeException("Reason is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        if (existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        if (existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new RuntimeException("Phone number already exists");
        }

        Role userRole = roleRepository.findByName("USER")
            .orElseGet(() -> roleRepository.findByName("MODERATOR")
                .orElseThrow(() -> new RuntimeException("Role USER not found")));

        String companyCode = generateCompanyCode(companyName, username);

        User user = User.builder()
            .username(username)
            .email(email)
            .fullName(companyName)
            .phoneNumber(phoneNumber)
            .password(passwordEncoder.encode(request.getPassword()))
            .role(userRole)
            .status(User.UserStatus.ACTIVE)
            .companyName(companyName)
            .companyCode(companyCode)
            .agencyRange(agencyRange)
            .reasonToUse(reasonToUse)
            .build();

        User savedUser = userRepository.save(user);
        log.info("Public registration successful for username: {}", savedUser.getUsername());
        return savedUser;
    }

    private String generateCompanyCode(String companyName, String username) {
        String base = (companyName != null && !companyName.isBlank()) ? companyName : username;
        if (base == null) {
            base = "COMPANY";
        }

        String normalized = base.trim().toUpperCase(Locale.ROOT)
            .replaceAll("[^A-Z0-9]", "");
        if (normalized.isBlank()) {
            normalized = "COMPANY";
        }
        if (normalized.length() > 8) {
            normalized = normalized.substring(0, 8);
        }

        for (int i = 0; i < 10; i++) {
            String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
            String code = normalized + suffix;
            if (!userRepository.existsByCompanyCode(code)) {
                return code;
            }
        }

        return normalized + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT);
    }

    public User updateUser(Long id, UserRequest userRequest) {
        log.info("Updating user with ID: {}", id);
        
        // Find existing user
        User existingUser = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        log.info("Found existing user: {}", existingUser.getUsername());
        
        // Check if username or email already exists (but not for this user)
        if (!existingUser.getUsername().equals(userRequest.getUsername()) && existsByUsername(userRequest.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (!existingUser.getEmail().equals(userRequest.getEmail()) && existsByEmail(userRequest.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Update fields
        existingUser.setUsername(userRequest.getUsername());
        existingUser.setFullName(userRequest.getFullName());
        existingUser.setEmail(userRequest.getEmail());
        existingUser.setPhoneNumber(userRequest.getPhoneNumber());
        
        // Only update password if provided and not empty
        if (userRequest.getPassword() != null && !userRequest.getPassword().trim().isEmpty()) {
            log.info("Updating password for user: {}", existingUser.getUsername());
            existingUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }
        
        // Update role if provided
        if (userRequest.getRoleId() != null) {
            Role role = roleRepository.findById(userRequest.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + userRequest.getRoleId()));
            existingUser.setRole(role);
        }
        
        // Update address fields
        existingUser.setAlamat(userRequest.getAlamat());
        existingUser.setProvinsi(userRequest.getProvinsi());
        existingUser.setKota(userRequest.getKota());
        existingUser.setKecamatan(userRequest.getKecamatan());
        existingUser.setKelurahan(userRequest.getKelurahan());
        existingUser.setKodePos(userRequest.getKodePos());
        existingUser.setLatitude(userRequest.getLatitude());
        existingUser.setLongitude(userRequest.getLongitude());
        
        User savedUser = userRepository.save(existingUser);
        log.info("User updated successfully: {}", savedUser.getUsername());
        return savedUser;
    }

    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByPhoneNumber(String phoneNumber) {
        return userRepository.existsByPhoneNumber(phoneNumber);
    }

    public Page<User> getAllUsersPaginated(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public long countUsers() {
        return userRepository.count();
    }
}
