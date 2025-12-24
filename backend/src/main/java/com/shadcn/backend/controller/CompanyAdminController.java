package com.shadcn.backend.controller;

import com.shadcn.backend.dto.CompanySummaryResponse;
import com.shadcn.backend.dto.InvitationRequest;
import com.shadcn.backend.dto.UpdateCompanyStatusRequest;
import com.shadcn.backend.repository.MasterAgencyAgentRepository;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.InvitationService;
import com.shadcn.backend.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/companies")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class CompanyAdminController {

    private final UserRepository userRepository;
    private final MasterAgencyAgentRepository masterAgencyAgentRepository;
    private final InvitationService invitationService;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    private User requireAdmin(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new IllegalArgumentException("No valid token provided");
        }

        String actualToken = token.substring(7);
        User user = authService.getUserFromToken(actualToken);
        if (user == null) {
            throw new IllegalArgumentException("Invalid token");
        }
        if (!user.isAdmin()) {
            throw new SecurityException("Forbidden");
        }
        return user;
    }

    @GetMapping
    public ResponseEntity<?> listCompanies(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            requireAdmin(token);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }

        List<Object[]> rows = userRepository.findCompanySummaries();

        Map<String, CompanySummaryResponse> byCode = new LinkedHashMap<>();
        for (Object[] r : rows) {
            String code = r[0] == null ? null : r[0].toString();
            if (code == null || code.isBlank()) continue;

            String name = r[1] == null ? null : r[1].toString();
            long total = r[2] == null ? 0L : ((Number) r[2]).longValue();
            long active = r[3] == null ? 0L : ((Number) r[3]).longValue();
            byCode.put(code, new CompanySummaryResponse(code, name, total, active));
        }

        List<String> masterCodes = masterAgencyAgentRepository.findDistinctCompanyCodes();
        if (masterCodes != null) {
            for (String raw : masterCodes) {
                String code = raw == null ? null : raw.trim();
                if (code == null || code.isEmpty()) continue;
                if (byCode.containsKey(code)) continue;

                String name = userRepository.findTopByCompanyCodeIgnoreCase(code)
                        .map(u -> u.getCompanyName() == null ? null : u.getCompanyName().trim())
                        .filter(n -> n != null && !n.isEmpty())
                        .orElse(code);

                byCode.put(code, new CompanySummaryResponse(code, name, 0L, 0L));
            }
        }

        return ResponseEntity.ok(byCode.values().stream().toList());
    }

    @GetMapping("/{companyCode}")
    public ResponseEntity<?> getCompanyDetail(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable String companyCode
    ) {
        try {
            requireAdmin(token);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }

        User u = userRepository.findTopByCompanyCodeIgnoreCase(companyCode).orElse(null);
        if (u == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("companyCode", u.getCompanyCode());
        res.put("companyName", u.getCompanyName());
        res.put("ownerName", u.getOwnerName());
        res.put("email", u.getEmail());
        res.put("phoneNumber", u.getPhoneNumber());
        res.put("agencyRange", u.getAgencyRange());
        res.put("reasonToUse", u.getReasonToUse());
        res.put("avatarUrl", u.getAvatarUrl());
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{companyCode}")
    public ResponseEntity<?> updateCompanyName(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable String companyCode,
            @Valid @RequestBody com.shadcn.backend.dto.UpdateCompanyRequest request
    ) {
        try {
            requireAdmin(token);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }

        int updated = userRepository.updateCompanyNameByCompanyCode(companyCode, request.getCompanyName());
        return ResponseEntity.ok(new java.util.LinkedHashMap<String, Object>() {{
            put("updated", updated);
        }});
    }

    @PutMapping("/{companyCode}/status")
    public ResponseEntity<?> updateCompanyStatus(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable String companyCode,
            @Valid @RequestBody UpdateCompanyStatusRequest request
    ) {
        try {
            requireAdmin(token);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }

        String status = request.getStatus() == null ? "" : request.getStatus().trim().toUpperCase();
        if (!("ACTIVE".equals(status) || "INACTIVE".equals(status) || "SUSPENDED".equals(status) || "WAITING_APPROVAL".equals(status))) {
            return ResponseEntity.badRequest().body(new java.util.LinkedHashMap<String, Object>() {{
                put("error", "Invalid status");
            }});
        }
        int updated = userRepository.updateStatusByCompanyCode(companyCode, status);
        return ResponseEntity.ok(new java.util.LinkedHashMap<String, Object>() {{
            put("updated", updated);
        }});
    }

    @PostMapping("/invitations")
    public ResponseEntity<?> sendCompanyInvitation(
            @RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody InvitationRequest request
    ) {
        try {
            requireAdmin(token);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }

        request.setInvitationType("COMPANY");
        if (request.getCompanyName() == null || request.getCompanyName().isBlank()) {
            request.setCompanyName(request.getNamaLengkap());
        }
        return ResponseEntity.ok(invitationService.sendInvitation(request));
    }

    @DeleteMapping("/{companyCode}")
    public ResponseEntity<?> deleteCompany(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable String companyCode
    ) {
        try {
            requireAdmin(token);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }

        List<User> users = userRepository.findByCompanyCodeIgnoreCase(companyCode);
        for (User user : users) {
            if (user.getRole() != null && ("ADMIN".equals(user.getRole().getName()) || "MODERATOR".equals(user.getRole().getName()))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete company with ADMIN/MODERATOR users"));
            }
        }

        userRepository.deleteAll(users);
        return ResponseEntity.ok(Map.of("deleted", users.size()));
    }

    @DeleteMapping("/accounts")
    public ResponseEntity<?> deleteAllCompanyAccounts(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(value = "confirm", required = false) Boolean confirm
    ) {
        try {
            requireAdmin(token);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }

        if (confirm == null || !confirm) {
            return ResponseEntity.badRequest().body(new java.util.LinkedHashMap<String, Object>() {{
                put("error", "confirm=true is required");
            }});
        }

        int deleted = userRepository.deleteAllCompanyAccountsExcludingAdmins();
        return ResponseEntity.ok(new java.util.LinkedHashMap<String, Object>() {{
            put("deleted", deleted);
        }});
    }

    @Data
    public static class UpdateCompanyRequest {
        private String companyName;
        private String ownerName;
        private String email;
        private String phoneNumber;
        private String agencyRange;
        private String reasonToUse;
        private String password;
    }

    @PutMapping("/{companyCode}/full")
    public ResponseEntity<?> updateCompanyFull(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable String companyCode,
            @RequestBody UpdateCompanyRequest request
    ) {
        try {
            requireAdmin(token);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }

        List<User> companyUsers = userRepository.findByCompanyCodeIgnoreCase(companyCode);
        if (companyUsers.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User ownerUser = userRepository.findTopByCompanyCodeIgnoreCase(companyCode).orElse(companyUsers.get(0));

        for (User user : companyUsers) {
            if (request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
                user.setCompanyName(request.getCompanyName());
            }
            if (request.getOwnerName() != null && !request.getOwnerName().isBlank()) {
                user.setOwnerName(request.getOwnerName());
            }
            if (request.getAgencyRange() != null && !request.getAgencyRange().isBlank()) {
                user.setAgencyRange(request.getAgencyRange());
            }
            if (request.getReasonToUse() != null && !request.getReasonToUse().isBlank()) {
                user.setReasonToUse(request.getReasonToUse());
            }
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            ownerUser.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            ownerUser.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            ownerUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.saveAll(companyUsers);

        return ResponseEntity.ok(Map.of("updated", companyUsers.size()));
    }
}
