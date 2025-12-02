package com.shadcn.backend.service;

import com.shadcn.backend.model.Member;
import com.shadcn.backend.repository.MemberRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MemberService {
    
    @Autowired
    private MemberRepository memberRepository;
    
    public Page<Member> getAllMembers(Pageable pageable) {
        return memberRepository.findAll(pageable);
    }
    
    public Page<Member> searchMembers(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return memberRepository.findAll(pageable);
        }
        return memberRepository.findByNamaContainingIgnoreCaseOrEmailContainingIgnoreCaseOrTeleponContaining(
            keyword, keyword, keyword, pageable);
    }
    
    public Member getMemberById(Long id) {
        return memberRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Member not found with id: " + id));
    }
    
    public Member saveMember(Member member) {
        if (member.getId() == null) {
            return createMember(member);
        } else {
            return updateMember(member.getId(), member);
        }
    }
    
    public void deleteMember(Long id) {
        if (!memberRepository.existsById(id)) {
            throw new EntityNotFoundException("Member not found with id: " + id);
        }
        memberRepository.deleteById(id);
    }
    
    public long getMemberCount() {
        return memberRepository.count();
    }
    
    public Member createMember(Member member) {
        validateMember(member);
        member.setCreatedAt(LocalDateTime.now());
        member.setUpdatedAt(LocalDateTime.now());
        
        // Set default values if not provided
        if (member.getPoin() == null) {
            member.setPoin(0);
        }
        if (member.getStatus() == null) {
            member.setStatus(Member.Status.AKTIF);
        }
        if (member.getTingkatPrioritas() == null) {
            member.setTingkatPrioritas(Member.TingkatPrioritas.MENENGAH);
        }
        
        return memberRepository.save(member);
    }
    
    public Member updateMember(Long id, Member updatedMember) {
        Member existingMember = memberRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Member not found with id: " + id));
        
        validateMemberForUpdate(updatedMember, id);
        
        // Update fields
        existingMember.setNama(updatedMember.getNama());
        existingMember.setTelepon(updatedMember.getTelepon());
        existingMember.setEmail(updatedMember.getEmail());
        existingMember.setPekerjaan(updatedMember.getPekerjaan());
        existingMember.setFoto(updatedMember.getFoto());
        existingMember.setTingkatPrioritas(updatedMember.getTingkatPrioritas());
        existingMember.setDeskripsi(updatedMember.getDeskripsi());
        existingMember.setStatus(updatedMember.getStatus());
        existingMember.setAlamat(updatedMember.getAlamat());
        existingMember.setProvinsi(updatedMember.getProvinsi());
        existingMember.setKota(updatedMember.getKota());
        existingMember.setKecamatan(updatedMember.getKecamatan());
        existingMember.setKelurahan(updatedMember.getKelurahan());
        existingMember.setKodePos(updatedMember.getKodePos());
        existingMember.setLatitude(updatedMember.getLatitude());
        existingMember.setLongitude(updatedMember.getLongitude());
        existingMember.setUpdatedAt(LocalDateTime.now());
        
        // Update poin only if provided and not negative
        if (updatedMember.getPoin() != null && updatedMember.getPoin() >= 0) {
            existingMember.setPoin(updatedMember.getPoin());
        }
        
        return memberRepository.save(existingMember);
    }
    
    public List<Member> searchMembers(String keyword, Member.Status status, Member.TingkatPrioritas prioritas) {
        return memberRepository.findMembersWithFilters(keyword, status, prioritas);
    }
    
    public List<Member> getMembersByStatus(Member.Status status) {
        return memberRepository.findByStatus(status);
    }
    
    public List<Member> getMembersByPrioritas(Member.TingkatPrioritas prioritas) {
        return memberRepository.findByTingkatPrioritas(prioritas);
    }
    
    public Member addPoin(Long memberId, Integer poin) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new EntityNotFoundException("Member not found with id: " + memberId));
        
        if (poin < 0) {
            throw new IllegalArgumentException("Poin cannot be negative");
        }
        
        member.setPoin((member.getPoin() != null ? member.getPoin() : 0) + poin);
        member.setUpdatedAt(LocalDateTime.now());
        
        return memberRepository.save(member);
    }
    
    public Member subtractPoin(Long memberId, Integer poin) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new EntityNotFoundException("Member not found with id: " + memberId));
        
        if (poin < 0) {
            throw new IllegalArgumentException("Poin cannot be negative");
        }
        
        int currentPoin = member.getPoin() != null ? member.getPoin() : 0;
        int newPoin = Math.max(0, currentPoin - poin); // Prevent negative points
        
        member.setPoin(newPoin);
        member.setUpdatedAt(LocalDateTime.now());
        
        return memberRepository.save(member);
    }
    
    public long getTotalMembers() {
        return memberRepository.count();
    }
    
    public long getTotalMembersByStatus(Member.Status status) {
        return memberRepository.countByStatus(status);
    }
    
    public Long getTotalPoin() {
        Long total = memberRepository.getTotalPoin();
        return total != null ? total : 0L;
    }
    
    public List<Member> getMembersByWilayah(String provinsi, String kota, String kecamatan, String kelurahan) {
        if (kelurahan != null) {
            return memberRepository.findByKelurahan(kelurahan);
        } else if (kecamatan != null) {
            return memberRepository.findByKecamatan(kecamatan);
        } else if (kota != null) {
            return memberRepository.findByKota(kota);
        } else if (provinsi != null) {
            return memberRepository.findByProvinsi(provinsi);
        } else {
            return memberRepository.findAll();
        }
    }
    
    private void validateMember(Member member) {
        if (member.getNama() == null || member.getNama().trim().isEmpty()) {
            throw new IllegalArgumentException("Nama is required");
        }
        if (member.getEmail() == null || member.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (member.getTelepon() == null || member.getTelepon().trim().isEmpty()) {
            throw new IllegalArgumentException("Telepon is required");
        }
        // Pekerjaan is now optional
        
        // Check for duplicate email
        if (memberRepository.existsByEmailIgnoreCase(member.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        // Check for duplicate telepon
        if (memberRepository.existsByTelepon(member.getTelepon())) {
            throw new IllegalArgumentException("Telepon already exists");
        }
    }
    
    private void validateMemberForUpdate(Member member, Long id) {
        if (member.getNama() == null || member.getNama().trim().isEmpty()) {
            throw new IllegalArgumentException("Nama is required");
        }
        if (member.getEmail() == null || member.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (member.getTelepon() == null || member.getTelepon().trim().isEmpty()) {
            throw new IllegalArgumentException("Telepon is required");
        }
        // Pekerjaan is now optional
        
        // Check for duplicate email (excluding current member)
        if (memberRepository.existsByEmailIgnoreCaseAndIdNot(member.getEmail(), id)) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        // Check for duplicate telepon (excluding current member)
        if (memberRepository.existsByTeleponAndIdNot(member.getTelepon(), id)) {
            throw new IllegalArgumentException("Telepon already exists");
        }
    }
}