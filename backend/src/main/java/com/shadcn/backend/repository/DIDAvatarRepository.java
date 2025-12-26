package com.shadcn.backend.repository;

import com.shadcn.backend.model.DIDAvatar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DIDAvatarRepository extends JpaRepository<DIDAvatar, Long> {
    
    Optional<DIDAvatar> findByPresenterId(String presenterId);
    
    Optional<DIDAvatar> findByPresenterNameIgnoreCase(String presenterName);
    
    @Query("SELECT d FROM DIDAvatar d WHERE LOWER(TRIM(d.presenterName)) = LOWER(TRIM(:name))")
    Optional<DIDAvatar> findByPresenterNameTrimmedIgnoreCase(@Param("name") String name);

    @Query("SELECT d FROM DIDAvatar d WHERE LOWER(TRIM(d.presenterName)) = LOWER(TRIM(:name)) AND LOWER(COALESCE(d.avatarType,'')) = 'express'")
    Optional<DIDAvatar> findExpressByPresenterNameTrimmedIgnoreCase(@Param("name") String name);

    @Query("SELECT d FROM DIDAvatar d WHERE d.presenterId = :presenterId AND LOWER(COALESCE(d.avatarType,'')) = 'express'")
    Optional<DIDAvatar> findExpressByPresenterId(@Param("presenterId") String presenterId);
    
    List<DIDAvatar> findByIsActiveTrue();
    
    boolean existsByPresenterNameIgnoreCase(String presenterName);
    
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM DIDAvatar d WHERE LOWER(TRIM(d.presenterName)) = LOWER(TRIM(:name))")
    boolean existsByPresenterNameTrimmedIgnoreCase(@Param("name") String name);

    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM DIDAvatar d WHERE LOWER(TRIM(d.presenterName)) = LOWER(TRIM(:name)) AND LOWER(COALESCE(d.avatarType,'')) = 'express'")
    boolean existsExpressByPresenterNameTrimmedIgnoreCase(@Param("name") String name);
}
