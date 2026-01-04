package com.shadcn.backend.repository;

import com.shadcn.backend.model.ConsentAudio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface ConsentAudioRepository extends JpaRepository<ConsentAudio, Long> {

    Optional<ConsentAudio> findFirstByNormalizedKey(String normalizedKey);

    Optional<ConsentAudio> findFirstByNormalizedKeyIn(Collection<String> normalizedKeys);

    boolean existsByNormalizedKey(String normalizedKey);

    Page<ConsentAudio> findByAvatarNameContainingIgnoreCaseOrNormalizedKeyContainingIgnoreCase(
            String avatarName,
            String normalizedKey,
            Pageable pageable
    );
}
