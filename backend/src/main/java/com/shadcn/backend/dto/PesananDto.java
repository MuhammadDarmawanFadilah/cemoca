package com.shadcn.backend.dto;

import com.shadcn.backend.model.Pesanan;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class PesananDto {
    private Long id;
    private MemberDto member;
    private UserDto karyawan;
    private BigDecimal totalHarga;
    private Integer totalPoin;
    private String status;
    private String tanggalPesanan;
    private String updatedAt;
    private List<DetailPesananDto> details;

    @Data
    public static class MemberDto {
        private Long id;
        private String nama;
        private String email;
        private String telepon;
        private String alamat;
    }

    @Data
    public static class UserDto {
        private Long id;
        private String username;
        private String fullName;
    }

    @Data
    public static class DetailPesananDto {
        private Long id;
        private BarangDto barang;
        private Integer jumlah;
        private BigDecimal hargaSatuan;
        private BigDecimal subtotal;
    }

    @Data
    public static class BarangDto {
        private Long id;
        private String nama;
        private BigDecimal harga;
        private Integer poin;
        private Integer stock;
        private KategoriDto kategori;
        private String gambar;
    }

    @Data
    public static class KategoriDto {
        private Long id;
        private String nama;
    }

    public static PesananDto fromEntity(Pesanan pesanan) {
        PesananDto dto = new PesananDto();
        dto.setId(pesanan.getId());
        dto.setTotalHarga(pesanan.getTotalHarga());
        dto.setTotalPoin(pesanan.getTotalPoin());
        dto.setStatus(pesanan.getStatus().toString());
        dto.setTanggalPesanan(pesanan.getTanggalPesanan().toString());
        dto.setUpdatedAt(pesanan.getUpdatedAt() != null ? pesanan.getUpdatedAt().toString() : null);

        // Convert member
        if (pesanan.getMember() != null) {
            MemberDto memberDto = new MemberDto();
            memberDto.setId(pesanan.getMember().getId());
            memberDto.setNama(pesanan.getMember().getNama());
            memberDto.setEmail(pesanan.getMember().getEmail());
            memberDto.setTelepon(pesanan.getMember().getTelepon());
            memberDto.setAlamat(pesanan.getMember().getAlamat());
            dto.setMember(memberDto);
        }

        // Convert karyawan
        if (pesanan.getKaryawan() != null) {
            UserDto userDto = new UserDto();
            userDto.setId(pesanan.getKaryawan().getId());
            userDto.setUsername(pesanan.getKaryawan().getUsername());
            userDto.setFullName(pesanan.getKaryawan().getFullName());
            dto.setKaryawan(userDto);
        }

        // Convert details
        if (pesanan.getDetails() != null) {
            dto.setDetails(pesanan.getDetails().stream().map(detail -> {
                DetailPesananDto detailDto = new DetailPesananDto();
                detailDto.setId(detail.getId());
                detailDto.setJumlah(detail.getJumlah());
                detailDto.setHargaSatuan(detail.getHargaSatuan());
                detailDto.setSubtotal(detail.getSubtotal());

                // Convert barang
                if (detail.getBarang() != null) {
                    BarangDto barangDto = new BarangDto();
                    barangDto.setId(detail.getBarang().getId());
                    barangDto.setNama(detail.getBarang().getNama());
                    barangDto.setHarga(detail.getBarang().getHarga());
                    barangDto.setPoin(detail.getBarang().getPoin());
                    barangDto.setStock(detail.getBarang().getStock());
                    barangDto.setGambar(detail.getBarang().getGambar());

                    // Convert kategori
                    if (detail.getBarang().getKategori() != null) {
                        KategoriDto kategoriDto = new KategoriDto();
                        kategoriDto.setId(detail.getBarang().getKategori().getId());
                        kategoriDto.setNama(detail.getBarang().getKategori().getNama());
                        barangDto.setKategori(kategoriDto);
                    }

                    detailDto.setBarang(barangDto);
                }

                return detailDto;
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}