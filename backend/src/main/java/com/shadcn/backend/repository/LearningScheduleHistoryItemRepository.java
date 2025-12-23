package com.shadcn.backend.repository;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shadcn.backend.model.LearningScheduleHistoryItem;

public interface LearningScheduleHistoryItemRepository extends JpaRepository<LearningScheduleHistoryItem, Long> {

    Page<LearningScheduleHistoryItem> findByHistoryIdOrderByCreatedAtAsc(Long historyId, Pageable pageable);

    @Query("select count(i.id) > 0 " +
            "from LearningScheduleHistoryItem i " +
            "join i.history h " +
            "where h.companyCode = :companyCode " +
            "and upper(h.schedulerType) = upper(:schedulerType) " +
            "and upper(i.waStatus) = 'SENT' " +
            "and upper(i.agentCode) = upper(:agentCode) " +
            "and h.startedAt >= :from and h.startedAt <= :to")
    boolean existsSentForAgentInPeriod(
            @Param("companyCode") String companyCode,
            @Param("schedulerType") String schedulerType,
            @Param("agentCode") String agentCode,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
