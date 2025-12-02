package com.shadcn.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "cors")
public class CorsProperties {
    
    private String allowedOrigins = "http://localhost:3000";
    private String allowedOriginPatterns = "http://localhost:*";
    private String allowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
    private String allowedHeaders = "Content-Type,Authorization,X-Requested-With";
    private boolean allowCredentials = true;
    
    public String getAllowedOrigins() {
        return allowedOrigins;
    }
    
    public void setAllowedOrigins(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }
    
    public String getAllowedOriginPatterns() {
        return allowedOriginPatterns;
    }
    
    public void setAllowedOriginPatterns(String allowedOriginPatterns) {
        this.allowedOriginPatterns = allowedOriginPatterns;
    }
    
    public boolean isAllowCredentials() {
        return allowCredentials;
    }
    
    public void setAllowCredentials(boolean allowCredentials) {
        this.allowCredentials = allowCredentials;
    }
    
    public String getAllowedMethods() {
        return allowedMethods;
    }
    
    public void setAllowedMethods(String allowedMethods) {
        this.allowedMethods = allowedMethods;
    }
    
    public String getAllowedHeaders() {
        return allowedHeaders;
    }
    
    public void setAllowedHeaders(String allowedHeaders) {
        this.allowedHeaders = allowedHeaders;
    }
      public String[] getAllowedOriginsArray() {
        return allowedOrigins.split(",");
    }
    
    public String[] getAllowedOriginPatternsArray() {
        return allowedOriginPatterns.split(",");
    }
    
    public String[] getAllowedMethodsArray() {
        return allowedMethods.split(",");
    }
    
    public String[] getAllowedHeadersArray() {
        return allowedHeaders.split(",");
    }
}
