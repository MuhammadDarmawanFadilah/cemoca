package com.shadcn.backend.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.shadcn.backend.dto.PatientRegistrationRequest;
import com.shadcn.backend.dto.PatientUpdateRequest;
import com.shadcn.backend.model.User;
import com.shadcn.backend.service.PatientService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {
    
    private final PatientService patientService;
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> registerPatient(@Valid @RequestBody PatientRegistrationRequest request) {
        User patient = patientService.registerPatient(request);
        return ResponseEntity.ok(patient);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updatePatient(@PathVariable Long id, @Valid @RequestBody PatientUpdateRequest request) {
        User patient = patientService.updatePatient(id, request);
        return ResponseEntity.ok(patient);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getPatient(@PathVariable Long id) {
        User patient = patientService.getPatient(id);
        return ResponseEntity.ok(patient);
    }
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<User>> getAllPatients(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Page<User> patients = patientService.getAllPatients(page, size);
        return ResponseEntity.ok(patients);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }
}
