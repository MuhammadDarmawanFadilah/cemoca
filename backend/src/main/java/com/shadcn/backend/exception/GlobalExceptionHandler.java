package com.shadcn.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.io.IOException;
import java.net.SocketException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex) {
        log.error("Duplicate resource error: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("Conflict")
                .message(ex.getMessage())
                .type("DUPLICATE_RESOURCE")
                .build();
                
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        log.error("Resource not found error: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message(ex.getMessage())
                .type("RESOURCE_NOT_FOUND")
                .build();
                
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        log.error("Validation error: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage())
                .type("VALIDATION_ERROR")
                .build();
                
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        log.error("Validation error: {}", ex.getMessage());
        
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        String message = "Data tidak valid: " + fieldErrors.values().iterator().next();
          ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(message)
                .type("VALIDATION_ERROR")
                .details(Map.copyOf(fieldErrors))
                .build();
                
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator.")
                .type("INTERNAL_ERROR")
                .build();
                
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        // Log only suspicious requests, not common ones like favicon.ico
        String resourcePath = ex.getResourcePath();
        if (isSuspiciousRequest(resourcePath)) {
            log.warn("Suspicious request for resource: {}", resourcePath);
        } else {
            log.debug("Static resource not found: {}", resourcePath);
        }
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message("Resource not found")
                .type("RESOURCE_NOT_FOUND")
                .build();
                
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        log.error("File size exceeded limit: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.PAYLOAD_TOO_LARGE.value())
                .error("Payload Too Large")
                .message("Ukuran file terlalu besar. Maksimal ukuran file adalah 100MB.")
                .type("FILE_SIZE_EXCEEDED")
                .build();
                
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .contentType(MediaType.APPLICATION_JSON)
                .body(error);
    }
    
    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponse> handleMultipartException(MultipartException ex) {
        log.error("Multipart file upload error: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message("Terjadi kesalahan saat upload file. Silakan coba lagi dengan file yang valid.")
                .type("FILE_UPLOAD_ERROR")
                .build();
                
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body(error);
    }
    
    @ExceptionHandler({IOException.class, SocketException.class})
    public ResponseEntity<ErrorResponse> handleIOException(Exception ex) {
        log.error("IO Exception during file operation: {}", ex.getMessage());
        
        // Check if it's a broken pipe (connection reset)
        boolean isBrokenPipe = ex.getMessage() != null && 
                (ex.getMessage().contains("Broken pipe") || 
                 ex.getMessage().contains("Connection reset"));
          ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(isBrokenPipe ? HttpStatus.BAD_REQUEST.value() : HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(isBrokenPipe ? "Connection Closed" : "Internal Server Error")
                .message(isBrokenPipe ? 
                        "Koneksi terputus sebelum proses selesai. Coba lagi dengan koneksi yang stabil." : 
                        "Terjadi kesalahan saat operasi file. Silakan coba lagi.")
                .type(isBrokenPipe ? "CONNECTION_CLOSED" : "FILE_OPERATION_ERROR")
                .build();
                
        return ResponseEntity.status(isBrokenPipe ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(error);
    }
    
    @ExceptionHandler(HttpMessageNotWritableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotWritable(HttpMessageNotWritableException ex) {
        log.error("Http message not writable: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("Terjadi kesalahan saat memproses respons. Silakan coba lagi.")
                .type("RESPONSE_PROCESSING_ERROR")
                .build();
                
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(error);
    }
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Runtime exception: {}", ex.getMessage(), ex);
        
        // Check if this is a business logic error (email/nim already exists)
        String message = ex.getMessage();
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String errorType = "BUSINESS_LOGIC_ERROR";
        
        if (message != null && (message.contains("sudah terdaftar") || message.contains("already exists"))) {
            status = HttpStatus.CONFLICT;
            errorType = "DUPLICATE_RESOURCE";
        }
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message != null ? message : "Terjadi kesalahan dalam proses bisnis")
                .type(errorType)
                .build();
                
        return ResponseEntity.status(status).body(error);
    }

    private boolean isSuspiciousRequest(String resourcePath) {
        // Check for common vulnerability scanning patterns
        return resourcePath != null && (
            resourcePath.contains(".php") ||
            resourcePath.contains("admin/") ||
            resourcePath.contains("config") ||
            resourcePath.contains("owa/") ||
            resourcePath.contains("developmentserver") ||
            resourcePath.contains("wp-") ||
            resourcePath.contains("phpmyadmin")
        );
    }
}
