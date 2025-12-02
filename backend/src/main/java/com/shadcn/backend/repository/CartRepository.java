package com.shadcn.backend.repository;

import com.shadcn.backend.model.Cart;
import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Barang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    
    List<Cart> findByUser(User user);
    
    Optional<Cart> findByUserAndBarang(User user, Barang barang);
    
    void deleteByUser(User user);
    
    void deleteByUserAndBarang(User user, Barang barang);
    
    @Query("SELECT COUNT(c) FROM Cart c WHERE c.user = :user")
    long countByUser(@Param("user") User user);
    
    @Query("SELECT SUM(c.jumlah) FROM Cart c WHERE c.user = :user")
    Integer getTotalQuantityByUser(@Param("user") User user);
    
    boolean existsByUserAndBarang(User user, Barang barang);
}
