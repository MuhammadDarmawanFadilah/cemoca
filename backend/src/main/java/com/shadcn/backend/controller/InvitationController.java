package com.shadcn.backend.controller;

import com.shadcn.backend.dto.CompanyRegistrationFromInvitationRequest;
import com.shadcn.backend.dto.InvitationRequest;
import com.shadcn.backend.dto.InvitationResponse;
import com.shadcn.backend.model.User;
import com.shadcn.backend.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/send")
    public ResponseEntity<InvitationResponse> sendInvitation(@Valid @RequestBody InvitationRequest request) {
        return ResponseEntity.ok(invitationService.sendInvitation(request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<InvitationResponse>> history() {
        return ResponseEntity.ok(invitationService.getHistory());
    }

    @GetMapping("/history/paginated")
    public ResponseEntity<Page<InvitationResponse>> historyPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String nama,
            @RequestParam(required = false) String phone,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseEntity.ok(invitationService.getHistoryPaginated(page, size, status, nama, phone, sortBy, sortDirection));
    }

    @GetMapping("/token/{token}")
    public ResponseEntity<InvitationResponse> getByToken(@PathVariable String token) {
        return ResponseEntity.ok(invitationService.getByToken(token));
    }

    @PostMapping("/{id}/resend")
    public ResponseEntity<?> resend(@PathVariable Long id) {
        InvitationResponse inv = invitationService.resend(id);
        return ResponseEntity.ok(new java.util.LinkedHashMap<String, Object>() {{
                put("message", "Invitation resent successfully");
            put("invitation", inv);
        }});
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        InvitationResponse inv = invitationService.cancel(id);
        return ResponseEntity.ok(new java.util.LinkedHashMap<String, Object>() {{
              put("message", "Invitation cancelled successfully");
            put("invitation", inv);
        }});
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> statistics() {
        return ResponseEntity.ok(invitationService.getStatistics());
    }

    @PostMapping("/register-company")
    public ResponseEntity<User> registerCompany(@Valid @RequestBody CompanyRegistrationFromInvitationRequest request) {
        return ResponseEntity.ok(invitationService.registerCompanyFromInvitation(request));
    }
}
