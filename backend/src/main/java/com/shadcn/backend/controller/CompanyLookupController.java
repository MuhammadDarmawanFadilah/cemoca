package com.shadcn.backend.controller;

import com.shadcn.backend.dto.CompanyNameResponse;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/company-lookup")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class CompanyLookupController {

    private final UserRepository userRepository;

    @GetMapping("/company-name")
    public ResponseEntity<CompanyNameResponse> getCompanyName(@RequestParam String companyCode) {
        String code = companyCode == null ? null : companyCode.trim();
        if (code == null || code.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        return userRepository.findTopByCompanyCodeIgnoreCase(code)
                .map(u -> u.getCompanyName() == null ? "" : u.getCompanyName().trim())
                .filter(name -> !name.isEmpty())
                .map(name -> ResponseEntity.ok(new CompanyNameResponse(name)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
