package com.shadcn.backend.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shadcn.backend.dto.PatientRegistrationRequest;
import com.shadcn.backend.dto.PatientUpdateRequest;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.RoleRepository;
import com.shadcn.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PatientService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Transactional
    public User registerPatient(PatientRegistrationRequest request) {
        Role userRole = roleRepository.findByRoleName("PASIEN")
            .orElseThrow(() -> new RuntimeException("Role PASIEN tidak ditemukan"));
        
        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .fullName(request.getFullName())
            .password(passwordEncoder.encode(request.getPassword()))
            .phoneNumber(request.getPhoneNumber())
            .age(request.getAge())
            .medicationTime(request.getMedicationTime())
            .photoPath(request.getPhotoPath())
            .role(userRole)
            .status(User.UserStatus.ACTIVE)
            .build();
        
        return userRepository.save(user);
    }
    
    @Transactional
    public User updatePatient(Long id, PatientUpdateRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pasien tidak ditemukan"));
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getAge() != null) {
            user.setAge(request.getAge());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getMedicationTime() != null) {
            user.setMedicationTime(request.getMedicationTime());
        }
        if (request.getPhotoPath() != null) {
            user.setPhotoPath(request.getPhotoPath());
        }
        
        return userRepository.save(user);
    }
    
    public User getPatient(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pasien tidak ditemukan"));
    }
    
    public Page<User> getAllPatients(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return userRepository.findByRole_RoleName("PASIEN", pageable);
    }
    
    public List<User> getAllPatientsList() {
        return userRepository.findByRole_RoleName("PASIEN");
    }
    
    @Transactional
    public void deletePatient(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pasien tidak ditemukan"));
        userRepository.delete(user);
    }
}
