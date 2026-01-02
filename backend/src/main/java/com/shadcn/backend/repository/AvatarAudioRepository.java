package com.shadcn.backend.repository;

import com.shadcn.backend.model.AvatarAudio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface AvatarAudioRepository extends JpaRepository<AvatarAudio, Long> {

    Optional<AvatarAudio> findFirstByNormalizedKey(String normalizedKey);

    Optional<AvatarAudio> findFirstByNormalizedKeyIn(Collection<String> normalizedKeys);

    boolean existsByNormalizedKey(String normalizedKey);

    Page<AvatarAudio> findByAvatarNameContainingIgnoreCaseOrNormalizedKeyContainingIgnoreCase(
            String avatarName,
            String normalizedKey,
            Pageable pageable
    );
}
