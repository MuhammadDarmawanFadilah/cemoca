package com.shadcn.backend.controller;

import com.shadcn.backend.dto.UserRequest;
import com.shadcn.backend.model.User;
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
    
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error getting all users", e);
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
    public ResponseEntity<User> createUser(@RequestBody UserRequest userRequest) {
        try {
            log.info("Creating user with username: {}", userRequest.getUsername());
            User createdUser = userService.createUser(userRequest);
            log.info("User created successfully: {}", createdUser.getUsername());
            return ResponseEntity.ok(createdUser);
        } catch (RuntimeException e) {
            log.warn("Error creating user: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error creating user", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody UserRequest userRequest) {
        try {
            log.info("Updating user with ID: {}", id);
            User updatedUser = userService.updateUser(id, userRequest);
            log.info("User updated successfully: {}", updatedUser.getUsername());
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            log.warn("Error updating user {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error updating user: {}", id, e);
            return ResponseEntity.internalServerError().build();
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