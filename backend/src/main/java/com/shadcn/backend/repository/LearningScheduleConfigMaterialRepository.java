package com.shadcn.backend.repository;

import com.shadcn.backend.model.LearningScheduleConfigMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LearningScheduleConfigMaterialRepository extends JpaRepository<LearningScheduleConfigMaterial, Long> {

    List<LearningScheduleConfigMaterial> findByConfigIdOrderByStartDateAsc(Long configId);

    List<LearningScheduleConfigMaterial> findByConfigIdInOrderByConfigIdAscStartDateAsc(Collection<Long> configIds);

    void deleteByConfigId(Long configId);

    Optional<LearningScheduleConfigMaterial> findFirstByConfigIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long configId,
            LocalDate start,
            LocalDate end
    );
}
