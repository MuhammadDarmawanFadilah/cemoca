package com.shadcn.backend.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class LearningSchedulePlaceholderService {

    public List<String> getPlaceholders(String schedulerTypeRaw) {
        String schedulerType = String.valueOf(schedulerTypeRaw == null ? "" : schedulerTypeRaw)
                .trim()
                .toUpperCase(Locale.ROOT);

        Set<String> placeholders = new LinkedHashSet<>();
        // base placeholders available across all current schedulers
        placeholders.add(":name");
        placeholders.add(":agentCode");
        placeholders.add(":companyName");
        placeholders.add(":learningName");

        if ("HAPPY_BIRTHDAY_NOTIFICATION".equals(schedulerType)) {
            placeholders.add(":birthday");
            placeholders.add(":age");
        }

        if ("CONGRATULATION".equals(schedulerType) || "PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO".equals(schedulerType)) {
            placeholders.add(":policyCount");
            placeholders.add(":month");
            placeholders.add(":year");
        }

        return new ArrayList<>(placeholders);
    }
}
