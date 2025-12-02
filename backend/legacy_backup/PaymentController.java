package com.shadcn.backend.controller;

import com.shadcn.backend.dto.PagedResponse;
import com.shadcn.backend.dto.PaymentFilterRequest;
import com.shadcn.backend.model.Payment;
import com.shadcn.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    
    @Autowired
    private PaymentService paymentService;
      @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        logger.info("Request received to get all payments");
        try {
            List<Payment> payments = paymentService.getAllPayments();
            logger.info("Found {} payments", payments.size());
            logger.debug("Payments data: {}", payments);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            logger.error("Error getting all payments", e);
            throw e;
        }
    }
      @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
        logger.info("Request received to get payment by id: {}", id);
        try {
            Optional<Payment> payment = paymentService.getPaymentById(id);
            if (payment.isPresent()) {
                logger.info("Payment found with id: {}", id);
                return ResponseEntity.ok(payment.get());
            } else {
                logger.warn("Payment not found with id: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error getting payment by id: {}", id, e);
            throw e;
        }
    }
    
    @GetMapping("/payment-id/{paymentId}")
    public ResponseEntity<Payment> getPaymentByPaymentId(@PathVariable String paymentId) {
        Optional<Payment> payment = paymentService.getPaymentByPaymentId(paymentId);
        return payment.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Payment>> getPaymentsByUserId(@PathVariable Long userId) {
        List<Payment> payments = paymentService.getPaymentsByUserId(userId);
        return ResponseEntity.ok(payments);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Payment>> getPaymentsByStatus(@PathVariable Payment.PaymentStatus status) {
        List<Payment> payments = paymentService.getPaymentsByStatus(status);
        return ResponseEntity.ok(payments);
    }
    
    @GetMapping("/method/{method}")
    public ResponseEntity<List<Payment>> getPaymentsByMethod(@PathVariable Payment.PaymentMethod method) {
        List<Payment> payments = paymentService.getPaymentsByMethod(method);
        return ResponseEntity.ok(payments);
    }
    
    @GetMapping("/amount-range")
    public ResponseEntity<List<Payment>> getPaymentsByAmountRange(
            @RequestParam BigDecimal minAmount,
            @RequestParam BigDecimal maxAmount) {
        List<Payment> payments = paymentService.getPaymentsByAmountRange(minAmount, maxAmount);
        return ResponseEntity.ok(payments);
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<Payment>> getPaymentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<Payment> payments = paymentService.getPaymentsByDateRange(startDate, endDate);
        return ResponseEntity.ok(payments);
    }
    
    @PostMapping
    public ResponseEntity<?> createPayment(@Valid @RequestBody Payment payment) {
        try {
            Payment createdPayment = paymentService.createPayment(payment);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPayment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayment(@PathVariable Long id, @Valid @RequestBody Payment paymentDetails) {
        try {
            Payment updatedPayment = paymentService.updatePayment(id, paymentDetails);
            return ResponseEntity.ok(updatedPayment);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePayment(@PathVariable Long id) {
        try {
            paymentService.deletePayment(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/filter")
    public ResponseEntity<PagedResponse<Payment>> getPaymentsWithFilters(@RequestBody PaymentFilterRequest filterRequest) {
        logger.info("Request received to get payments with filters: {}", filterRequest);
        try {
            PagedResponse<Payment> pagedPayments = paymentService.getPaymentsWithFilters(filterRequest);
            logger.info("Found {} payments with filters, page {} of {}", 
                       pagedPayments.getContent().size(), 
                       pagedPayments.getPage() + 1, 
                       pagedPayments.getTotalPages());
            return ResponseEntity.ok(pagedPayments);
        } catch (Exception e) {
            logger.error("Error getting payments with filters", e);
            throw e;
        }
    }
    
    @GetMapping("/paginated")
    public ResponseEntity<PagedResponse<Payment>> getPaymentsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) Payment.PaymentStatus status,
            @RequestParam(required = false) Payment.PaymentMethod method,
            @RequestParam(required = false) String description) {
        
        logger.info("Request received to get paginated payments with parameters: page={}, size={}, sortBy={}, sortDirection={}", 
                   page, size, sortBy, sortDirection);
        
        try {
            PaymentFilterRequest filterRequest = new PaymentFilterRequest();
            filterRequest.setPage(page);
            filterRequest.setSize(size);
            filterRequest.setSortBy(sortBy);
            filterRequest.setSortDirection(sortDirection);
            filterRequest.setEmail(email);
            filterRequest.setFullName(fullName);
            filterRequest.setStatus(status);
            filterRequest.setMethod(method);
            filterRequest.setDescription(description);
            
            PagedResponse<Payment> pagedPayments = paymentService.getPaymentsWithFilters(filterRequest);
            logger.info("Found {} payments, page {} of {}", 
                       pagedPayments.getContent().size(), 
                       pagedPayments.getPage() + 1, 
                       pagedPayments.getTotalPages());
            return ResponseEntity.ok(pagedPayments);
        } catch (Exception e) {
            logger.error("Error getting paginated payments", e);
            throw e;
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getPaymentStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        // Total amounts by status
        for (Payment.PaymentStatus status : Payment.PaymentStatus.values()) {
            BigDecimal totalAmount = paymentService.getTotalAmountByStatus(status);
            Long count = paymentService.getCountByStatus(status);
            
            Map<String, Object> statusData = new HashMap<>();
            statusData.put("totalAmount", totalAmount);
            statusData.put("count", count);
            
            statistics.put(status.name().toLowerCase(), statusData);
        }
        
        return ResponseEntity.ok(statistics);
    }
    
    @GetMapping("/statistics/status/{status}")
    public ResponseEntity<Map<String, Object>> getStatisticsByStatus(@PathVariable Payment.PaymentStatus status) {
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalAmount", paymentService.getTotalAmountByStatus(status));
        statistics.put("count", paymentService.getCountByStatus(status));
        
        return ResponseEntity.ok(statistics);
    }
}
