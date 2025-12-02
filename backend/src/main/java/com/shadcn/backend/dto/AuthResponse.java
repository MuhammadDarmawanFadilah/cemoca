package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String token;
    private String tokenType = "Bearer";
    private Object user; // Changed from UserSummaryDto to Object
    private long expiresIn; // Token expiration time in seconds
    
    public AuthResponse(String token, Object user, long expiresIn) {
        this.token = token;
        this.user = user;
        this.expiresIn = expiresIn;
    }
}
