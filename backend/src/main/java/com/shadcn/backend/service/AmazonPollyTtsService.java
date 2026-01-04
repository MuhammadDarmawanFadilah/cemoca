package com.shadcn.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AmazonPollyTtsService {
    private static final Logger logger = LoggerFactory.getLogger(AmazonPollyTtsService.class);

    public byte[] synthesizeToMp3(String input, String voiceId) {
        logger.warn("AmazonPollyTtsService is disabled; use D-ID Amazon provider instead");
        throw new UnsupportedOperationException("Direct Amazon Polly usage is disabled");
    }
}
