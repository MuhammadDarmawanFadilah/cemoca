package com.shadcn.backend.service;

import com.shadcn.backend.model.LearningScheduleConfig;
import com.shadcn.backend.model.LearningScheduleHistory;
import com.shadcn.backend.model.SchedulerLogEntry;
import com.shadcn.backend.repository.SchedulerLogEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;

@Service
@RequiredArgsConstructor
public class SchedulerLogService {

    private final SchedulerLogEntryRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void info(String event, LearningScheduleConfig cfg, LearningScheduleHistory history, String message) {
        save("INFO", event, cfg, history, message, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void error(String event, LearningScheduleConfig cfg, LearningScheduleHistory history, String message, Throwable t) {
        save("ERROR", event, cfg, history, message, t);
    }

    private void save(String level, String event, LearningScheduleConfig cfg, LearningScheduleHistory history, String message, Throwable t) {
        SchedulerLogEntry e = new SchedulerLogEntry();
        e.setLevel(level);
        e.setEvent(event);
        e.setLogger("scheduler");
        e.setMessage(message);

        if (cfg != null) {
            e.setConfigId(cfg.getId());
            e.setCompanyCode(cfg.getCompanyCode());
            e.setSchedulerType(String.valueOf(cfg.getSchedulerType()));
        }

        if (history != null) {
            e.setHistoryId(history.getId());
            if (e.getCompanyCode() == null) e.setCompanyCode(history.getCompanyCode());
            if (e.getSchedulerType() == null) e.setSchedulerType(history.getSchedulerType());
        }

        if (t != null) {
            e.setStackTrace(toStackTrace(t));
        }

        repository.save(e);
    }

    private String toStackTrace(Throwable t) {
        try {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            t.printStackTrace(pw);
            pw.flush();
            return sw.toString();
        } catch (Exception ignored) {
            return t.toString();
        }
    }
}
