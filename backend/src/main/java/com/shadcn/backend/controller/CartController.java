package com.shadcn.backend.controller;

import com.shadcn.backend.model.Cart;
import com.shadcn.backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class CartController {
    
    @Autowired
    private CartService cartService;
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Cart>> getCartByUser(@PathVariable Long userId) {
        try {
            List<Cart> cartItems = cartService.getCartByUser(userId);
            return ResponseEntity.ok(cartItems);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/add")
    public ResponseEntity<Cart> addToCart(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long barangId = Long.valueOf(request.get("barangId").toString());
            Integer jumlah = Integer.valueOf(request.get("jumlah").toString());
            
            Cart cartItem = cartService.addToCart(userId, barangId, jumlah);
            return ResponseEntity.ok(cartItem);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/update")
    public ResponseEntity<Cart> updateCartItemQuantity(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long barangId = Long.valueOf(request.get("barangId").toString());
            Integer newQuantity = Integer.valueOf(request.get("quantity").toString());
            
            Cart cartItem = cartService.updateCartItemQuantity(userId, barangId, newQuantity);
            if (cartItem == null) {
                return ResponseEntity.noContent().build(); // Item was removed
            }
            return ResponseEntity.ok(cartItem);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/remove")
    public ResponseEntity<Void> removeFromCart(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long barangId = Long.valueOf(request.get("barangId").toString());
            
            cartService.removeFromCart(userId, barangId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        try {
            cartService.clearCart(userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/count/{userId}")
    public ResponseEntity<Long> getCartItemCount(@PathVariable Long userId) {
        try {
            long count = cartService.getCartItemCount(userId);
            return ResponseEntity.ok(count);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/total-quantity/{userId}")
    public ResponseEntity<Integer> getTotalQuantity(@PathVariable Long userId) {
        try {
            Integer totalQuantity = cartService.getTotalQuantity(userId);
            return ResponseEntity.ok(totalQuantity);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
