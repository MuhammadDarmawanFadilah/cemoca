$baseUrl = "http://localhost:8080/api"
$categories = @("UMUM", "AKADEMIK", "KARIR", "ALUMNI", "TEKNOLOGI", "OLAHRAGA", "KEGIATAN")

$beritaTitles = @(
    "Inovasi Terbaru dalam Dunia Kesehatan Digital",
    "Tips Menjaga Kesehatan Mental di Era Modern",
    "Teknologi AI untuk Diagnosis Penyakit Lebih Akurat",
    "Pentingnya Olahraga Rutin untuk Jantung Sehat",
    "Alumni Kedokteran Raih Penghargaan Internasional",
    "Workshop Kesehatan Masyarakat Sukses Digelar",
    "Penelitian Terbaru: Manfaat Vitamin D untuk Imunitas",
    "Karir di Bidang Kesehatan: Peluang dan Tantangan",
    "Festival Olahraga Kesehatan Kampus 2026",
    "Teknologi Wearable untuk Monitoring Kesehatan",
    "Seminar Nasional Kesehatan dan Nutrisi",
    "Alumni Sukses: Kisah Dokter Spesialis Jantung",
    "Panduan Lengkap Diet Sehat untuk Pemula",
    "Kegiatan Bakti Sosial Pemeriksaan Kesehatan Gratis",
    "Perkembangan Vaksin Terbaru di Indonesia",
    "Tips Produktif bekerja dari Rumah",
    "Olahraga Ringan untuk Kesehatan Tulang",
    "Teknologi Telemedicine Makin Diminati",
    "Career Day: Peluang Karir di Industri Farmasi",
    "Inovasi Aplikasi Kesehatan Mental"
)

$esoTitles = @(
    "Efek Samping Antibiotik yang Perlu Diwaspadai",
    "Dampak Penggunaan Obat Antihipertensi Jangka Panjang",
    "Reaksi Alergi Obat: Gejala dan Penanganan",
    "Efek Samping Obat Diabetes dan Cara Mengatasinya",
    "Interaksi Obat yang Berbahaya",
    "Efek Samping Obat Pereda Nyeri",
    "Dampak Penggunaan Kortikosteroid Berlebihan",
    "Efek Samping Obat Kemoterapi",
    "Reaksi Obat pada Ibu Hamil",
    "Efek Samping Obat Antikoagulan",
    "Dampak Penggunaan Obat Psikotropika",
    "Efek Samping Obat Asma Inhaler",
    "Reaksi Obat pada Lansia",
    "Efek Samping Suplemen Herbal",
    "Dampak Penggunaan Antibiotik Berlebihan",
    "Efek Samping Obat Antidepresan",
    "Reaksi Obat Anestesi",
    "Efek Samping Vaksinasi",
    "Dampak Penggunaan Obat Hormonal",
    "Efek Samping Obat Penurun Kolesterol"
)

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Creating 20 Berita Dummy Data" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

for ($i = 0; $i -lt 20; $i++) {
    $useVideo = ($i % 3 -eq 0)
    
    $body = @{
        title = $beritaTitles[$i]
        description = "Ringkasan singkat berita tentang $($beritaTitles[$i].ToLower()). Informasi lengkap dapat dibaca dalam artikel ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Artikel ini membahas secara detail mengenai topik tersebut dengan berbagai perspektif dan informasi terkini."
        mediaPath = if ($useVideo) { "dummy-video.mp4" } else { "dummy-image.jpg" }
        mediaType = if ($useVideo) { "video" } else { "image" }
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/sehat/berita" -Method POST -Body $body -ContentType "application/json"
        Write-Host "[OK] Berita $($i+1): $($beritaTitles[$i])" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Berita $($i+1): $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Creating 20 ESO Dummy Data" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

for ($i = 0; $i -lt 20; $i++) {
    $useVideo = ($i % 4 -eq 0)
    
    $body = @{
        title = $esoTitles[$i]
        description = "Informasi penting mengenai $($esoTitles[$i].ToLower()) yang perlu diketahui oleh pasien dan tenaga medis. Pahami gejala dan cara penanganannya dengan tepat."
        mediaType = if ($useVideo) { "video" } else { "image" }
    } | ConvertTo-Json

    if ($useVideo) {
        $body = $body -replace '}$', ',"mediaPath":"dummy-video.mp4"}'
    } else {
        $body = $body -replace '}$', ',"mediaPath":"dummy-image.jpg"}'
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/sehat/eso" -Method POST -Body $body -ContentType "application/json"
        Write-Host "[OK] ESO $($i+1): $($esoTitles[$i])" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] ESO $($i+1): $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  Dummy Data Creation Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "Total: 20 Berita + 20 ESO = 40 entries" -ForegroundColor Yellow
