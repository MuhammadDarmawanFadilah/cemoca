package com.shadcn.backend.dto;

import com.shadcn.backend.model.Member;
import lombok.Data;

@Data
public class MemberRequest {
    private String nama;
    private String telepon;
    private String email;
    private Integer poin;
    private String pekerjaan;
    private String foto;
    private Member.TingkatPrioritas tingkatPrioritas;
    private String deskripsi;
    private Member.Status status;
    private String alamat;
    private String provinsi;
    private String kota;
    private String kecamatan;
    private String kelurahan;
    private String kodePos;
    private Double latitude;
    private Double longitude;
}