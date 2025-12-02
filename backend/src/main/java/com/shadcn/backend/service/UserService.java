package com.shadcn.backend.service;

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

    public Page<User> getAllUsersPaginated(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public long countUsers() {
        return userRepository.count();
    }
}
