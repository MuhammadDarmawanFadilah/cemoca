package com.shadcn.backend.service;

import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.repository.BarangRepository;
import com.shadcn.backend.repository.MemberRepository;
import com.shadcn.backend.repository.PesananRepository;
import com.shadcn.backend.repository.KategoriRepository;
import com.shadcn.backend.model.Pesanan;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final UserRepository userRepository;
    private final BarangRepository barangRepository;
    private final MemberRepository memberRepository;
    private final PesananRepository pesananRepository;
    private final KategoriRepository kategoriRepository;

    public Map<String, Object> getDashboardStats() {
        log.info("Mengambil data statistik dashboard koperasi");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Basic counts
            long totalKaryawan = userRepository.count();
            long totalBarang = barangRepository.count();
            long totalKategori = kategoriRepository.count();
            long totalMember = memberRepository.count();
            long totalPesanan = pesananRepository.count();
            
            // Today's data
            long pesananHariIni = pesananRepository.countTodayOrders();
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);
            BigDecimal pendapatanHariIni = pesananRepository.getTotalRevenueByDateRange(startOfDay, endOfDay);
            if (pendapatanHariIni == null) pendapatanHariIni = BigDecimal.ZERO;
            
            // Monthly data
            LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            LocalDateTime endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()).atTime(23, 59, 59);
            BigDecimal pendapatanBulanIni = pesananRepository.getTotalRevenueByDateRange(startOfMonth, endOfMonth);
            if (pendapatanBulanIni == null) pendapatanBulanIni = BigDecimal.ZERO;
            
            // Stock information
            long barangTersedia = barangRepository.countByStockGreaterThan(0);
            long barangHabis = barangRepository.count() - barangTersedia;
            long stockKritis = barangRepository.countByStockLessThanEqual(10); // Stock <= 10 dianggap kritis
            
            // Order statuses
            long pesananPending = pesananRepository.countByStatus(Pesanan.StatusPesanan.PENDING);
            long pesananProcessing = pesananRepository.countByStatus(Pesanan.StatusPesanan.PROCESSING);
            long pesananCompleted = pesananRepository.countByStatus(Pesanan.StatusPesanan.COMPLETED);
            long pesananCancelled = pesananRepository.countByStatus(Pesanan.StatusPesanan.CANCELLED);
            
            // Build response
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalKaryawan", totalKaryawan);
            stats.put("totalBarang", totalBarang);
            stats.put("totalKategori", totalKategori);
            stats.put("totalMember", totalMember);
            stats.put("totalPesanan", totalPesanan);
            
            stats.put("pesananHariIni", pesananHariIni);
            stats.put("pendapatanHariIni", pendapatanHariIni.doubleValue());
            stats.put("pendapatanBulanIni", pendapatanBulanIni.doubleValue());
            
            stats.put("barangTersedia", barangTersedia);
            stats.put("barangHabis", barangHabis);
            stats.put("stockKritis", stockKritis);
            
            stats.put("pesananPending", pesananPending);
            stats.put("pesananProcessing", pesananProcessing);
            stats.put("pesananCompleted", pesananCompleted);
            stats.put("pesananCancelled", pesananCancelled);
            
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "Data statistik berhasil diambil");
            response.put("timestamp", LocalDateTime.now().toString());
            
            log.info("Statistik dashboard koperasi berhasil diambil");
        } catch (Exception e) {
            log.error("Error mengambil statistik dashboard koperasi: ", e);
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Gagal mengambil data statistik: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now().toString());
        }
        
        return response;
    }
    
    public Map<String, Object> getDashboardCharts() {
        log.info("Mengambil data chart untuk dashboard");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Monthly revenue for the past 6 months
            List<Map<String, Object>> monthlyRevenue = getMonthlyRevenueData();
            
            // Top selling categories
            List<Map<String, Object>> topCategories = getTopSellingCategories();
            
            // Recent orders trend (last 7 days)
            List<Map<String, Object>> ordersTrend = getOrdersTrend();
            
            // Stock status distribution
            Map<String, Object> stockDistribution = getStockDistribution();
            
            Map<String, Object> charts = new HashMap<>();
            charts.put("monthlyRevenue", monthlyRevenue);
            charts.put("topCategories", topCategories);
            charts.put("ordersTrend", ordersTrend);
            charts.put("stockDistribution", stockDistribution);
            
            response.put("success", true);
            response.put("data", charts);
            response.put("message", "Data chart berhasil diambil");
            response.put("timestamp", LocalDateTime.now().toString());
            
            log.info("Data chart dashboard berhasil diambil");
        } catch (Exception e) {
            log.error("Error mengambil data chart dashboard: ", e);
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Gagal mengambil data chart: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now().toString());
        }
        
        return response;
    }
    
    private List<Map<String, Object>> getMonthlyRevenueData() {
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        LocalDate now = LocalDate.now();
        
        for (int i = 5; i >= 0; i--) {
            LocalDate targetMonth = now.minusMonths(i);
            LocalDateTime startOfMonth = targetMonth.withDayOfMonth(1).atStartOfDay();
            LocalDateTime endOfMonth = targetMonth.withDayOfMonth(targetMonth.lengthOfMonth()).atTime(23, 59, 59);
            
            BigDecimal revenue = pesananRepository.getTotalRevenueByDateRange(startOfMonth, endOfMonth);
            if (revenue == null) revenue = BigDecimal.ZERO;
            
            long orderCount = pesananRepository.countCompletedOrdersByDateRange(startOfMonth, endOfMonth);
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", targetMonth.format(DateTimeFormatter.ofPattern("MMM yyyy")));
            monthData.put("monthShort", targetMonth.format(DateTimeFormatter.ofPattern("MMM")));
            monthData.put("revenue", revenue.doubleValue());
            monthData.put("orders", orderCount);
            
            monthlyData.add(monthData);
        }
        
        return monthlyData;
    }
    
    private List<Map<String, Object>> getTopSellingCategories() {
        // Mock data for now - would be implemented with proper repository methods
        List<Map<String, Object>> categories = new ArrayList<>();
        
        Map<String, Object> cat1 = new HashMap<>();
        cat1.put("name", "Beras");
        cat1.put("value", 35);
        cat1.put("color", "#8884d8");
        categories.add(cat1);
        
        Map<String, Object> cat2 = new HashMap<>();
        cat2.put("name", "Gula");
        cat2.put("value", 25);
        cat2.put("color", "#82ca9d");
        categories.add(cat2);
        
        Map<String, Object> cat3 = new HashMap<>();
        cat3.put("name", "Minyak");
        cat3.put("value", 20);
        cat3.put("color", "#ffc658");
        categories.add(cat3);
        
        Map<String, Object> cat4 = new HashMap<>();
        cat4.put("name", "Tepung");
        cat4.put("value", 15);
        cat4.put("color", "#ff7300");
        categories.add(cat4);
        
        Map<String, Object> cat5 = new HashMap<>();
        cat5.put("name", "Lainnya");
        cat5.put("value", 5);
        cat5.put("color", "#00ff00");
        categories.add(cat5);
        
        return categories;
    }
    
    private List<Map<String, Object>> getOrdersTrend() {
        List<Map<String, Object>> trendData = new ArrayList<>();
        LocalDate now = LocalDate.now();
        
        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = now.minusDays(i);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.atTime(23, 59, 59);
            
            long orderCount = pesananRepository.countOrdersByDateRange(startOfDay, endOfDay);
            
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", targetDate.format(DateTimeFormatter.ofPattern("dd/MM")));
            dayData.put("day", targetDate.format(DateTimeFormatter.ofPattern("EEE")));
            dayData.put("orders", orderCount);
            
            trendData.add(dayData);
        }
        
        return trendData;
    }
    
    private Map<String, Object> getStockDistribution() {
        Map<String, Object> distribution = new HashMap<>();
        
        long barangTersedia = barangRepository.countByStockGreaterThan(10);
        long stockKritis = barangRepository.countByStockBetween(1, 10);
        long barangHabis = barangRepository.countByStock(0);
        
        distribution.put("tersedia", barangTersedia);
        distribution.put("kritis", stockKritis);
        distribution.put("habis", barangHabis);
        
        return distribution;
    }
}
