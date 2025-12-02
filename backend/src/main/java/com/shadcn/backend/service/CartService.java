package com.shadcn.backend.service;

import com.shadcn.backend.model.Cart;
import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Barang;
import com.shadcn.backend.repository.CartRepository;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.repository.BarangRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartService {
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BarangRepository barangRepository;
    
    public List<Cart> getCartByUser(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        return cartRepository.findByUser(user.get());
    }
    
    @Transactional
    public Cart addToCart(Long userId, Long barangId, Integer jumlah) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        
        Optional<Barang> barangOpt = barangRepository.findById(barangId);
        if (barangOpt.isEmpty()) {
            throw new RuntimeException("Barang not found with id: " + barangId);
        }
        
        User user = userOpt.get();
        Barang barang = barangOpt.get();
        
        // Check if item already exists in cart
        Optional<Cart> existingCartItem = cartRepository.findByUserAndBarang(user, barang);
        
        if (existingCartItem.isPresent()) {
            // Update quantity
            Cart cartItem = existingCartItem.get();
            Integer newQuantity = cartItem.getJumlah() + jumlah;
            
            // Check stock availability
            if (newQuantity > barang.getStock()) {
                throw new RuntimeException("Insufficient stock. Available: " + barang.getStock() + ", Requested: " + newQuantity);
            }
            
            cartItem.setJumlah(newQuantity);
            return cartRepository.save(cartItem);
        } else {
            // Create new cart item
            if (jumlah > barang.getStock()) {
                throw new RuntimeException("Insufficient stock. Available: " + barang.getStock() + ", Requested: " + jumlah);
            }
            
            Cart newCartItem = Cart.builder()
                    .user(user)
                    .barang(barang)
                    .jumlah(jumlah)
                    .build();
            
            return cartRepository.save(newCartItem);
        }
    }
    
    @Transactional
    public Cart updateCartItemQuantity(Long userId, Long barangId, Integer newQuantity) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        
        Optional<Barang> barangOpt = barangRepository.findById(barangId);
        if (barangOpt.isEmpty()) {
            throw new RuntimeException("Barang not found with id: " + barangId);
        }
        
        User user = userOpt.get();
        Barang barang = barangOpt.get();
        
        Optional<Cart> cartItemOpt = cartRepository.findByUserAndBarang(user, barang);
        if (cartItemOpt.isEmpty()) {
            throw new RuntimeException("Cart item not found");
        }
        
        Cart cartItem = cartItemOpt.get();
        
        if (newQuantity <= 0) {
            cartRepository.delete(cartItem);
            return null;
        }
        
        // Check stock availability
        if (newQuantity > barang.getStock()) {
            throw new RuntimeException("Insufficient stock. Available: " + barang.getStock() + ", Requested: " + newQuantity);
        }
        
        cartItem.setJumlah(newQuantity);
        return cartRepository.save(cartItem);
    }
    
    @Transactional
    public void removeFromCart(Long userId, Long barangId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        
        Optional<Barang> barangOpt = barangRepository.findById(barangId);
        if (barangOpt.isEmpty()) {
            throw new RuntimeException("Barang not found with id: " + barangId);
        }
        
        cartRepository.deleteByUserAndBarang(userOpt.get(), barangOpt.get());
    }
    
    @Transactional
    public void clearCart(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        cartRepository.deleteByUser(user.get());
    }
    
    public long getCartItemCount(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        return cartRepository.countByUser(user.get());
    }
    
    public Integer getTotalQuantity(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        Integer total = cartRepository.getTotalQuantityByUser(user.get());
        return total != null ? total : 0;
    }
}
