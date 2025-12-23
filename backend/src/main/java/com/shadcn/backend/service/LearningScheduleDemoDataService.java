package com.shadcn.backend.service;

import com.shadcn.backend.model.LearningScheduleHistory;
import com.shadcn.backend.model.LearningScheduleHistoryItem;
import com.shadcn.backend.model.MasterAgencyAgent;
import com.shadcn.backend.model.MasterPolicySales;
import com.shadcn.backend.repository.LearningScheduleHistoryItemRepository;
import com.shadcn.backend.repository.LearningScheduleHistoryRepository;
import com.shadcn.backend.repository.MasterAgencyAgentRepository;
import com.shadcn.backend.repository.MasterPolicySalesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LearningScheduleDemoDataService {

    private static final String CREATED_BY = "DEMO_SEEDER";

    private final MasterAgencyAgentRepository masterAgencyAgentRepository;
    private final MasterPolicySalesRepository masterPolicySalesRepository;
    private final LearningScheduleHistoryRepository historyRepository;
    private final LearningScheduleHistoryItemRepository historyItemRepository;

    @Transactional
    public Map<String, Object> seed(String companyCode, List<String> phones) {
        if (companyCode == null || companyCode.isBlank()) {
            throw new IllegalArgumentException("companyCode is required");
        }

        List<String> resolvedPhones = (phones == null) ? List.of() : phones;
        if (resolvedPhones.size() < 4) {
            resolvedPhones = new ArrayList<>(resolvedPhones);
            while (resolvedPhones.size() < 4) {
                resolvedPhones.add("6285600121760");
            }
        }

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        List<DemoAgent> agents = List.of(
                new DemoAgent("DEMO_AG001", "Demo Agent 001", resolvedPhones.get(0), true, true, true),
                new DemoAgent("DEMO_AG002", "Demo Agent 002", resolvedPhones.get(1), true, true, true),
                new DemoAgent("DEMO_AG003", "Demo Agent 003", resolvedPhones.get(2), true, true, true),
                new DemoAgent("DEMO_AG014", "Demo Agent 014", resolvedPhones.get(3), true, false, false),
                new DemoAgent("DEMO_AG028", "Demo Agent 028", resolvedPhones.get(3), true, false, false)
        );

        int createdAgents = 0;
        int updatedAgents = 0;
        for (DemoAgent demo : agents) {
            boolean existed = masterAgencyAgentRepository
                    .findByCompanyCodeAndAgentCodeIgnoreCase(companyCode, demo.agentCode)
                    .isPresent();

            upsertAgencyAgent(companyCode, demo.agentCode, demo.fullName, demo.phoneNo,
                    demo.appointmentYesterday ? yesterday : null,
                    demo.birthdayToday ? today.withYear(1990) : null,
                    demo.active);

            if (existed) {
                updatedAgents++;
            } else {
                createdAgents++;
            }
        }

        int createdPolicies = 0;

        // Ensure 3 agents qualify for CONGRATULATION/PERFORMANCE (>=2 policies this month)
        createdPolicies += upsertPolicy(companyCode, "DEMO_AG001", today, new BigDecimal("800000.00"), new BigDecimal("1000000.00"));
        createdPolicies += upsertPolicy(companyCode, "DEMO_AG001", today.minusDays(2), new BigDecimal("800000.00"), new BigDecimal("1000000.00"));

        createdPolicies += upsertPolicy(companyCode, "DEMO_AG002", today, new BigDecimal("800000.00"), new BigDecimal("1000000.00"));
        createdPolicies += upsertPolicy(companyCode, "DEMO_AG002", today.minusDays(2), new BigDecimal("800000.00"), new BigDecimal("1000000.00"));

        createdPolicies += upsertPolicy(companyCode, "DEMO_AG003", today, new BigDecimal("800000.00"), new BigDecimal("1000000.00"));
        createdPolicies += upsertPolicy(companyCode, "DEMO_AG003", today.minusDays(2), new BigDecimal("800000.00"), new BigDecimal("1000000.00"));

        // TRAINING 14/28 requires last policy date exactly N days ago
        createdPolicies += upsertPolicy(companyCode, "DEMO_AG014", today.minusDays(14), new BigDecimal("400000.00"), new BigDecimal("500000.00"));
        createdPolicies += upsertPolicy(companyCode, "DEMO_AG028", today.minusDays(28), new BigDecimal("400000.00"), new BigDecimal("500000.00"));

        boolean seededCongratsYesterday = seedCongratsSentYesterdayIfMissing(companyCode, yesterday, List.of("DEMO_AG001", "DEMO_AG002", "DEMO_AG003"));

        Map<String, Object> out = new HashMap<>();
        out.put("companyCode", companyCode);
        out.put("today", today.toString());
        out.put("createdAgents", createdAgents);
        out.put("updatedAgents", updatedAgents);
        out.put("createdPolicies", createdPolicies);
        out.put("seededCongratsHistoryYesterday", seededCongratsYesterday);
        out.put("agents", agents.stream().map(a -> Map.of(
                "agentCode", a.agentCode,
                "phoneNo", a.phoneNo,
                "appointmentYesterday", a.appointmentYesterday,
                "birthdayToday", a.birthdayToday
        )).toList());

        return out;
    }

    private void upsertAgencyAgent(
            String companyCode,
            String agentCode,
            String fullName,
            String phoneNo,
            LocalDate appointmentDate,
            LocalDate birthday,
            boolean active
    ) {
        MasterAgencyAgent entity = masterAgencyAgentRepository
                .findByCompanyCodeAndAgentCodeIgnoreCase(companyCode, agentCode)
                .orElseGet(MasterAgencyAgent::new);

        entity.setCompanyCode(companyCode);
        entity.setAgentCode(agentCode);
        entity.setFullName(fullName);
        entity.setShortName(fullName.length() > 40 ? fullName.substring(0, 40) : fullName);
        entity.setPhoneNo(phoneNo);
        entity.setRankCode("DEMO");
        entity.setRankTitle("DEMO");
        entity.setCreatedBy(CREATED_BY);
        entity.setIsActive(active);

        if (appointmentDate != null) {
            entity.setAppointmentDate(appointmentDate);
        }
        if (birthday != null) {
            entity.setBirthday(birthday);
        }

        masterAgencyAgentRepository.save(entity);
    }

    private int upsertPolicy(
            String companyCode,
            String agentCode,
            LocalDate policyDate,
            BigDecimal policyFyp,
            BigDecimal policyApe
    ) {
        LocalDateTime createdAt = LocalDateTime.of(policyDate, LocalTime.NOON);
        if (masterPolicySalesRepository.existsByCompanyCodeAndAgentCodeIgnoreCaseAndCreatedAt(companyCode, agentCode, createdAt)) {
            return 0;
        }

        MasterPolicySales p = new MasterPolicySales();
        p.setCompanyCode(companyCode);
        p.setAgentCode(agentCode);
        p.setPolicyDate(policyDate);
        p.setPolicyFyp(policyFyp);
        p.setPolicyApe(policyApe);
        p.setCreatedBy(CREATED_BY);
        p.setCreatedAt(createdAt);
        p.setUpdatedAt(createdAt);
        masterPolicySalesRepository.save(p);
        return 1;
    }

    private boolean seedCongratsSentYesterdayIfMissing(String companyCode, LocalDate yesterday, List<String> agentCodes) {
        LocalDateTime from = yesterday.atStartOfDay();
        LocalDateTime to = yesterday.atTime(23, 59, 59);

        boolean allExist = true;
        for (String agentCode : agentCodes) {
            boolean exists = historyItemRepository.existsSentForAgentInPeriod(companyCode, "CONGRATULATION", agentCode, from, to);
            if (!exists) {
                allExist = false;
                break;
            }
        }
        if (allExist) {
            return false;
        }

        LearningScheduleHistory h = new LearningScheduleHistory();
        h.setCompanyCode(companyCode);
        h.setSchedulerType("CONGRATULATION");
        h.setStartedAt(from.plusHours(9));
        h.setFinishedAt(from.plusHours(9).plusMinutes(5));
        h.setStatus("SUCCESS");
        h.setTotalTargets(agentCodes.size());
        h.setSentCount(agentCodes.size());
        h.setFailedCount(0);
        h.setSkippedCount(0);
        h.setErrorMessage(null);
        h = historyRepository.save(h);

        for (String agentCode : agentCodes) {
            LearningScheduleHistoryItem item = new LearningScheduleHistoryItem();
            item.setHistory(h);
            item.setAgentCode(agentCode.toUpperCase(Locale.ROOT));
            item.setWaStatus("SENT");
            item.setWaMessageId("DEMO_SEEDED_" + System.currentTimeMillis());
            item.setSentAt(from.plusHours(9));
            historyItemRepository.save(item);
        }

        return true;
    }

    private record DemoAgent(
            String agentCode,
            String fullName,
            String phoneNo,
            boolean active,
            boolean appointmentYesterday,
            boolean birthdayToday
    ) {}
}
