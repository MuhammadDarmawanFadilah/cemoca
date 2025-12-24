package com.shadcn.backend.service;

import com.shadcn.backend.dto.RegistrationRequest;
import com.shadcn.backend.dto.UserRequest;
import com.shadcn.backend.exception.DuplicateResourceException;
import com.shadcn.backend.exception.ValidationException;
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
import java.util.LinkedHashSet;
import java.util.Set;
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
        String ownerName = request.getOwnerName() != null ? request.getOwnerName().trim() : null;
        String companyName = request.getCompanyName() != null ? request.getCompanyName().trim() : null;
        String phoneNumber = request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null;
        String agencyRange = request.getAgencyRange() != null ? request.getAgencyRange().trim() : null;
        String reasonToUse = request.getReasonToUse() != null ? request.getReasonToUse().trim() : null;

        if (username == null || username.isBlank()) {
            throw new ValidationException("Username is required");
        }
        if (email == null || email.isBlank()) {
            throw new ValidationException("Email is required");
        }
        if (ownerName == null || ownerName.isBlank()) {
            throw new ValidationException("Owner name is required");
        }
        if (companyName == null || companyName.isBlank()) {
            throw new ValidationException("Company name is required");
        }
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new ValidationException("Phone number is required");
        }
        if (agencyRange == null || agencyRange.isBlank()) {
            throw new ValidationException("Agency range is required");
        }
        if (reasonToUse == null || reasonToUse.isBlank()) {
            throw new ValidationException("Reason is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new ValidationException("Password is required");
        }

        String companyCode = generateCompanyCode(companyName, username);
        String resolvedCompanyName = companyName;

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new DuplicateResourceException("Username already exists");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("Email already exists");
        }
        Set<String> phoneCandidates = buildPhoneCandidates(phoneNumber);
        if (!phoneCandidates.isEmpty() && userRepository.existsByPhoneNumberIn(phoneCandidates)) {
            throw new DuplicateResourceException("Phone number already exists");
        }

        Role userRole = roleRepository.findByName("USER")
            .orElseGet(() -> roleRepository.findByName("MODERATOR")
                .orElseThrow(() -> new RuntimeException("Role USER not found")));

        User user = User.builder()
            .username(username)
            .email(email)
            .fullName(ownerName)
            .phoneNumber(phoneNumber)
            .password(passwordEncoder.encode(request.getPassword()))
            .role(userRole)
            .status(User.UserStatus.ACTIVE)
            .companyName(resolvedCompanyName)
            .companyCode(companyCode)
            .ownerName(ownerName)
            .agencyRange(agencyRange)
            .reasonToUse(reasonToUse)
            .build();

        log.info("Before save - ownerName: {}, companyName: {}, companyCode: {}, agencyRange: {}, reasonToUse: {}", 
                user.getOwnerName(), user.getCompanyName(), user.getCompanyCode(), user.getAgencyRange(), user.getReasonToUse());
        
        User savedUser = userRepository.save(user);
        
        log.info("After save - ownerName: {}, companyName: {}, companyCode: {}, agencyRange: {}, reasonToUse: {}", 
                savedUser.getOwnerName(), savedUser.getCompanyName(), savedUser.getCompanyCode(), savedUser.getAgencyRange(), savedUser.getReasonToUse());
        
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

    private Set<String> buildPhoneCandidates(String rawPhone) {
        Set<String> candidates = new LinkedHashSet<>();
        if (rawPhone == null) {
            return candidates;
        }

        String trimmed = rawPhone.trim();
        if (!trimmed.isBlank()) {
            candidates.add(trimmed);
        }

        String digits = trimmed.replaceAll("\\D", "");
        if (!digits.isBlank()) {
            candidates.add(digits);
            if (digits.startsWith("0") && digits.length() > 1) {
                candidates.add("62" + digits.substring(1));
                candidates.add("+62" + digits.substring(1));
            }
            if (digits.startsWith("62") && digits.length() > 2) {
                candidates.add("0" + digits.substring(2));
                candidates.add("+" + digits);
            }
        }

        // Keep only reasonably short/long values
        candidates.removeIf(v -> v == null || v.isBlank() || v.length() > 25);
        return candidates;
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
        if (username == null) {
            return false;
        }
        String value = username.trim();
        if (value.isBlank()) {
            return false;
        }
        return userRepository.existsByUsernameIgnoreCase(value);
    }

    public boolean existsByEmail(String email) {
        if (email == null) {
            return false;
        }
        String value = email.trim();
        if (value.isBlank()) {
            return false;
        }
        return userRepository.existsByEmailIgnoreCase(value);
    }

    public boolean existsByPhoneNumber(String phoneNumber) {
        Set<String> candidates = buildPhoneCandidates(phoneNumber);
        if (candidates.isEmpty()) {
            return false;
        }
        return userRepository.existsByPhoneNumberIn(candidates);
    }

    public Page<User> getAllUsersPaginated(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public long countUsers() {
        return userRepository.count();
    }
}
