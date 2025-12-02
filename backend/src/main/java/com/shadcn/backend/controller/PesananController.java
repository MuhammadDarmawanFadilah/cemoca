package com.shadcn.backend.controller;

import com.shadcn.backend.model.Pesanan;
import com.shadcn.backend.model.DetailPesanan;
import com.shadcn.backend.model.Member;
import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Barang;
import com.shadcn.backend.service.PesananService;
import com.shadcn.backend.service.MemberService;
import com.shadcn.backend.service.UserService;
import com.shadcn.backend.service.BarangService;
import com.shadcn.backend.dto.PesananDto;
import com.shadcn.backend.dto.CreatePesananRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/pesanan")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class PesananController {
    
    @Autowired
    private PesananService pesananService;
    
    @Autowired
    private MemberService memberService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private BarangService barangService;
    
    @GetMapping
    public ResponseEntity<List<PesananDto>> getAllPesanan() {
        try {
            List<Pesanan> pesanans = pesananService.getAllPesanan();
            List<PesananDto> pesananDtos = pesanans.stream()
                    .map(PesananDto::fromEntity)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(pesananDtos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/paginated")
    public ResponseEntity<Page<PesananDto>> getAllPesananPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Pesanan> pesanans = pesananService.getAllPesananPaginated(pageable);
            Page<PesananDto> pesananDtos = pesanans.map(PesananDto::fromEntity);
            return ResponseEntity.ok(pesananDtos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<PesananDto>> searchPesanan(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String memberName,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String barangName,
            @RequestParam(required = false) String kategori,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "tanggalPesanan") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Page<Pesanan> pesanans = pesananService.searchPesanan(
                page, size, memberName, status, barangName, kategori, startDate, endDate, sortBy, sortDir);
            Page<PesananDto> pesananDtos = pesanans.map(PesananDto::fromEntity);
            return ResponseEntity.ok(pesananDtos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PesananDto> getPesananById(@PathVariable Long id) {
        try {
            Optional<Pesanan> pesanan = pesananService.getPesananById(id);
            return pesanan.map(p -> ResponseEntity.ok(PesananDto.fromEntity(p)))
                          .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createPesanan(@RequestBody CreatePesananRequest request) {
        try {
            // Create Pesanan object
            Pesanan pesanan = new Pesanan();
            
            // Set member if provided
            if (request.getPesanan().getMemberId() != null) {
                Member member = new Member();
                member.setId(request.getPesanan().getMemberId());
                pesanan.setMember(member);
            }
            
            // Set karyawan if provided
            if (request.getPesanan().getKaryawanId() != null) {
                User karyawan = new User();
                karyawan.setId(request.getPesanan().getKaryawanId());
                pesanan.setKaryawan(karyawan);
            }
            
            // Create detail pesanan list
            List<DetailPesanan> detailPesananList = new ArrayList<>();
            for (CreatePesananRequest.DetailPesananData detailData : request.getDetails()) {
                DetailPesanan detail = new DetailPesanan();
                Barang barang = new Barang();
                barang.setId(detailData.getBarangId());
                detail.setBarang(barang);
                detail.setJumlah(detailData.getJumlah());
                detail.setPesanan(pesanan);
                detailPesananList.add(detail);
            }
            
            // Create pesanan using service
            Pesanan createdPesanan = pesananService.createPesanan(pesanan, detailPesananList);
            
            // Return DTO
            PesananDto pesananDto = PesananDto.fromEntity(createdPesanan);
            return ResponseEntity.ok(pesananDto);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updatePesananStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            if (statusStr == null || statusStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            
            Pesanan.StatusPesanan newStatus = Pesanan.StatusPesanan.valueOf(statusStr.toUpperCase());
            Pesanan updatedPesanan = pesananService.updatePesananStatus(id, newStatus);
            
            PesananDto pesananDto = PesananDto.fromEntity(updatedPesanan);
            return ResponseEntity.ok(pesananDto);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status value"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}