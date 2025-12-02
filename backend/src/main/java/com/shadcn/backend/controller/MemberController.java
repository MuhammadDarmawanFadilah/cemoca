package com.shadcn.backend.controller;

import com.shadcn.backend.model.Member;
import com.shadcn.backend.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
@Slf4j
public class MemberController {
    
    private final MemberService memberService;
    
    @GetMapping
    public ResponseEntity<Page<Member>> getAllMembers(Pageable pageable) {
        log.info("Getting all members with pagination");
        try {
            Page<Member> members = memberService.getAllMembers(pageable);
            log.info("Successfully retrieved {} members", members.getTotalElements());
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            log.error("Error retrieving members: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<Member>> searchMembers(
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        log.info("Searching members with keyword: {}", keyword);
        try {
            Page<Member> members = memberService.searchMembers(keyword, pageable);
            log.info("Found {} members matching keyword: {}", members.getTotalElements(), keyword);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            log.error("Error searching members: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Member> getMemberById(@PathVariable Long id) {
        log.info("Getting member by id: {}", id);
        try {
            Member member = memberService.getMemberById(id);
            log.info("Successfully retrieved member: {}", member.getNama());
            return ResponseEntity.ok(member);
        } catch (Exception e) {
            log.error("Error retrieving member with id {}: {}", id, e.getMessage());
            throw e;
        }
    }
    
    @PostMapping
    public ResponseEntity<Member> createMember(@RequestBody Member member) {
        log.info("Creating new member: {}", member.getNama());
        try {
            Member savedMember = memberService.saveMember(member);
            log.info("Successfully created member with id: {}", savedMember.getId());
            return ResponseEntity.ok(savedMember);
        } catch (Exception e) {
            log.error("Error creating member: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Member> updateMember(@PathVariable Long id, @RequestBody Member member) {
        log.info("Updating member with id: {}", id);
        try {
            member.setId(id);
            Member updatedMember = memberService.saveMember(member);
            log.info("Successfully updated member: {}", updatedMember.getNama());
            return ResponseEntity.ok(updatedMember);
        } catch (Exception e) {
            log.error("Error updating member with id {}: {}", id, e.getMessage());
            throw e;
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable Long id) {
        log.info("Deleting member with id: {}", id);
        try {
            memberService.deleteMember(id);
            log.info("Successfully deleted member with id: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting member with id {}: {}", id, e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> getMemberCount() {
        log.info("Getting total member count");
        try {
            long count = memberService.getMemberCount();
            log.info("Total members: {}", count);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error getting member count: {}", e.getMessage());
            throw e;
        }
    }
}