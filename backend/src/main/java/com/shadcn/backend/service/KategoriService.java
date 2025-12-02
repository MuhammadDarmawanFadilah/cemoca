package com.shadcn.backend.service;

import com.shadcn.backend.model.Kategori;
import com.shadcn.backend.repository.KategoriRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class KategoriService {
    
    @Autowired
    private KategoriRepository kategoriRepository;
    
    public List<Kategori> getAllKategori() {
        return kategoriRepository.findAllByOrderByNamaAsc();
    }
    
    public Page<Kategori> getAllKategoriPaginated(Pageable pageable) {
        return kategoriRepository.findAll(pageable);
    }
    
    public Optional<Kategori> getKategoriById(Long id) {
        return kategoriRepository.findById(id);
    }
    
    public Kategori createKategori(Kategori kategori) {
        kategori.setCreatedAt(LocalDateTime.now());
        kategori.setUpdatedAt(LocalDateTime.now());
        return kategoriRepository.save(kategori);
    }
    
    public Kategori updateKategori(Long id, Kategori kategoriDetails) {
        return kategoriRepository.findById(id)
                .map(kategori -> {
                    kategori.setNama(kategoriDetails.getNama());
                    kategori.setDeskripsi(kategoriDetails.getDeskripsi());
                    kategori.setUpdatedAt(LocalDateTime.now());
                    return kategoriRepository.save(kategori);
                })
                .orElseThrow(() -> new RuntimeException("Kategori not found with id: " + id));
    }
    
    public void deleteKategori(Long id) {
        if (!kategoriRepository.existsById(id)) {
            throw new RuntimeException("Kategori not found with id: " + id);
        }
        kategoriRepository.deleteById(id);
    }
    
    public List<Kategori> searchKategoriByNama(String nama) {
        return kategoriRepository.findByNamaContainingIgnoreCase(nama);
    }
    
    public boolean existsByNama(String nama) {
        return kategoriRepository.existsByNamaIgnoreCase(nama);
    }
    
    public boolean existsByNamaAndNotId(String nama, Long id) {
        return kategoriRepository.existsByNamaIgnoreCaseAndIdNot(nama, id);
    }
}