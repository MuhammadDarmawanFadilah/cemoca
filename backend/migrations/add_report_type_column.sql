-- Migration: Add reportType column to video_reports table
-- Date: 2025-01-xx
-- Purpose: Separate PERSONAL_SALES and LEARNING_VIDEO data

-- Add reportType column
ALTER TABLE video_reports ADD COLUMN report_type VARCHAR(50);

-- Update existing records to default type
UPDATE video_reports SET report_type = 'PERSONAL_SALES' WHERE report_type IS NULL;

-- Make column NOT NULL after updating existing data
ALTER TABLE video_reports ALTER COLUMN report_type SET NOT NULL;

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_video_reports_type ON video_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_video_reports_created_at ON video_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_video_reports_status ON video_reports(status);
CREATE INDEX IF NOT EXISTS idx_video_reports_type_created ON video_reports(report_type, created_at);
CREATE INDEX IF NOT EXISTS idx_video_reports_type_status ON video_reports(report_type, status);

-- Verify migration
SELECT 
  report_type,
  COUNT(*) as count 
FROM video_reports 
GROUP BY report_type;
