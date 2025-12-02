package com.shadcn.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.draw.LineSeparator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Service for generating personalized PDF documents
 * Uses OpenPDF library for PDF generation
 */
@Service
public class PdfGeneratorService {
    private static final Logger logger = LoggerFactory.getLogger(PdfGeneratorService.class);
    
    @Value("${app.upload.pdf-dir:uploads/pdfs}")
    private String pdfUploadDir;
    
    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;
    
    /**
     * Generate a personalized PDF document
     * @param reportId The report ID
     * @param itemId The item ID
     * @param name The recipient's name
     * @param messageTemplate The message template with :name placeholder
     * @return The generated PDF URL
     */
    public String generatePdf(Long reportId, Long itemId, String name, String messageTemplate) {
        return generatePdf(reportId, itemId, name, messageTemplate, null);
    }
    
    /**
     * Generate a personalized PDF document with recipient list table
     * @param reportId The report ID
     * @param itemId The item ID
     * @param name The recipient's name
     * @param messageTemplate The message template with :name placeholder
     * @param allRecipients List of all recipients (for table display) - can be null
     * @return The generated PDF URL
     */
    public String generatePdf(Long reportId, Long itemId, String name, String messageTemplate, List<RecipientData> allRecipients) {
        try {
            // Get absolute path - resolve relative to user.dir (project root)
            Path basePath = Paths.get(System.getProperty("user.dir")).normalize();
            Path dirPath = basePath.resolve(pdfUploadDir).resolve(String.valueOf(reportId)).normalize();
            
            File dir = dirPath.toFile();
            if (!dir.exists()) {
                boolean created = dir.mkdirs();
                logger.info("[PDF GEN] Directory created: {} -> {}", dirPath, created);
            }
            
            // Generate filename
            String filename = "letter_" + itemId + "_" + System.currentTimeMillis() + ".pdf";
            Path filePath = dirPath.resolve(filename);
            
            logger.info("[PDF GEN] Generating PDF at: {}", filePath);
            
            // Replace placeholders in template
            String personalizedContent = messageTemplate
                    .replace(":name", name)
                    .replace(":date", LocalDate.now().format(DateTimeFormatter.ofPattern("d MMMM yyyy", new Locale("id", "ID"))));
            
            // Create PDF document
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, new FileOutputStream(filePath.toFile()));
            
            document.open();
            
            // Add content
            addDocumentContent(document, personalizedContent, name, allRecipients);
            
            document.close();
            
            logger.info("[PDF GEN] Generated PDF for item {} at {}", itemId, filePath);
            
            // Return the URL to access the PDF
            return backendUrl + "/api/pdf-reports/files/" + reportId + "/" + filename;
            
        } catch (Exception e) {
            logger.error("[PDF GEN] Error generating PDF for item {}: {}", itemId, e.getMessage(), e);
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage());
        }
    }
    
    /**
     * Data class for recipient information
     */
    public static class RecipientData {
        private int rowNumber;
        private String name;
        private String phone;
        
        public RecipientData(int rowNumber, String name, String phone) {
            this.rowNumber = rowNumber;
            this.name = name;
            this.phone = phone;
        }
        
        public int getRowNumber() { return rowNumber; }
        public String getName() { return name; }
        public String getPhone() { return phone; }
    }
    
    /**
     * Add content to the PDF document
     */
    private void addDocumentContent(Document document, String content, String recipientName, List<RecipientData> allRecipients) throws DocumentException {
        // Title font
        Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD, new Color(44, 62, 80));
        
        // Header font
        Font headerFont = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(52, 73, 94));
        
        // Normal font
        Font normalFont = new Font(Font.HELVETICA, 11, Font.NORMAL, new Color(44, 62, 80));
        
        // Small font for date
        Font smallFont = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(127, 140, 141));
        
        // Table fonts
        Font tableHeaderFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
        Font tableCellFont = new Font(Font.HELVETICA, 9, Font.NORMAL, new Color(44, 62, 80));
        Font testingFont = new Font(Font.HELVETICA, 8, Font.BOLDITALIC, new Color(220, 53, 69));
        
        // Add company header/logo placeholder
        Paragraph header = new Paragraph("PERUSAHAAN INOVASI GLOBAL", titleFont);
        header.setAlignment(Element.ALIGN_CENTER);
        document.add(header);
        
        Paragraph subHeader = new Paragraph("Jl. Inovasi No. 123, Jakarta Pusat 10110", smallFont);
        subHeader.setAlignment(Element.ALIGN_CENTER);
        document.add(subHeader);
        
        Paragraph contact = new Paragraph("Telp: (021) 1234567 | Email: info@pig.co.id", smallFont);
        contact.setAlignment(Element.ALIGN_CENTER);
        document.add(contact);
        
        // Add horizontal line
        document.add(new Paragraph(" "));
        document.add(new Chunk(new LineSeparator(1f, 100f, new Color(189, 195, 199), Element.ALIGN_CENTER, 0)));
        document.add(new Paragraph(" "));
        
        // Add date
        String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("d MMMM yyyy", new Locale("id", "ID")));
        Paragraph datePara = new Paragraph(currentDate, smallFont);
        datePara.setAlignment(Element.ALIGN_RIGHT);
        document.add(datePara);
        
        document.add(new Paragraph(" "));
        
        // Add recipient
        Paragraph recipient = new Paragraph("Yth. " + recipientName, headerFont);
        document.add(recipient);
        
        document.add(new Paragraph(" "));
        
        // Add main content - split by newlines and paragraphs
        String[] paragraphs = content.split("\n\n");
        for (String para : paragraphs) {
            if (para.trim().isEmpty()) continue;
            
            // Check if it's a header-like paragraph (short and possibly bold)
            if (para.trim().length() < 80 && !para.contains(".")) {
                Paragraph p = new Paragraph(para.trim(), headerFont);
                document.add(p);
            } else {
                // Regular paragraph
                Paragraph p = new Paragraph(para.trim().replace("\n", " "), normalFont);
                p.setLeading(18f);
                p.setFirstLineIndent(20f);
                document.add(p);
            }
            document.add(new Paragraph(" "));
        }
        
        // ============================================================
        // [TESTING] Add recipients table - WILL BE DELETED LATER
        // ============================================================
        if (allRecipients != null && !allRecipients.isEmpty()) {
            document.add(new Paragraph(" "));
            document.add(new Chunk(new LineSeparator(0.5f, 100f, new Color(220, 53, 69), Element.ALIGN_CENTER, 0)));
            
            // Testing notice - RED warning
            Paragraph testingNotice = new Paragraph();
            testingNotice.add(new Chunk("⚠ [TESTING TABLE - AKAN DIHAPUS] ⚠", testingFont));
            testingNotice.setAlignment(Element.ALIGN_CENTER);
            document.add(testingNotice);
            
            Paragraph testingDesc = new Paragraph("Tabel di bawah ini hanya untuk pengujian dan akan dihapus di versi final", testingFont);
            testingDesc.setAlignment(Element.ALIGN_CENTER);
            document.add(testingDesc);
            
            document.add(new Paragraph(" "));
            
            // Table title
            Paragraph tableTitle = new Paragraph("Daftar Penerima Surat", headerFont);
            tableTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(tableTitle);
            
            // Highlight current recipient
            Paragraph currentInfo = new Paragraph("* Anda adalah penerima No. " + findRecipientNumber(allRecipients, recipientName), smallFont);
            currentInfo.setAlignment(Element.ALIGN_CENTER);
            document.add(currentInfo);
            
            document.add(new Paragraph(" "));
            
            // Create table with 3 columns
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1, 4, 3}); // Column widths
            
            // Table header styling
            Color headerBgColor = new Color(52, 73, 94);
            
            // Header cells
            PdfPCell noHeader = new PdfPCell(new Phrase("No", tableHeaderFont));
            noHeader.setBackgroundColor(headerBgColor);
            noHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
            noHeader.setPadding(8);
            table.addCell(noHeader);
            
            PdfPCell nameHeader = new PdfPCell(new Phrase("Nama", tableHeaderFont));
            nameHeader.setBackgroundColor(headerBgColor);
            nameHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
            nameHeader.setPadding(8);
            table.addCell(nameHeader);
            
            PdfPCell phoneHeader = new PdfPCell(new Phrase("No. Telepon", tableHeaderFont));
            phoneHeader.setBackgroundColor(headerBgColor);
            phoneHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
            phoneHeader.setPadding(8);
            table.addCell(phoneHeader);
            
            // Data rows
            Color alternateBg = new Color(245, 247, 250);
            Color highlightBg = new Color(255, 243, 205); // Yellow highlight for current recipient
            
            for (int i = 0; i < allRecipients.size(); i++) {
                RecipientData recipientData = allRecipients.get(i);
                boolean isCurrentRecipient = recipientData.getName().equalsIgnoreCase(recipientName);
                Color rowBg = isCurrentRecipient ? highlightBg : (i % 2 == 0 ? Color.WHITE : alternateBg);
                
                // Row number
                PdfPCell noCell = new PdfPCell(new Phrase(String.valueOf(recipientData.getRowNumber()), tableCellFont));
                noCell.setBackgroundColor(rowBg);
                noCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                noCell.setPadding(6);
                table.addCell(noCell);
                
                // Name (bold if current recipient)
                Font nameFont = isCurrentRecipient ? 
                    new Font(Font.HELVETICA, 9, Font.BOLD, new Color(44, 62, 80)) : tableCellFont;
                PdfPCell nameCell = new PdfPCell(new Phrase(recipientData.getName() + (isCurrentRecipient ? " *" : ""), nameFont));
                nameCell.setBackgroundColor(rowBg);
                nameCell.setPadding(6);
                table.addCell(nameCell);
                
                // Phone (masked for privacy)
                String maskedPhone = maskPhone(recipientData.getPhone());
                PdfPCell phoneCell = new PdfPCell(new Phrase(maskedPhone, tableCellFont));
                phoneCell.setBackgroundColor(rowBg);
                phoneCell.setPadding(6);
                table.addCell(phoneCell);
            }
            
            document.add(table);
            
            // Footer notice
            document.add(new Paragraph(" "));
            Paragraph footerNotice = new Paragraph("Total: " + allRecipients.size() + " penerima | [DATA INI UNTUK TESTING]", testingFont);
            footerNotice.setAlignment(Element.ALIGN_CENTER);
            document.add(footerNotice);
            
            document.add(new Chunk(new LineSeparator(0.5f, 100f, new Color(220, 53, 69), Element.ALIGN_CENTER, 0)));
        }
        // ============================================================
        // [END TESTING TABLE]
        // ============================================================
        
        // Add signature section
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));
        
        Paragraph regards = new Paragraph("Hormat kami,", normalFont);
        document.add(regards);
        
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));
        
        Paragraph signatureName = new Paragraph("Dr. Anton Wijaya, Ph.D.", headerFont);
        document.add(signatureName);
        
        Paragraph signatureTitle = new Paragraph("Kepala Sumber Daya Manusia", smallFont);
        document.add(signatureTitle);
        
        Paragraph signatureCompany = new Paragraph("Perusahaan Inovasi Global", smallFont);
        document.add(signatureCompany);
    }
    
    /**
     * Find recipient number by name
     */
    private int findRecipientNumber(List<RecipientData> recipients, String name) {
        for (RecipientData recipient : recipients) {
            if (recipient.getName().equalsIgnoreCase(name)) {
                return recipient.getRowNumber();
            }
        }
        return 0;
    }
    
    /**
     * Mask phone number for privacy (show only first 4 and last 2 digits)
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 8) {
            return phone;
        }
        return phone.substring(0, 4) + "****" + phone.substring(phone.length() - 2);
    }
    
    /**
     * Get the file path for a PDF (absolute path)
     */
    public String getPdfFilePath(Long reportId, String filename) {
        Path basePath = Paths.get(System.getProperty("user.dir")).normalize();
        return basePath.resolve(pdfUploadDir).resolve(String.valueOf(reportId)).resolve(filename).normalize().toString();
    }
    
    /**
     * Check if a PDF file exists
     */
    public boolean pdfExists(Long reportId, String filename) {
        File file = new File(getPdfFilePath(reportId, filename));
        return file.exists();
    }
    
    /**
     * Delete a PDF file
     */
    public boolean deletePdf(Long reportId, String filename) {
        File file = new File(getPdfFilePath(reportId, filename));
        if (file.exists()) {
            return file.delete();
        }
        return false;
    }
    
    /**
     * Get the PDF bytes for streaming
     */
    public byte[] getPdfBytes(Long reportId, String filename) throws IOException {
        File file = new File(getPdfFilePath(reportId, filename));
        if (!file.exists()) {
            throw new IOException("PDF file not found: " + filename);
        }
        return java.nio.file.Files.readAllBytes(file.toPath());
    }
}
