package com.shadcn.backend.service;

import com.shadcn.backend.config.AppProperties;
import com.shadcn.backend.dto.PagedResponse;
import com.shadcn.backend.dto.PaymentFilterRequest;
import com.shadcn.backend.model.Payment;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.PaymentRepository;
import com.shadcn.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AppProperties appProperties;
      public List<Payment> getAllPayments() {
        logger.info("Fetching all payments from database");
        try {
            List<Payment> payments = paymentRepository.findAll();
            logger.info("Successfully fetched {} payments from database", payments.size());
            
            // Log payment details for debugging
            for (Payment payment : payments) {
                logger.debug("Payment: id={}, paymentId={}, amount={}, status={}, user={}", 
                    payment.getId(), payment.getPaymentId(), payment.getAmount(), 
                    payment.getStatus(), payment.getUser() != null ? payment.getUser().getUsername() : "null");
            }
            
            return payments;
        } catch (Exception e) {
            logger.error("Error fetching payments from database", e);
            throw e;
        }
    }
    
    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }
    
    public Optional<Payment> getPaymentByPaymentId(String paymentId) {
        return paymentRepository.findByPaymentId(paymentId);
    }
    
    public List<Payment> getPaymentsByUserId(Long userId) {
        return paymentRepository.findByUserId(userId);
    }
    
    public List<Payment> getPaymentsByStatus(Payment.PaymentStatus status) {
        return paymentRepository.findByStatus(status);
    }
    
    public List<Payment> getPaymentsByMethod(Payment.PaymentMethod method) {
        return paymentRepository.findByMethod(method);
    }
    
    public List<Payment> getPaymentsByAmountRange(BigDecimal minAmount, BigDecimal maxAmount) {
        return paymentRepository.findByAmountBetween(minAmount, maxAmount);
    }
    
    public List<Payment> getPaymentsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return paymentRepository.findByCreatedAtBetween(startDate, endDate);
    }
      public Payment createPayment(Payment payment) {
        // Generate unique payment ID if not provided
        if (payment.getPaymentId() == null || payment.getPaymentId().isEmpty()) {
            String paymentId = appProperties.getPayment().getPrefix() + 
                UUID.randomUUID().toString().substring(0, appProperties.getPayment().getIdLength()).toUpperCase();
            payment.setPaymentId(paymentId);
        }
        
        // Validate user exists
        if (payment.getUser() != null && payment.getUser().getId() != null) {
            User user = userRepository.findById(payment.getUser().getId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + payment.getUser().getId()));
            payment.setUser(user);
        }
        
        return paymentRepository.save(payment);
    }
    
    public Payment updatePayment(Long id, Payment paymentDetails) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
        
        payment.setAmount(paymentDetails.getAmount());
        payment.setStatus(paymentDetails.getStatus());
        payment.setMethod(paymentDetails.getMethod());
        payment.setDescription(paymentDetails.getDescription());
        payment.setTransactionId(paymentDetails.getTransactionId());
        
        if (paymentDetails.getUser() != null && paymentDetails.getUser().getId() != null) {
            User user = userRepository.findById(paymentDetails.getUser().getId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + paymentDetails.getUser().getId()));
            payment.setUser(user);
        }
        
        return paymentRepository.save(payment);
    }
    
    public void deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
        paymentRepository.delete(payment);
    }
    
    public PagedResponse<Payment> getPaymentsWithFilters(PaymentFilterRequest filterRequest) {
        logger.info("Fetching payments with filters: {}", filterRequest);
        
        // Create Sort object
        Sort sort = Sort.by(
            "desc".equalsIgnoreCase(filterRequest.getSortDirection()) 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC,
            filterRequest.getSortBy()
        );
        
        // Create Pageable object
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
        
        // Execute query with filters
        Page<Payment> paymentPage = paymentRepository.findPaymentsWithFilters(
            filterRequest.getEmail(),
            filterRequest.getFullName(),
            filterRequest.getStatus(),
            filterRequest.getMethod(),
            filterRequest.getDescription(),
            pageable
        );
        
        // Convert to PagedResponse
        PagedResponse<Payment> response = new PagedResponse<>();
        response.setContent(paymentPage.getContent());
        response.setPage(paymentPage.getNumber());
        response.setSize(paymentPage.getSize());
        response.setTotalElements(paymentPage.getTotalElements());
        response.setTotalPages(paymentPage.getTotalPages());
        response.setFirst(paymentPage.isFirst());
        response.setLast(paymentPage.isLast());
        response.setEmpty(paymentPage.isEmpty());
        
        logger.info("Successfully fetched {} payments out of {} total", 
                   paymentPage.getNumberOfElements(), paymentPage.getTotalElements());
        
        return response;
    }
    
    public BigDecimal getTotalAmountByStatus(Payment.PaymentStatus status) {
        BigDecimal total = paymentRepository.getTotalAmountByStatus(status);
        return total != null ? total : BigDecimal.ZERO;
    }
    
    public Long getCountByStatus(Payment.PaymentStatus status) {
        return paymentRepository.getCountByStatus(status);
    }
}
