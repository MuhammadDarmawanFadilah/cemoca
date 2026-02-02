package com.shadcn.backend.controller;

import com.shadcn.backend.dto.UserRequest;
import com.shadcn.backend.model.User;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/users")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    private final AuthService authService;

    private static class UnauthorizedException extends RuntimeException {
        UnauthorizedException(String message) {
            super(message);
        }
    }

    private static class ForbiddenException extends RuntimeException {
        ForbiddenException(String message) {
            super(message);
        }
    }

    private User requireAdmin(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new UnauthorizedException("No valid token provided");
        }

        String actualToken = token.substring(7);
        User user = authService.getUserFromToken(actualToken);
        if (user == null) {
            throw new UnauthorizedException("Invalid token");
        }
        if (!user.isAdmin()) {
            throw new ForbiddenException("Forbidden");
        }
        return user;
    }
    
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        try {
            // If pagination parameters are provided, return paginated response
            if (page != null && size != null) {
                Pageable pageable = PageRequest.of(page, size);
                Page<User> users = userService.getAllUsersPaginated(pageable);
                return ResponseEntity.ok(users);
            }
            // Otherwise return all users as list
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error getting users", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/paginated")
    public ResponseEntity<Page<User>> getAllUsersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<User> users = userService.getAllUsersPaginated(pageable);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error getting paginated users", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        try {
            Optional<User> user = userService.getUserById(id);
            return user.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting user by id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        try {
            Optional<User> user = userService.getUserByUsername(username);
            return user.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting user by username: {}", username, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/exists/username/{username}")
    public ResponseEntity<Boolean> checkUsernameExists(@PathVariable String username) {
        try {
            return ResponseEntity.ok(userService.existsByUsername(username));
        } catch (Exception e) {
            log.error("Error checking username exists: {}", username, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/exists/email/{email}")
    public ResponseEntity<Boolean> checkEmailExists(@PathVariable String email) {
        try {
            return ResponseEntity.ok(userService.existsByEmail(email));
        } catch (Exception e) {
            log.error("Error checking email exists", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/exists/phone/{phone}")
    public ResponseEntity<Boolean> checkPhoneExists(@PathVariable String phone) {
        try {
            return ResponseEntity.ok(userService.existsByPhoneNumber(phone));
        } catch (Exception e) {
            log.error("Error checking phone exists", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createUser(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody UserRequest userRequest
    ) {
        try {
            User adminUser = requireAdmin(token);
            log.info("Creating user with username: {}", userRequest.getUsername());
            User createdUser = userService.createUser(userRequest);

            boolean needsCompanyCode = createdUser.getCompanyCode() == null || createdUser.getCompanyCode().isBlank();
            boolean adminHasCompanyCode = adminUser.getCompanyCode() != null && !adminUser.getCompanyCode().isBlank();
            if (needsCompanyCode && adminHasCompanyCode) {
                createdUser.setCompanyCode(adminUser.getCompanyCode());
                if (createdUser.getCompanyName() == null || createdUser.getCompanyName().isBlank()) {
                    createdUser.setCompanyName(adminUser.getCompanyName());
                }
                if (createdUser.getOwnerName() == null || createdUser.getOwnerName().isBlank()) {
                    createdUser.setOwnerName(adminUser.getOwnerName());
                }
                createdUser = userService.updateUser(createdUser);
            }

            log.info("User created successfully: {}", createdUser.getUsername());
            return ResponseEntity.ok(createdUser);
        } catch (RuntimeException e) {
            if (e instanceof UnauthorizedException) {
                return ResponseEntity.status(401).body(java.util.Map.of("error", e.getMessage()));
            }
            if (e instanceof ForbiddenException) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
            }
            log.warn("Error creating user: {}", e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating user", e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to create user"));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable Long id,
            @RequestBody UserRequest userRequest
    ) {
        try {
            requireAdmin(token);
            log.info("Updating user with ID: {}", id);
            User updatedUser = userService.updateUser(id, userRequest);
            log.info("User updated successfully: {}", updatedUser.getUsername());
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            if (e instanceof UnauthorizedException) {
                return ResponseEntity.status(401).body(java.util.Map.of("error", e.getMessage()));
            }
            if (e instanceof ForbiddenException) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
            }
            log.warn("Error updating user {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating user: {}", id, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to update user"));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.warn("Error deleting user {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting user: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> countUsers() {
        try {
            long count = userService.countUsers();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error counting users", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}