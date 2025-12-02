package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppResponse {
    
    private boolean success;
    private String message;
    private Object data;
    
    public WhatsAppResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}
