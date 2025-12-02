package com.shadcn.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

@RestController
@RequestMapping("/api/placeholder")
@CrossOrigin(origins = "${frontend.url}")
public class PlaceholderController {

    @GetMapping("/{width}/{height}")
    public ResponseEntity<byte[]> generatePlaceholder(
            @PathVariable int width, 
            @PathVariable int height,
            @RequestParam(defaultValue = "CCCCCC") String bgcolor,
            @RequestParam(defaultValue = "666666") String textcolor) {
        
        try {
            // Validasi ukuran
            if (width > 1000 || height > 1000 || width < 1 || height < 1) {
                width = Math.min(Math.max(width, 1), 1000);
                height = Math.min(Math.max(height, 1), 1000);
            }
            
            // Buat image
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = image.createGraphics();
            
            // Background
            g2d.setColor(Color.decode("#" + bgcolor));
            g2d.fillRect(0, 0, width, height);
            
            // Text
            g2d.setColor(Color.decode("#" + textcolor));
            g2d.setFont(new Font("Arial", Font.BOLD, Math.min(width, height) / 8));
            
            String text = width + "×" + height;
            FontMetrics fm = g2d.getFontMetrics();
            int textWidth = fm.stringWidth(text);
            int textHeight = fm.getAscent();
            
            int x = (width - textWidth) / 2;
            int y = (height + textHeight) / 2;
            
            g2d.drawString(text, x, y);
            g2d.dispose();
            
            // Convert ke byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            byte[] imageBytes = baos.toByteArray();
            
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header("Cache-Control", "public, max-age=86400") // Cache 1 hari
                    .body(imageBytes);
                    
        } catch (Exception e) {
            // Return simple 1x1 pixel jika error
            try {
                BufferedImage errorImage = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(errorImage, "png", baos);
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .body(baos.toByteArray());
            } catch (Exception ex) {
                return ResponseEntity.badRequest().build();
            }
        }
    }
}
