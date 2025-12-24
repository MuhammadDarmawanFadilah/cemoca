package com.shadcn.backend.service;

import com.shadcn.backend.dto.CompanyRegistrationFromInvitationRequest;
import com.shadcn.backend.dto.InvitationRequest;
import com.shadcn.backend.dto.InvitationResponse;
import com.shadcn.backend.model.Invitation;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.InvitationRepository;
import com.shadcn.backend.repository.RoleRepository;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final WhatsAppService whatsAppService;

    public InvitationResponse sendInvitation(InvitationRequest request) {
        String nama = request.getNamaLengkap() == null ? null : request.getNamaLengkap().trim();
        String nomorHp = request.getNomorHp() == null ? null : request.getNomorHp().trim();

        if (nama == null || nama.isBlank()) {
            throw new RuntimeException("Full name is required");
        }
        if (nomorHp == null || nomorHp.isBlank()) {
            throw new RuntimeException("Phone number is required");
        }

        Invitation.InvitationType type = parseType(request.getInvitationType());
        if (type != Invitation.InvitationType.COMPANY) {
            throw new RuntimeException("Only COMPANY invitation type is supported");
        }
        Integer durationDays = request.getDurationDays();
        int days = (durationDays == null || durationDays <= 0) ? 7 : Math.min(durationDays, 365);

        Invitation invitation = new Invitation();
        invitation.setNamaLengkap(nama);
        invitation.setNomorHp(nomorHp);
        invitation.setInvitationToken(generateToken());
        invitation.setInvitationType(type);
        invitation.setSentAt(LocalDateTime.now());
        invitation.setExpiresAt(LocalDateTime.now().plusDays(days));

        String companyName = request.getCompanyName();
        if (companyName == null || companyName.isBlank()) {
            companyName = nama;
        }
        invitation.setCompanyName(companyName.trim());
        invitation.setCompanyCode(generateCompanyCode(invitation.getCompanyName(), invitation.getNamaLengkap()));

        Invitation saved = invitationRepository.save(invitation);

        try {
            String messageId;
            messageId = whatsAppService.sendCompanyInvitationMessage(saved.getNomorHp(),
                    saved.getCompanyName() == null ? saved.getNamaLengkap() : saved.getCompanyName(),
                    saved.getInvitationToken(),
                    days);
            saved.markAsSent(messageId);
        } catch (Exception e) {
            saved.markAsFailed();
            log.warn("Failed sending invitation WhatsApp: {}", e.getMessage());
        }

        Invitation updated = invitationRepository.save(saved);
        return new InvitationResponse(updated);
    }

    public List<InvitationResponse> getHistory() {
        return invitationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(InvitationResponse::new)
                .toList();
    }

    public Page<InvitationResponse> getHistoryPaginated(
            int page,
            int size,
            String status,
            String nama,
            String phone,
            String sortBy,
            String sortDirection
    ) {
        String actualSort = (sortBy == null || sortBy.isBlank()) ? "createdAt" : sortBy;
        Sort.Direction dir = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(dir, actualSort));

        String namaFilter = nama == null ? null : nama.trim();
        String phoneFilter = phone == null ? null : phone.trim();

        Invitation.InvitationStatus st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = Invitation.InvitationStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            } catch (Exception ignored) {
                st = null;
            }
        }

        Page<Invitation> pageResult;
        if (st != null && (namaFilter == null || namaFilter.isBlank()) && (phoneFilter == null || phoneFilter.isBlank())) {
            pageResult = invitationRepository.findByStatus(st, pageable);
        } else if (st != null && namaFilter != null && !namaFilter.isBlank() && (phoneFilter == null || phoneFilter.isBlank())) {
            pageResult = invitationRepository.findByStatusAndNamaLengkapContainingIgnoreCase(st, namaFilter, pageable);
        } else if (st != null && phoneFilter != null && !phoneFilter.isBlank() && (namaFilter == null || namaFilter.isBlank())) {
            pageResult = invitationRepository.findByStatusAndNomorHpContaining(st, phoneFilter, pageable);
        } else if (st != null && namaFilter != null && !namaFilter.isBlank() && phoneFilter != null && !phoneFilter.isBlank()) {
            pageResult = invitationRepository.findByStatusAndNamaLengkapContainingIgnoreCaseAndNomorHpContaining(st, namaFilter, phoneFilter, pageable);
        } else if (st == null && namaFilter != null && !namaFilter.isBlank() && (phoneFilter == null || phoneFilter.isBlank())) {
            pageResult = invitationRepository.findByNamaLengkapContainingIgnoreCase(namaFilter, pageable);
        } else if (st == null && phoneFilter != null && !phoneFilter.isBlank() && (namaFilter == null || namaFilter.isBlank())) {
            pageResult = invitationRepository.findByNomorHpContaining(phoneFilter, pageable);
        } else if (st == null && namaFilter != null && !namaFilter.isBlank() && phoneFilter != null && !phoneFilter.isBlank()) {
            pageResult = invitationRepository.findByNamaLengkapContainingIgnoreCaseAndNomorHpContaining(namaFilter, phoneFilter, pageable);
        } else {
            pageResult = invitationRepository.findAll(pageable);
        }

        return pageResult.map(InvitationResponse::new);
    }

    public InvitationResponse getByToken(String token) {
        String t = token == null ? null : token.trim();
        if (t == null || t.isBlank()) {
            throw new RuntimeException("Invalid invitation token");
        }

        Invitation inv = invitationRepository.findByInvitationToken(t)
                .orElseThrow(() -> new RuntimeException("Invitation token not found"));

        if (inv.isCancelled()) {
            throw new RuntimeException("Invitation has been cancelled");
        }

        if (inv.isExpired()) {
            if (inv.getStatus() != Invitation.InvitationStatus.EXPIRED) {
                inv.markAsExpired();
                invitationRepository.save(inv);
            }
            throw new RuntimeException("Invitation has expired");
        }

        return new InvitationResponse(inv);
    }

    public InvitationResponse resend(Long id) {
        Invitation inv = invitationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (inv.isCancelled()) {
            throw new RuntimeException("Invitation has been cancelled");
        }

        if (inv.isExpired()) {
            inv.setExpiresAt(LocalDateTime.now().plusDays(7));
        }

        try {
            String messageId;
            if (inv.getInvitationType() == Invitation.InvitationType.COMPANY) {
                messageId = whatsAppService.sendCompanyInvitationMessage(inv.getNomorHp(),
                        inv.getCompanyName() == null ? inv.getNamaLengkap() : inv.getCompanyName(),
                        inv.getInvitationToken(),
                        7);
            } else {
                messageId = whatsAppService.sendInvitationMessage(inv.getNomorHp(), inv.getNamaLengkap(), inv.getInvitationToken());
            }
            inv.setSentAt(LocalDateTime.now());
            inv.markAsSent(messageId);
        } catch (Exception e) {
            inv.markAsFailed();
            log.warn("Failed resend invitation: {}", e.getMessage());
        }

        return new InvitationResponse(invitationRepository.save(inv));
    }

    public InvitationResponse cancel(Long id) {
        Invitation inv = invitationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));
        inv.markAsCancelled();
        return new InvitationResponse(invitationRepository.save(inv));
    }

    public User registerCompanyFromInvitation(CompanyRegistrationFromInvitationRequest request) {
        String token = request.getInvitationToken() == null ? null : request.getInvitationToken().trim();
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Invalid invitation token");
        }

        Invitation inv = invitationRepository.findByInvitationToken(token)
                .orElseThrow(() -> new RuntimeException("Invitation token not found"));

        if (inv.getInvitationType() != Invitation.InvitationType.COMPANY) {
            throw new RuntimeException("Invalid invitation type");
        }

        if (!inv.isValid()) {
            throw new RuntimeException("Invitation is invalid or already used");
        }

        String username = request.getUsername() == null ? null : request.getUsername().trim();
        String email = request.getEmail() == null ? null : request.getEmail().trim();
        String password = request.getPassword();

        if (username == null || username.isBlank()) {
            throw new RuntimeException("Username is required");
        }
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        String phone = inv.getNomorHp();
        if (phone != null && !phone.isBlank() && userRepository.existsByPhoneNumber(phone)) {
            throw new RuntimeException("Phone number already exists");
        }

        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> roleRepository.findByName("MODERATOR")
                        .orElseThrow(() -> new RuntimeException("Role USER not found")));

        String companyName = inv.getCompanyName();
        if (companyName == null || companyName.isBlank()) {
            companyName = inv.getNamaLengkap();
        }

        String companyCode = inv.getCompanyCode();
        if (companyCode == null || companyCode.isBlank()) {
            companyCode = generateCompanyCode(companyName, username);
            inv.setCompanyCode(companyCode);
        }

        String ownerName = inv.getNamaLengkap();
        if (ownerName == null || ownerName.isBlank()) {
            ownerName = companyName;
        }

        User user = User.builder()
                .username(username)
                .email(email)
            .fullName(ownerName)
                .phoneNumber(phone)
                .password(passwordEncoder.encode(password))
                .role(userRole)
                .status(User.UserStatus.ACTIVE)
                .companyName(companyName)
                .companyCode(companyCode)
            .ownerName(ownerName)
                .build();

        User saved = userRepository.save(user);
        inv.markAsUsed(saved);
        invitationRepository.save(inv);
        return saved;
    }

    public Object getStatistics() {
        long total = invitationRepository.count();
        long pending = invitationRepository.findByStatus(Invitation.InvitationStatus.PENDING).size();
        long sent = invitationRepository.findByStatus(Invitation.InvitationStatus.SENT).size();
        long used = invitationRepository.findByStatus(Invitation.InvitationStatus.USED).size();
        long expired = invitationRepository.findByStatus(Invitation.InvitationStatus.EXPIRED).size();
        long failed = invitationRepository.findByStatus(Invitation.InvitationStatus.FAILED).size();
        long cancelled = invitationRepository.findByStatus(Invitation.InvitationStatus.CANCELLED).size();

        return new java.util.LinkedHashMap<String, Object>() {{
            put("total", total);
            put("pending", pending);
            put("sent", sent);
            put("used", used);
            put("expired", expired);
            put("failed", failed);
            put("cancelled", cancelled);
        }};
    }

    private Invitation.InvitationType parseType(String s) {
        if (s == null || s.isBlank()) {
            return Invitation.InvitationType.COMPANY;
        }
        try {
            return Invitation.InvitationType.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            return Invitation.InvitationType.COMPANY;
        }
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "");
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
}
