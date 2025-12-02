package com.shadcn.backend.service;

import com.shadcn.backend.dto.BiografiEditDto;
import com.shadcn.backend.dto.BiografiProfileDto;
import com.shadcn.backend.dto.BiografiFilterRequest;
import com.shadcn.backend.dto.BiografiRequest;
import com.shadcn.backend.dto.BiografiSearchDto;
import com.shadcn.backend.dto.RecipientSummaryDTO;
import com.shadcn.backend.dto.WorkExperienceRequest;
import com.shadcn.backend.dto.AcademicRecordRequest;
import com.shadcn.backend.dto.AchievementRequest;
import com.shadcn.backend.dto.SpesialisasiKedokteranRequest;
import com.shadcn.backend.model.Biografi;
import com.shadcn.backend.model.AcademicRecord;
import com.shadcn.backend.model.Achievement;
import com.shadcn.backend.model.WorkExperience;
import com.shadcn.backend.model.SpesialisasiKedokteran;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.BiografiRepository;
import com.shadcn.backend.repository.AcademicRecordRepository;
import com.shadcn.backend.repository.AchievementRepository;
import com.shadcn.backend.repository.WorkExperienceRepository;
import com.shadcn.backend.repository.SpesialisasiKedokteranRepository;
import com.shadcn.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service class for managing Biografi entities.
 * Optimized with Java 21 features, Lombok, and Spring Boot best practices.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BiografiService {
    
    private final BiografiRepository biografiRepository;
    private final AcademicRecordRepository academicRecordRepository;
    private final AchievementRepository achievementRepository;
    private final WorkExperienceRepository workExperienceRepository;
    private final SpesialisasiKedokteranRepository spesialisasiKedokteranRepository;
    private final UserRepository userRepository;
    private final WilayahService wilayahService;
    private final WilayahCacheService wilayahCacheService;

    /**
     * Get all biografi with pagination and caching
     */
    @Cacheable(value = "biografi", key = "#page + '_' + #size + '_' + #sortBy + '_' + #sortDirection")
    public Page<Biografi> getAllBiografi(int page, int size, String sortBy, String sortDirection) {
        log.debug("Fetching biografi page: {}, size: {}, sortBy: {}, direction: {}", 
                 page, size, sortBy, sortDirection);
        
        Sort sort = sortDirection.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        return biografiRepository.findAll(pageable);
    }    
    // Get biografi with filters
    public Page<Biografi> getBiografiWithFilters(BiografiFilterRequest filterRequest) {
        Sort sort = filterRequest.getSortDirection().equalsIgnoreCase("desc") 
            ? Sort.by(filterRequest.getSortBy()).descending() 
            : Sort.by(filterRequest.getSortBy()).ascending();
        
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
        
        Biografi.StatusBiografi status = null;
        if (filterRequest.getStatus() != null && !filterRequest.getStatus().isEmpty()) {
            try {
                status = Biografi.StatusBiografi.valueOf(filterRequest.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }          return biografiRepository.findBiografiWithFilters(
            status,
            filterRequest.getNama(),
            filterRequest.getNim(),
            filterRequest.getEmail(),
            filterRequest.getNomorTelepon(),
            filterRequest.getJurusan(),
            filterRequest.getPekerjaan(),
            filterRequest.getProgramStudi(),
            filterRequest.getAlumniTahun(),
            filterRequest.getSpesialisasi(),
            filterRequest.getKota(),
            filterRequest.getKecamatan(),
            filterRequest.getKelurahan(),
            filterRequest.getProvinsi(),
            pageable
        );
    }    // Get biografi with filters using DTO to avoid lazy loading issues
    public Page<BiografiSearchDto> getBiografiSearchDto(BiografiFilterRequest filterRequest) {
        Sort sort = filterRequest.getSortDirection().equalsIgnoreCase("desc") 
            ? Sort.by(filterRequest.getSortBy()).descending() 
            : Sort.by(filterRequest.getSortBy()).ascending();
        
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
        
        Biografi.StatusBiografi status = null;
        if (filterRequest.getStatus() != null && !filterRequest.getStatus().isEmpty()) {
            try {
                status = Biografi.StatusBiografi.valueOf(filterRequest.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        
        Page<BiografiSearchDto> page = biografiRepository.findBiografiSearchDto(
            status,
            filterRequest.getNama(),
            filterRequest.getNim(),
            filterRequest.getEmail(),
            filterRequest.getNomorTelepon(),
            filterRequest.getJurusan(),
            filterRequest.getPekerjaan(),
            filterRequest.getProgramStudi(),
            filterRequest.getAlumniTahun(),
            filterRequest.getSpesialisasi(),
            filterRequest.getKota(),
            filterRequest.getKecamatan(),
            filterRequest.getKelurahan(),
            filterRequest.getProvinsi(),
            pageable
        );
        
        // Enrich DTOs with missing fields
        List<BiografiSearchDto> enrichedContent = page.getContent().stream()
            .map(this::enrichBiografiSearchDto)
            .collect(java.util.stream.Collectors.toList());
        
        return new org.springframework.data.domain.PageImpl<>(
            enrichedContent, 
            pageable, 
            page.getTotalElements()
        );
    }

    // Get biografi by ID
    public Optional<Biografi> getBiografiById(Long id) {
        return biografiRepository.findById(id);
    }

    // Get biografi by NIM
    public Optional<Biografi> getBiografiByNim(String nim) {
        return biografiRepository.findByNim(nim);
    }

    // Get biografi by exact name match
    public Optional<Biografi> getBiografiByExactName(String namaLengkap) {
        return biografiRepository.findByNamaLengkap(namaLengkap);
    }    
    // Create new biografi
    @Transactional
    public Biografi createBiografi(BiografiRequest biografiRequest) {
        // Check if NIM already exists (only if NIM is provided)
        if (biografiRequest.getNim() != null && !biografiRequest.getNim().trim().isEmpty() && 
            biografiRepository.existsByNimAndIdNot(biografiRequest.getNim(), null)) {
            throw new RuntimeException("NIM sudah terdaftar: " + biografiRequest.getNim());
        }
        
        // Check if email already exists
        if (biografiRepository.existsByEmailAndIdNot(biografiRequest.getEmail(), null)) {
            throw new RuntimeException("Email sudah terdaftar: " + biografiRequest.getEmail());
        }

        Biografi biografi = new Biografi();
        updateBiografiFromRequest(biografi, biografiRequest);
        
        return biografiRepository.save(biografi);
    }    
    // Update biografi
    @Transactional
    public Biografi updateBiografi(Long id, BiografiRequest biografiRequest) {
        Optional<Biografi> existingBiografi = biografiRepository.findById(id);
        if (existingBiografi.isEmpty()) {
            throw new RuntimeException("Biografi tidak ditemukan dengan ID: " + id);
        }

        // Check if NIM already exists (excluding current record and only if NIM is provided)
        if (biografiRequest.getNim() != null && !biografiRequest.getNim().trim().isEmpty() && 
            biografiRepository.existsByNimAndIdNot(biografiRequest.getNim(), id)) {
            throw new RuntimeException("NIM sudah terdaftar: " + biografiRequest.getNim());
        }
        
        // Check if email already exists (excluding current record)
        if (biografiRepository.existsByEmailAndIdNot(biografiRequest.getEmail(), id)) {
            throw new RuntimeException("Email sudah terdaftar: " + biografiRequest.getEmail());
        }

        Biografi biografi = existingBiografi.get();
        updateBiografiFromRequest(biografi, biografiRequest);
        
        return biografiRepository.save(biografi);
    }

    // Delete biografi (soft delete by changing status)
    @Transactional
    public void deleteBiografi(Long id) {
        Optional<Biografi> biografi = biografiRepository.findById(id);
        if (biografi.isEmpty()) {
            throw new RuntimeException("Biografi tidak ditemukan dengan ID: " + id);
        }
        
        Biografi biografiEntity = biografi.get();
        biografiEntity.setStatus(Biografi.StatusBiografi.TIDAK_AKTIF);
        biografiRepository.save(biografiEntity);
    }    // Hard delete biografi with cascade deletion for users
    @Transactional
    public void hardDeleteBiografi(Long id) {
        if (!biografiRepository.existsById(id)) {
            throw new RuntimeException("Biografi tidak ditemukan dengan ID: " + id);
        }
        
        // Find all users that reference this biografi
        List<User> usersWithBiografi = userRepository.findByBiografiId(id);
        
        // Delete all users that reference this biografi
        if (!usersWithBiografi.isEmpty()) {
            userRepository.deleteAll(usersWithBiografi);
        }
        
        // Delete the biografi
        biografiRepository.deleteById(id);
    }

    // Search biografi by name
    public Page<Biografi> searchBiografiByName(String nama, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("namaLengkap").ascending());
        return biografiRepository.findByNamaLengkapContainingIgnoreCase(nama, pageable);
    }

    // Get biografi by status
    public Page<Biografi> getBiografiByStatus(Biografi.StatusBiografi status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return biografiRepository.findByStatus(status, pageable);
    }

    // Get recent biografi
    public List<Biografi> getRecentBiografi(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return biografiRepository.findRecentBiografi(pageable);
    }

    // Get statistics
    public BiografiStats getBiografiStats() {
        long totalAktif = biografiRepository.countByStatus(Biografi.StatusBiografi.AKTIF);
        long totalTidakAktif = biografiRepository.countByStatus(Biografi.StatusBiografi.TIDAK_AKTIF);
        long totalDraft = biografiRepository.countByStatus(Biografi.StatusBiografi.DRAFT);
        long totalSemua = biografiRepository.count();
          return new BiografiStats(totalSemua, totalAktif, totalTidakAktif, totalDraft);
    }    
    // Helper method to update biografi entity from request
    private void updateBiografiFromRequest(Biografi biografi, BiografiRequest request) {
        biografi.setNamaLengkap(request.getNamaLengkap());
        biografi.setNim(request.getNim());
        biografi.setAlumniTahun(request.getAlumniTahun());
        biografi.setEmail(request.getEmail());
        biografi.setNomorTelepon(request.getNomorTelepon());
        biografi.setJurusan(request.getJurusan());
        biografi.setTanggalLahir(request.getTanggalLahir());
        biografi.setTempatLahir(request.getTempatLahir());
        biografi.setJenisKelamin(request.getJenisKelamin());
        biografi.setAgama(request.getAgama());
        biografi.setTanggalLulus(request.getTanggalLulus());
        biografi.setProgramStudi(request.getProgramStudi());
        biografi.setIpk(request.getIpk());
          // Handle work experiences
        if (request.getWorkExperiences() != null) {
            // Clear existing work experiences if biografi already exists
            if (biografi.getBiografiId() != null) {
                workExperienceRepository.deleteByBiografi_BiografiId(biografi.getBiografiId());
                biografi.getWorkExperiences().clear();
            }
              // Add new work experiences
            for (WorkExperienceRequest workExpRequest : request.getWorkExperiences()) {
                WorkExperience workExp = new WorkExperience();
                workExp.setPosisi(workExpRequest.getPosisi());
                workExp.setPerusahaan(workExpRequest.getPerusahaan());
                workExp.setTanggalMulai(workExpRequest.getTanggalMulai());
                workExp.setMasihBekerja(workExpRequest.isMasihBekerja());
                // Jika masih bekerja, tanggal selesai akan otomatis di-set ke null oleh setter
                if (!workExpRequest.isMasihBekerja()) {
                    workExp.setTanggalSelesai(workExpRequest.getTanggalSelesai());
                }
                workExp.setDeskripsi(workExpRequest.getDeskripsi());
                workExp.setBiografi(biografi);
                biografi.getWorkExperiences().add(workExp);
            }
        }
        if (request.getAcademicRecords() != null) {
            // Clear existing academic records if biografi already exists
            if (biografi.getBiografiId() != null) {
                academicRecordRepository.deleteByBiografi_BiografiId(biografi.getBiografiId());
                biografi.getAcademicRecords().clear();
            }
            
            // Add new academic records
            for (AcademicRecordRequest academicRequest : request.getAcademicRecords()) {
                AcademicRecord academicRecord = new AcademicRecord();
                academicRecord.setJenjangPendidikan(academicRequest.getJenjangPendidikan());
                academicRecord.setUniversitas(academicRequest.getUniversitas());
                academicRecord.setProgramStudi(academicRequest.getProgramStudi());
                academicRecord.setIpk(academicRequest.getIpk());
                academicRecord.setTanggalLulus(academicRequest.getTanggalLulus());
                academicRecord.setBiografi(biografi);
                biografi.getAcademicRecords().add(academicRecord);            }
        }
          // Handle achievements
        if (request.getAchievements() != null) {
            // Clear existing achievements if biografi already exists
            if (biografi.getBiografiId() != null) {
                achievementRepository.deleteByBiografi_BiografiId(biografi.getBiografiId());
                biografi.getAchievements().clear();
            }
            
            // Add new achievements
            for (AchievementRequest achievementRequest : request.getAchievements()) {
                Achievement achievement = new Achievement();
                achievement.setJudul(achievementRequest.getJudul());
                achievement.setPenyelenggara(achievementRequest.getPenyelenggara());
                achievement.setTahun(achievementRequest.getTahun());
                achievement.setDeskripsi(achievementRequest.getDeskripsi());
                achievement.setBiografi(biografi);
                biografi.getAchievements().add(achievement);
            }
        }

        // Handle spesialisasi kedokteran
        if (request.getSpesialisasiKedokteran() != null) {
            // Clear existing spesialisasi kedokteran if biografi already exists
            if (biografi.getBiografiId() != null) {
                spesialisasiKedokteranRepository.deleteByBiografi_BiografiId(biografi.getBiografiId());
                biografi.getSpesialisasiKedokteran().clear();
            }
              // Add new spesialisasi kedokteran
            for (SpesialisasiKedokteranRequest spesialisasiRequest : request.getSpesialisasiKedokteran()) {
                SpesialisasiKedokteran spesialisasi = new SpesialisasiKedokteran();
                spesialisasi.setSpesialisasi(spesialisasiRequest.getSpesialisasi());
                spesialisasi.setLokasiPenempatan(spesialisasiRequest.getLokasiPenempatan());
                spesialisasi.setTanggalMulai(spesialisasiRequest.getTanggalMulai());
                
                // Jika masih bekerja, set tanggalAkhir ke null
                if (spesialisasiRequest.isMasihBekerja()) {
                    spesialisasi.setTanggalAkhir(null);
                } else {
                    spesialisasi.setTanggalAkhir(spesialisasiRequest.getTanggalAkhir());
                }
                
                spesialisasi.setMasihBekerja(spesialisasiRequest.isMasihBekerja());
                spesialisasi.setBiografi(biografi);
                biografi.getSpesialisasiKedokteran().add(spesialisasi);
            }
        }

        // Set career dates
        biografi.setTanggalMasukKerja(request.getTanggalMasukKerja());
        biografi.setTanggalKeluarKerja(request.getTanggalKeluarKerja());        // Set address and cache wilayah data
        biografi.setAlamat(request.getAlamat());
        biografi.setKota(request.getKota());
        biografi.setProvinsi(request.getProvinsi());        biografi.setKecamatan(request.getKecamatan());
        biografi.setKelurahan(request.getKelurahan());
        biografi.setKodePos(request.getKodePos());
        
        // Set GIS coordinates
        biografi.setLatitude(request.getLatitude());
        biografi.setLongitude(request.getLongitude());
        
        // Cache wilayah data for future lookups
        try {
            wilayahCacheService.cacheCompleteAddress(
                request.getProvinsi(), 
                request.getKota(), 
                request.getKecamatan(), 
                request.getKelurahan()
            );
        } catch (Exception e) {
            // Log error but don't fail the biography save
            System.err.println("Warning: Failed to cache wilayah data: " + e.getMessage());
        }biografi.setPrestasi(request.getPrestasi());
        biografi.setHobi(request.getHobi());        biografi.setInstagram(request.getInstagram());
        biografi.setYoutube(request.getYoutube());
        biografi.setLinkedin(request.getLinkedin());
        biografi.setFacebook(request.getFacebook());
        biografi.setTiktok(request.getTiktok());
        biografi.setTelegram(request.getTelegram());
        biografi.setCatatan(request.getCatatan());
        
        // Set photo fields
        biografi.setFoto(request.getFoto());
        biografi.setFotoProfil(request.getFotoProfil());
        
        if (request.getStatus() != null) {
            biografi.setStatus(request.getStatus());
        }
    }

    // Inner class for statistics
    public static class BiografiStats {
        private final long total;
        private final long aktif;
        private final long tidakAktif;
        private final long draft;

        public BiografiStats(long total, long aktif, long tidakAktif, long draft) {
            this.total = total;
            this.aktif = aktif;
            this.tidakAktif = tidakAktif;
            this.draft = draft;
        }

        public long getTotal() { return total; }
        public long getAktif() { return aktif; }
        public long getTidakAktif() { return tidakAktif; }
        public long getDraft() { return draft; }
    }    
    // Optimized method for recipient selection - returns only essential data
    public Page<RecipientSummaryDTO> getRecipientsForSelection(BiografiFilterRequest filterRequest) {
        Sort sort = filterRequest.getSortDirection().equalsIgnoreCase("desc") 
            ? Sort.by(filterRequest.getSortBy()).descending() 
            : Sort.by(filterRequest.getSortBy()).ascending();
        
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);          // Use optimized query specifically for recipient selection
        Page<Biografi> biografiPage = biografiRepository.findActiveRecipientsWithFilters(
            filterRequest.getNama(),
            filterRequest.getNim(),
            filterRequest.getEmail(),
            filterRequest.getNomorTelepon(),
            filterRequest.getJurusan(),
            filterRequest.getPekerjaan(),
            filterRequest.getProgramStudi(),
            filterRequest.getAlumniTahun(),
            filterRequest.getSpesialisasi(),
            filterRequest.getKota(),
            filterRequest.getKecamatan(),
            filterRequest.getKelurahan(),
            filterRequest.getProvinsi(),
            pageable
        );return biografiPage.map(biografi -> {
            // Get the latest work experience position as spesialisasi
            String spesialisasi = null;
            if (biografi.getWorkExperiences() != null && !biografi.getWorkExperiences().isEmpty()) {
                // Find the most recent work experience (by end date, or current job if no end date)
                spesialisasi = biografi.getWorkExperiences().stream()
                    .sorted((a, b) -> {
                        // If both have end dates, sort by end date descending
                        if (a.getTanggalSelesai() != null && b.getTanggalSelesai() != null) {
                            return b.getTanggalSelesai().compareTo(a.getTanggalSelesai());
                        }
                        // If only one has an end date, the one without end date (current job) comes first
                        if (a.getTanggalSelesai() == null && b.getTanggalSelesai() != null) return -1;
                        if (a.getTanggalSelesai() != null && b.getTanggalSelesai() == null) return 1;
                        // If neither has end date, sort by start date descending
                        if (a.getTanggalMulai() != null && b.getTanggalMulai() != null) {
                            return b.getTanggalMulai().compareTo(a.getTanggalMulai());
                        }
                        return 0;
                    })
                    .findFirst()
                    .map(we -> we.getPosisi())
                    .orElse(null);
            }
            
            return new RecipientSummaryDTO(
                biografi.getBiografiId(),
                biografi.getNamaLengkap(),
                biografi.getEmail(),
                biografi.getNomorTelepon(),
                biografi.getJurusan(),
                biografi.getAlumniTahun(),
                spesialisasi
            );
        });
    }

    // Methods for dropdown data
    public List<String> getDistinctJurusan() {
        return biografiRepository.findDistinctJurusan();
    }
      public List<String> getDistinctKota() {
        List<String> kotaCodes = biografiRepository.findDistinctKota();
        return kotaCodes.stream()
            .map(code -> wilayahCacheService.getNamaByKode(code))
            .filter(name -> name != null && !name.isEmpty())
            .distinct()
            .sorted()
            .collect(java.util.stream.Collectors.toList());
    }
    
    public List<String> getDistinctProvinsi() {
        List<String> provinsiCodes = biografiRepository.findDistinctProvinsi();
        return provinsiCodes.stream()
            .map(code -> wilayahCacheService.getNamaByKode(code))
            .filter(name -> name != null && !name.isEmpty())
            .distinct()
            .sorted()
            .collect(java.util.stream.Collectors.toList());
    }
    
    public List<String> getDistinctAlumniTahun() {
        return biografiRepository.findDistinctAlumniTahun();
    }    
    public List<String> getDistinctSpesialisasi() {
        return biografiRepository.findDistinctSpesialisasi();    }
    
    public List<String> getDistinctPekerjaan() {
        return biografiRepository.findDistinctPekerjaan();
    }
      public List<String> getDistinctKecamatan() {
        List<String> kecamatanCodes = biografiRepository.findDistinctKecamatan();
        return kecamatanCodes.stream()
            .map(code -> wilayahCacheService.getNamaByKode(code))
            .filter(name -> name != null && !name.isEmpty())
            .distinct()
            .sorted()
            .collect(java.util.stream.Collectors.toList());
    }
    
    public List<String> getDistinctKelurahan() {
        List<String> kelurahanCodes = biografiRepository.findDistinctKelurahan();
        return kelurahanCodes.stream()
            .map(code -> wilayahCacheService.getNamaByKode(code))
            .filter(name -> name != null && !name.isEmpty())
            .distinct()
            .sorted()
            .collect(java.util.stream.Collectors.toList());
    }

    // Methods to get location mappings for frontend filter handling
    public Map<String, String> getProvinsiMappings() {
        List<String> provinsiCodes = biografiRepository.findDistinctProvinsi();
        Map<String, String> mappings = new HashMap<>();
        
        for (String code : provinsiCodes) {
            String nama = wilayahCacheService.getNamaByKode(code);
            if (nama != null && !nama.isEmpty()) {
                mappings.put(nama, code); // name -> code mapping
            }
        }
        return mappings;
    }

    public Map<String, String> getKotaMappings() {
        List<String> kotaCodes = biografiRepository.findDistinctKota();
        Map<String, String> mappings = new HashMap<>();
        
        for (String code : kotaCodes) {
            String nama = wilayahCacheService.getNamaByKode(code);
            if (nama != null && !nama.isEmpty()) {
                mappings.put(nama, code); // name -> code mapping
            }
        }
        return mappings;
    }

    public Map<String, String> getKecamatanMappings() {
        List<String> kecamatanCodes = biografiRepository.findDistinctKecamatan();
        Map<String, String> mappings = new HashMap<>();
        
        for (String code : kecamatanCodes) {
            String nama = wilayahCacheService.getNamaByKode(code);
            if (nama != null && !nama.isEmpty()) {
                mappings.put(nama, code); // name -> code mapping
            }
        }
        return mappings;
    }

    public Map<String, String> getKelurahanMappings() {
        List<String> kelurahanCodes = biografiRepository.findDistinctKelurahan();
        Map<String, String> mappings = new HashMap<>();
        
        for (String code : kelurahanCodes) {
            String nama = wilayahCacheService.getNamaByKode(code);
            if (nama != null && !nama.isEmpty()) {
                mappings.put(nama, code); // name -> code mapping
            }
        }
        return mappings;
    }

    // Birthday related methods
    public List<Biografi> getAlumniByBirthday(java.time.LocalDate date) {
        return biografiRepository.findTodayBirthdays(date.getMonthValue(), date.getDayOfMonth());
    }
    
    public List<Biografi> getAllWithBirthdays() {
        return biografiRepository.findAllWithBirthdays();
    }
      public List<Biografi> getBirthdaysByMonth(int month) {
        return biografiRepository.findBirthdaysByMonth(month);
    }

    // Get biografi by exact name match using DTO to avoid lazy loading issues
    public Optional<BiografiSearchDto> getBiografiDtoByExactName(String namaLengkap) {
        return biografiRepository.findBiografiDtoByNamaLengkap(namaLengkap);
    }    // Get biografi by ID using DTO to avoid lazy loading issues
    public Optional<BiografiSearchDto> getBiografiDtoById(Long id) {
        Optional<BiografiSearchDto> dtoOpt = biografiRepository.findBiografiDtoById(id);
        if (dtoOpt.isPresent()) {
            // Enrich with relationship data (academicRecords, achievements, etc.)
            BiografiSearchDto enrichedDto = enrichBiografiSearchDto(dtoOpt.get());
            return Optional.of(enrichedDto);
        }
        return Optional.empty();
    }    // Get biografi by NIM using DTO to avoid lazy loading issues
    public Optional<BiografiSearchDto> getBiografiDtoByNim(String nim) {
        Optional<BiografiSearchDto> dtoOpt = biografiRepository.findBiografiDtoByNim(nim);
        if (dtoOpt.isPresent()) {
            // Enrich with relationship data (academicRecords, achievements, etc.)
            BiografiSearchDto enrichedDto = enrichBiografiSearchDto(dtoOpt.get());
            return Optional.of(enrichedDto);
        }
        return Optional.empty();
    }

    // Get all biografi with pagination using DTO to avoid lazy loading issues
    public Page<BiografiSearchDto> getAllBiografiDto(int page, int size, String sortBy, String sortDirection) {
        Sort sort = sortDirection.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        return biografiRepository.findAllBiografiDto(pageable);
    }

    // Get biografi by status using DTO to avoid lazy loading issues
    public Page<BiografiSearchDto> getBiografiDtoByStatus(Biografi.StatusBiografi status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return biografiRepository.findBiografiDtoByStatus(status, pageable);
    }

    // Search biografi by name using DTO to avoid lazy loading issues
    public Page<BiografiSearchDto> searchBiografiDtoByName(String nama, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("namaLengkap").ascending());
        return biografiRepository.findBiografiDtoByNamaContaining(nama, pageable);
    }
    
    // Get alumni with coordinates for map display
    public List<Map<String, Object>> getAlumniWithCoordinates(
            String provinsi, String kota, String kecamatan, String kelurahan, String kodePos) {
        
        List<Biografi> biografiList;
        
        // Build query based on provided filters
        if (provinsi != null && !provinsi.trim().isEmpty()) {
            if (kota != null && !kota.trim().isEmpty()) {
                if (kecamatan != null && !kecamatan.trim().isEmpty()) {
                    if (kelurahan != null && !kelurahan.trim().isEmpty()) {
                        biografiList = biografiRepository.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndProvinsiContainingIgnoreCaseAndKotaContainingIgnoreCaseAndKecamatanContainingIgnoreCaseAndKelurahanContainingIgnoreCase(
                            Biografi.StatusBiografi.AKTIF, provinsi, kota, kecamatan, kelurahan);
                    } else {
                        biografiList = biografiRepository.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndProvinsiContainingIgnoreCaseAndKotaContainingIgnoreCaseAndKecamatanContainingIgnoreCase(
                            Biografi.StatusBiografi.AKTIF, provinsi, kota, kecamatan);
                    }
                } else {
                    biografiList = biografiRepository.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndProvinsiContainingIgnoreCaseAndKotaContainingIgnoreCase(
                        Biografi.StatusBiografi.AKTIF, provinsi, kota);
                }
            } else {
                biografiList = biografiRepository.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndProvinsiContainingIgnoreCase(
                    Biografi.StatusBiografi.AKTIF, provinsi);
            }
        } else if (kodePos != null && !kodePos.trim().isEmpty()) {
            biografiList = biografiRepository.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNullAndKodePosContaining(
                Biografi.StatusBiografi.AKTIF, kodePos);
        } else {
            biografiList = biografiRepository.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(
                Biografi.StatusBiografi.AKTIF);
        }
        
        return biografiList.stream().map(biografi -> {
            Map<String, Object> location = new HashMap<>();
            location.put("biografiId", biografi.getBiografiId());
            location.put("namaLengkap", biografi.getNamaLengkap());
            location.put("alumniTahun", biografi.getAlumniTahun());
            location.put("jurusan", biografi.getJurusan());
            location.put("latitude", biografi.getLatitude());
            location.put("longitude", biografi.getLongitude());
            location.put("fotoProfil", biografi.getFotoProfil());
            location.put("foto", biografi.getFoto());
            location.put("kota", biografi.getKota());
            location.put("provinsi", biografi.getProvinsi());
            location.put("kecamatan", biografi.getKecamatan());
            location.put("kelurahan", biografi.getKelurahan());
            location.put("kodePos", biografi.getKodePos());
            location.put("alamat", biografi.getAlamat());
            return location;
        }).toList();    }    // Get alumni with coordinates for map display using advanced filters
    public List<Map<String, Object>> getAlumniWithCoordinatesAdvanced(
            String search, String provinsi, String kota, String kecamatan, String kelurahan, 
            String kodePos, String spesialisasi, String pekerjaan, String alumniTahun) {
        
        // Create filter request
        BiografiFilterRequest filterRequest = new BiografiFilterRequest();
        filterRequest.setNama(search);
        filterRequest.setProvinsi(provinsi);
        filterRequest.setKota(kota);
        filterRequest.setKecamatan(kecamatan);
        filterRequest.setKelurahan(kelurahan);
        // Note: kodePos is not supported in BiografiFilterRequest, will be filtered separately
        filterRequest.setSpesialisasi(spesialisasi);
        filterRequest.setPekerjaan(pekerjaan);
        filterRequest.setAlumniTahun(alumniTahun);
        filterRequest.setStatus("AKTIF");
        filterRequest.setPage(0);
        filterRequest.setSize(10000); // Get all results for map
        filterRequest.setSortBy("namaLengkap");
        filterRequest.setSortDirection("asc");
        
        // Get filtered biografi
        Page<Biografi> biografiPage = getBiografiWithFilters(filterRequest);
        List<Biografi> biografiList = biografiPage.getContent();
        
        // Additional filter for kodePos if provided
        if (kodePos != null && !kodePos.trim().isEmpty()) {
            biografiList = biografiList.stream()
                .filter(biografi -> biografi.getKodePos() != null && 
                       biografi.getKodePos().contains(kodePos))
                .collect(Collectors.toList());
        }
        
        // Filter only those with coordinates and convert to map
        return biografiList.stream()
            .filter(biografi -> biografi.getLatitude() != null && biografi.getLongitude() != null)
            .map(biografi -> {
                Map<String, Object> location = new HashMap<>();
                location.put("biografiId", biografi.getBiografiId());
                location.put("namaLengkap", biografi.getNamaLengkap());
                location.put("alumniTahun", biografi.getAlumniTahun());
                location.put("jurusan", biografi.getJurusan());
                location.put("latitude", biografi.getLatitude());
                location.put("longitude", biografi.getLongitude());                location.put("fotoProfil", biografi.getFotoProfil());
                location.put("foto", biografi.getFoto());
                location.put("kota", biografi.getKota());
                location.put("provinsi", biografi.getProvinsi());
                location.put("kecamatan", biografi.getKecamatan());
                location.put("kelurahan", biografi.getKelurahan());
                
                location.put("kodePos", biografi.getKodePos());
                location.put("alamat", biografi.getAlamat());
                return location;
            })
            .collect(Collectors.toList());
    }

    // Get biografi for editing with location details
    public Optional<BiografiEditDto> getBiografiForEdit(Long id) {
        // Use the helper method to fetch biografi with all relationships
        Optional<Biografi> biografiOpt = findByIdWithAllRelations(id);
        if (biografiOpt.isEmpty()) {
            return Optional.empty();
        }
        
        Biografi biografi = biografiOpt.get();
        BiografiEditDto editDto = mapToEditDto(biografi);
        
        // Get location names
        enrichWithLocationNames(editDto);
        
        return Optional.of(editDto);
    }
    
    private BiografiEditDto mapToEditDto(Biografi biografi) {
        BiografiEditDto dto = new BiografiEditDto();
        
        dto.setBiografiId(biografi.getBiografiId());
        dto.setNamaLengkap(biografi.getNamaLengkap());
        dto.setNim(biografi.getNim());
        dto.setAlumniTahun(biografi.getAlumniTahun());
        dto.setEmail(biografi.getEmail());
        dto.setNomorTelepon(biografi.getNomorTelepon());
        dto.setFotoProfil(biografi.getFotoProfil());
        dto.setJurusan(biografi.getJurusan());
        dto.setProgramStudi(biografi.getProgramStudi());
        dto.setTanggalLulus(biografi.getTanggalLulus());
        dto.setIpk(biografi.getIpk());
        dto.setTanggalLahir(biografi.getTanggalLahir());
        dto.setTempatLahir(biografi.getTempatLahir());
        dto.setJenisKelamin(biografi.getJenisKelamin());
        dto.setAgama(biografi.getAgama());
        dto.setFoto(biografi.getFoto());
        dto.setAlamat(biografi.getAlamat());
        dto.setKota(biografi.getKota());
        dto.setProvinsi(biografi.getProvinsi());
        dto.setKecamatan(biografi.getKecamatan());
        dto.setKelurahan(biografi.getKelurahan());
        dto.setKodePos(biografi.getKodePos());
        dto.setLatitude(biografi.getLatitude());
        dto.setLongitude(biografi.getLongitude());
        dto.setInstagram(biografi.getInstagram());
        dto.setYoutube(biografi.getYoutube());
        dto.setLinkedin(biografi.getLinkedin());
        dto.setFacebook(biografi.getFacebook());
        dto.setTiktok(biografi.getTiktok());
        dto.setTelegram(biografi.getTelegram());        dto.setCatatan(biografi.getCatatan());
        dto.setStatus(biografi.getStatus());
        dto.setCreatedAt(biografi.getCreatedAt());
        dto.setUpdatedAt(biografi.getUpdatedAt());
        
        // Set the new fields
        dto.setPrestasi(biografi.getPrestasi());
        dto.setHobi(biografi.getHobi());
        dto.setPosisiJabatan(biografi.getPekerjaanSaatIni()); // Use the derived method
        dto.setAcademicRecords(biografi.getAcademicRecords());
        dto.setAchievements(biografi.getAchievements());
        dto.setWorkExperiences(biografi.getWorkExperiences());
        dto.setSpesialisasiKedokteran(biografi.getSpesialisasiKedokteran());
        
        return dto;
    }    // Get current user's biografi as simple profile DTO (no collections to avoid N+1)
    public Optional<BiografiProfileDto> getMyBiografiProfile(Long userId) {
        Optional<BiografiRepository.BiografiProfileProjection> projectionOpt = biografiRepository.findProfileByUserId(userId);
        if (projectionOpt.isEmpty()) {
            return Optional.empty();
        }
        
        BiografiRepository.BiografiProfileProjection projection = projectionOpt.get();
        BiografiProfileDto profileDto = mapFromProjection(projection);
        
        return Optional.of(profileDto);
    }
    
    // Legacy method for backward compatibility
    public Optional<BiografiProfileDto> getMyBiografiProfile(User user) {
        if (user == null || user.getBiografi() == null) {
            return Optional.empty();
        }
        
        Biografi biografi = user.getBiografi();
        BiografiProfileDto profileDto = mapToProfileDto(biografi);
        
        return Optional.of(profileDto);
    }
    
    private BiografiProfileDto mapToProfileDto(Biografi biografi) {
        BiografiProfileDto dto = new BiografiProfileDto();
        
        dto.setBiografiId(biografi.getBiografiId());
        dto.setNamaLengkap(biografi.getNamaLengkap());
        dto.setNim(biografi.getNim());
        dto.setAlumniTahun(biografi.getAlumniTahun());
        dto.setEmail(biografi.getEmail());
        dto.setNomorTelepon(biografi.getNomorTelepon());
        dto.setFotoProfil(biografi.getFotoProfil());
        dto.setFoto(biografi.getFoto());
        dto.setJurusan(biografi.getJurusan());
        dto.setProgramStudi(biografi.getProgramStudi());
        dto.setTanggalLulus(biografi.getTanggalLulus());
        dto.setIpk(biografi.getIpk());
        dto.setTanggalLahir(biografi.getTanggalLahir());
        dto.setTempatLahir(biografi.getTempatLahir());
        dto.setJenisKelamin(biografi.getJenisKelamin());
        dto.setAgama(biografi.getAgama());
        dto.setAlamat(biografi.getAlamat());
        dto.setKota(biografi.getKota());
        dto.setProvinsi(biografi.getProvinsi());
        dto.setKecamatan(biografi.getKecamatan());
        dto.setKelurahan(biografi.getKelurahan());
        dto.setKodePos(biografi.getKodePos());
        dto.setLatitude(biografi.getLatitude());
        dto.setLongitude(biografi.getLongitude());
        dto.setInstagram(biografi.getInstagram());
        dto.setYoutube(biografi.getYoutube());
        dto.setLinkedin(biografi.getLinkedin());
        dto.setFacebook(biografi.getFacebook());
        dto.setTiktok(biografi.getTiktok());
        dto.setTelegram(biografi.getTelegram());
        dto.setCatatan(biografi.getCatatan());
        dto.setPrestasi(biografi.getPrestasi());
        dto.setHobi(biografi.getHobi());
        dto.setStatus(biografi.getStatus());
        dto.setCreatedAt(biografi.getCreatedAt());
        dto.setUpdatedAt(biografi.getUpdatedAt());
        
        return dto;
    }

    // Get current user's biografi as DTO
    public Optional<BiografiEditDto> getMyBiografiForUser(User user) {
        if (user == null || user.getBiografi() == null) {
            return Optional.empty();
        }
        
        Biografi biografi = user.getBiografi();
        BiografiEditDto editDto = mapToEditDto(biografi);
        
        // Get location names
        enrichWithLocationNames(editDto);
        
        return Optional.of(editDto);
    }

    private void enrichWithLocationNames(BiografiEditDto dto) {
        try {
            // Get province name
            if (dto.getProvinsi() != null && !dto.getProvinsi().isEmpty()) {
                Map<String, Object> provinces = wilayahService.getProvinces();
                if (provinces != null && provinces.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> provinceList = (java.util.List<Map<String, Object>>) provinces.get("data");
                    for (Map<String, Object> province : provinceList) {
                        if (dto.getProvinsi().equals(province.get("code"))) {
                            dto.setProvinsiNama((String) province.get("name"));
                            break;
                        }
                    }
                }
            }
            
            // Get regency/city name
            if (dto.getKota() != null && !dto.getKota().isEmpty() && dto.getProvinsi() != null) {
                Map<String, Object> regencies = wilayahService.getRegencies(dto.getProvinsi());
                if (regencies != null && regencies.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> regencyList = (java.util.List<Map<String, Object>>) regencies.get("data");
                    for (Map<String, Object> regency : regencyList) {
                        if (dto.getKota().equals(regency.get("code"))) {
                            dto.setKotaNama((String) regency.get("name"));
                            break;
                        }
                    }
                }
            }
            
            // Get district name
            if (dto.getKecamatan() != null && !dto.getKecamatan().isEmpty() && dto.getKota() != null) {
                Map<String, Object> districts = wilayahService.getDistricts(dto.getKota());
                if (districts != null && districts.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> districtList = (java.util.List<Map<String, Object>>) districts.get("data");
                    for (Map<String, Object> district : districtList) {
                        if (dto.getKecamatan().equals(district.get("code"))) {
                            dto.setKecamatanNama((String) district.get("name"));
                            break;
                        }
                    }
                }
            }
            
            // Get village name
            if (dto.getKelurahan() != null && !dto.getKelurahan().isEmpty() && dto.getKecamatan() != null) {
                Map<String, Object> villages = wilayahService.getVillages(dto.getKecamatan());
                if (villages != null && villages.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> villageList = (java.util.List<Map<String, Object>>) villages.get("data");
                    for (Map<String, Object> village : villageList) {
                        if (dto.getKelurahan().equals(village.get("code"))) {
                            dto.setKelurahanNama((String) village.get("name"));
                            break;
                        }
                    }
                }
            }        } catch (Exception e) {
            // Log error but don't fail the request
            log.warn("Failed to enrich location names for biografi {}: {}", dto.getBiografiId(), e.getMessage());
        }
    }
    
    /**
     * Enrich BiografiSearchDto with missing fields by loading full biografi data
     */    private BiografiSearchDto enrichBiografiSearchDto(BiografiSearchDto dto) {
        try {            // Load full biografi with relationships to get missing data
            Optional<Biografi> biografiOpt = findByIdWithAllRelations(dto.getBiografiId());
            if (biografiOpt.isPresent()) {
                Biografi biografi = biografiOpt.get();
                
                // Set the missing fields
                dto.setPrestasi(biografi.getPrestasi());
                dto.setHobi(biografi.getHobi());
                dto.setPekerjaanSaatIni(biografi.getPekerjaanSaatIni());
                dto.setAcademicRecords(biografi.getAcademicRecords());
                dto.setAchievements(biografi.getAchievements());
                dto.setWorkExperiences(biografi.getWorkExperiences());
                dto.setSpesialisasiKedokteran(biografi.getSpesialisasiKedokteran());
            }            // Enrich with location names
            enrichSearchDtoWithLocationNames(dto);
        } catch (Exception e) {
            // Log error but don't fail the search
            System.err.println("Warning: Failed to enrich BiografiSearchDto for ID " + dto.getBiografiId() + ": " + e.getMessage());
        }
        return dto;
    }
    
    /**
     * Helper method to load a biografi with all its relationships using separate queries
     * to avoid Hibernate's MultipleBagFetchException when fetching multiple List collections
     */
    private Optional<Biografi> findByIdWithAllRelations(Long id) {
        // First, get the base biografi without any relationships
        Optional<Biografi> biografiOpt = biografiRepository.findById(id);
        if (biografiOpt.isEmpty()) {
            return Optional.empty();
        }
        
        // Load each relationship separately and merge the results
        // Hibernate will cache the entity, so these queries will populate the collections
        biografiRepository.findByIdWithWorkExperiences(id);
        biografiRepository.findByIdWithAchievements(id);
        biografiRepository.findByIdWithAcademicRecords(id);
        biografiRepository.findByIdWithSpesialisasi(id);
        
        // Return the original entity reference which now has all collections loaded
        return biografiOpt;
    }
    
    private void enrichSearchDtoWithLocationNames(BiografiSearchDto dto) {
        try {
            // Get province name
            if (dto.getProvinsi() != null && !dto.getProvinsi().isEmpty()) {
                Map<String, Object> provinces = wilayahService.getProvinces();
                if (provinces != null && provinces.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> provinceList = (java.util.List<Map<String, Object>>) provinces.get("data");
                    for (Map<String, Object> province : provinceList) {
                        if (dto.getProvinsi().equals(province.get("code"))) {
                            dto.setProvinsiNama((String) province.get("name"));
                            break;
                        }
                    }
                }
            }
            
            // Get regency/city name
            if (dto.getKota() != null && !dto.getKota().isEmpty() && dto.getProvinsi() != null) {
                Map<String, Object> regencies = wilayahService.getRegencies(dto.getProvinsi());
                if (regencies != null && regencies.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> regencyList = (java.util.List<Map<String, Object>>) regencies.get("data");
                    for (Map<String, Object> regency : regencyList) {
                        if (dto.getKota().equals(regency.get("code"))) {
                            dto.setKotaNama((String) regency.get("name"));
                            break;
                        }
                    }
                }
            }
            
            // Get district name
            if (dto.getKecamatan() != null && !dto.getKecamatan().isEmpty() && dto.getKota() != null) {
                Map<String, Object> districts = wilayahService.getDistricts(dto.getKota());
                if (districts != null && districts.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> districtList = (java.util.List<Map<String, Object>>) districts.get("data");
                    for (Map<String, Object> district : districtList) {
                        if (dto.getKecamatan().equals(district.get("code"))) {
                            dto.setKecamatanNama((String) district.get("name"));
                            break;
                        }
                    }
                }
            }
            
            // Get village name
            if (dto.getKelurahan() != null && !dto.getKelurahan().isEmpty() && dto.getKecamatan() != null) {
                Map<String, Object> villages = wilayahService.getVillages(dto.getKecamatan());
                if (villages != null && villages.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> villageList = (java.util.List<Map<String, Object>>) villages.get("data");
                    for (Map<String, Object> village : villageList) {
                        if (dto.getKelurahan().equals(village.get("code"))) {
                            dto.setKelurahanNama((String) village.get("name"));
                            break;
                        }
                    }
                }
            }        } catch (Exception e) {
            // Log error but don't fail the request
            log.warn("Failed to enrich location names for biografi {}: {}", dto.getBiografiId(), e.getMessage());
        }
    }
      private BiografiProfileDto mapFromProjection(BiografiRepository.BiografiProfileProjection projection) {
        BiografiProfileDto dto = new BiografiProfileDto();
        
        dto.setBiografiId(projection.getBiografiId());
        dto.setNamaLengkap(projection.getNamaLengkap());
        dto.setEmail(projection.getEmail());
        dto.setNomorTelepon(projection.getNomorTelepon());
        dto.setFoto(projection.getFoto());
        dto.setFotoProfil(projection.getFotoProfil());
        dto.setJurusan(projection.getJurusan());
        dto.setAlumniTahun(projection.getAlumniTahun());
        dto.setStatus(Biografi.StatusBiografi.valueOf(projection.getStatus()));
        
        return dto;
    }
}
