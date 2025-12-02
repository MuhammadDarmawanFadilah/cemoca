package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {
    @NotBlank(message = "Token reset password harus diisi")
    private String token;

    @NotBlank(message = "Password baru harus diisi")
    @Size(min = 6, message = "Password minimal 6 karakter")
    private String newPassword;
}