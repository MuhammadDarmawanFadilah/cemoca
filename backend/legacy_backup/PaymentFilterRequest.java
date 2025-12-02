package com.shadcn.backend.dto;

import com.shadcn.backend.model.Payment;

public class PaymentFilterRequest {
    
    private String email;
    private String fullName;
    private Payment.PaymentStatus status;
    private Payment.PaymentMethod method;
    private String description;
    private int page = 0;
    private int size = 10;
    private String sortBy = "createdAt";
    private String sortDirection = "desc";
    
    // Constructors
    public PaymentFilterRequest() {}
    
    public PaymentFilterRequest(String email, String fullName, Payment.PaymentStatus status, 
                               Payment.PaymentMethod method, String description, 
                               int page, int size, String sortBy, String sortDirection) {
        this.email = email;
        this.fullName = fullName;
        this.status = status;
        this.method = method;
        this.description = description;
        this.page = page;
        this.size = size;
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }
    
    // Getters and Setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public Payment.PaymentStatus getStatus() {
        return status;
    }
    
    public void setStatus(Payment.PaymentStatus status) {
        this.status = status;
    }
    
    public Payment.PaymentMethod getMethod() {
        return method;
    }
    
    public void setMethod(Payment.PaymentMethod method) {
        this.method = method;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public int getPage() {
        return page;
    }
    
    public void setPage(int page) {
        this.page = Math.max(0, page);
    }
    
    public int getSize() {
        return size;
    }
    
    public void setSize(int size) {
        this.size = Math.min(Math.max(1, size), 100); // Max 100 items per page
    }
    
    public String getSortBy() {
        return sortBy;
    }
    
    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }
    
    public String getSortDirection() {
        return sortDirection;
    }
    
    public void setSortDirection(String sortDirection) {
        this.sortDirection = sortDirection;
    }
}
