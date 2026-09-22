# Complete build script for index.html
import sys

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add CSS before </style>
css_marker = '</style>'
if '/* SOFTCOPY REPORT & ARSIP STYLES */' not in html and '.report-preview-container' not in html:
    css_content = """
        /* =====================================
           SOFTCOPY REPORT & ARSIP STYLES
        ===================================== */
        .report-preview-container {
            background: #475569;
            padding: 24px 12px;
            border-radius: 14px;
            overflow-y: auto;
            max-height: 74vh;
        }

        .report-paper {
            background: #ffffff;
            color: #1e293b;
            width: 100%;
            max-width: 920px;
            margin: 0 auto;
            padding: 44px 50px;
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.55;
        }

        .report-header-box {
            border-bottom: 3px double #0d6efd;
            padding-bottom: 18px;
            margin-bottom: 22px;
        }

        .report-title {
            font-size: 21px;
            font-weight: 800;
            color: #0b5ed7;
            letter-spacing: -0.3px;
            text-transform: uppercase;
            margin-bottom: 3px;
        }

        .report-subtitle {
            font-size: 13.5px;
            color: #64748b;
            font-weight: 500;
        }

        .report-badge-status {
            display: inline-block;
            padding: 3px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .report-meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 18px;
            margin-bottom: 22px;
            font-size: 12.5px;
        }

        .report-meta-item strong {
            display: block;
            color: #64748b;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }

        .report-kpi-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            margin-bottom: 24px;
        }

        .report-kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
            background: #ffffff;
            border-top: 3.5px solid #0d6efd;
        }

        .report-kpi-card.kpi-success { border-top-color: #198754; }
        .report-kpi-card.kpi-warning { border-top-color: #f59e0b; }
        .report-kpi-card.kpi-danger  { border-top-color: #dc3545; }
        .report-kpi-card.kpi-info    { border-top-color: #0dcaf0; }

        .report-kpi-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.4px;
        }

        .report-kpi-val {
            font-size: 15.5px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
        }

        .report-section-heading {
            font-size: 13.5px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-bottom: 5px;
            margin-top: 22px;
            margin-bottom: 10px;
            border-bottom: 1.5px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
            margin-bottom: 16px;
        }

        .report-table th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.4px;
            padding: 7px 9px;
            border: 1px solid #cbd5e1;
            text-align: left;
        }

        .report-table td {
            padding: 6.5px 9px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }

        .report-table tr:nth-child(even) td {
            background: #f8fafc;
        }

        .report-signatures {
            margin-top: 32px;
            padding-top: 14px;
            display: flex;
            justify-content: space-around;
            text-align: center;
            font-size: 11.5px;
            page-break-inside: avoid;
        }

        .report-sign-box {
            width: 220px;
        }

        .report-sign-line {
            margin-top: 55px;
            border-bottom: 1.5px solid #334155;
            font-weight: 700;
            padding-bottom: 4px;
        }

        .archive-card {
            transition: all 0.2s ease-in-out;
            border: 1px solid #e2e8f0;
        }
        .archive-card:hover {
            border-color: #3b82f6;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.12);
        }

        /* PRINT STYLING */
        @media print {
            body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            body > *:not(#modalSoftcopyReport) {
                display: none !important;
            }
            #modalSoftcopyReport {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                overflow: visible !important;
                display: block !important;
                opacity: 1 !important;
            }
            #modalSoftcopyReport .modal-dialog {
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            #modalSoftcopyReport .modal-content {
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
            }
            #modalSoftcopyReport .modal-header,
            #modalSoftcopyReport .modal-footer,
            .modal-backdrop,
            .no-print {
                display: none !important;
            }
            .report-preview-container {
                background: transparent !important;
                padding: 0 !important;
                overflow: visible !important;
                max-height: none !important;
            }
            .report-paper {
                box-shadow: none !important;
                padding: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
            }
            .report-section-heading {
                page-break-after: avoid;
            }
            .report-table {
                page-break-inside: auto;
            }
            .report-table tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            @page {
                size: A4 portrait;
                margin: 12mm 14mm 12mm 14mm;
            }
        }
    """
    html = html.replace(css_marker, css_content + "\n    </style>", 1)
    print("CSS injected.")

# 2. Update Home action toolbar
old_home_toolbar = """            <!-- ACTION TOOLBAR: MASTER EXPORT EXCEL -->
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 bg-white rounded-3 shadow-sm border">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-success bg-opacity-10 text-success p-2 rounded-circle">
                        <i class="bi bi-file-earmark-spreadsheet-fill fs-5"></i>
                    </span>
                    <div>
                        <div class="fw-bold text-dark" style="font-size: 14px;">Rekapitulasi Outing (Master Excel)</div>
                        <small class="text-muted" style="font-size: 12px;">Unduh seluruh data (Rundown, Keuangan, Purchasing, Logistik, Konsumsi, Pengumuman, Peserta) dalam 1 berkas Excel multi-sheet</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-success px-3 mt-2 mt-sm-0" onclick="exportModuleExcel('master')">
                    <i class="bi bi-download me-1"></i> Unduh Master Excel
                </button>
            </div>"""

new_home_toolbar = """            <!-- ACTION TOOLBAR: LAPORAN SOFTCOPY & REKAPITULASI OUTING -->
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 bg-white rounded-3 shadow-sm border gap-3">
                <div class="d-flex align-items-center gap-3">
                    <span class="badge bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
                        <i class="bi bi-file-earmark-pdf-fill fs-4"></i>
                    </span>
                    <div>
                        <div class="fw-bold text-dark" style="font-size: 14px;">Laporan Softcopy & Rekapitulasi Outing</div>
                        <small class="text-muted" style="font-size: 12px;">Unduh softcopy LPJ resmi (PDF / Cetak / HTML), buka arsip outing sebelumnya, atau unduh Master Rekap Excel 8-sheet</small>
                    </div>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-primary px-3 shadow-sm" onclick="openSoftcopyReportModal()">
                        <i class="bi bi-file-earmark-text me-1"></i> Softcopy Report Outing
                    </button>
                    <button class="btn btn-sm btn-success px-3" onclick="exportModuleExcel('master')">
                        <i class="bi bi-download me-1"></i> Unduh Master Excel
                    </button>
                    <button class="btn btn-sm btn-outline-secondary px-3" onclick="showPage('settings')">
                        <i class="bi bi-archive me-1"></i> Riwayat & Arsip
                    </button>
                </div>
            </div>"""

if old_home_toolbar in html:
    html = html.replace(old_home_toolbar, new_home_toolbar, 1)
    print("Home toolbar updated.")

# 3. Add Softcopy & Supabase Lifecycle Sections to pageSettings
old_settings_export = """                    <!-- MASTER EXPORT BACKUP CARD -->
                    <div class="card border border-success border-opacity-25 bg-success bg-opacity-10 p-3 mt-4">
                        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                            <div>
                                <h6 class="fw-bold text-success mb-1">
                                    <i class="bi bi-file-earmark-spreadsheet me-1"></i> Master Export & Backup Excel
                                </h6>
                                <div class="small text-secondary">
                                    Unduh seluruh data outing (Informasi Acara, Rundown, Keuangan, Purchasing, Logistik, Konsumsi, Pengumuman, dan Data Peserta) dalam 1 berkas Excel multi-sheet.
                                </div>
                            </div>
                            <button type="button" class="btn btn-success text-nowrap" onclick="exportModuleExcel('master')">
                                <i class="bi bi-download me-1"></i> Unduh Master Excel
                            </button>
                        </div>
                    </div>"""

new_settings_sections = """                    <!-- MASTER EXPORT BACKUP CARD -->
                    <div class="card border border-success border-opacity-25 bg-success bg-opacity-10 p-3 mt-4">
                        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                            <div>
                                <h6 class="fw-bold text-success mb-1">
                                    <i class="bi bi-file-earmark-spreadsheet me-1"></i> Master Export & Backup Excel
                                </h6>
                                <div class="small text-secondary">
                                    Unduh seluruh data outing (Informasi Acara, Rundown, Keuangan, Purchasing, Logistik, Konsumsi, Pengumuman, dan Data Peserta) dalam 1 berkas Excel multi-sheet.
                                </div>
                            </div>
                            <button type="button" class="btn btn-success text-nowrap" onclick="exportModuleExcel('master')">
                                <i class="bi bi-download me-1"></i> Unduh Master Excel
                            </button>
                        </div>
                    </div>

                    <!-- CARD: PUSAT SOFTCOPY REPORT & ARSIP OUTING SEBELUMNYA -->
                    <div class="card border-primary border-opacity-25 p-3 mt-4 shadow-sm">
                        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
                            <div>
                                <h6 class="fw-bold text-primary mb-1">
                                    <i class="bi bi-file-earmark-pdf me-1"></i> Pusat Softcopy Report & Arsip Outing Sebelumnya
                                </h6>
                                <div class="small text-muted">
                                    Pilih outing untuk diunduh sebagai softcopy laporan resmi (LPJ), cetak/simpan PDF, atau ekspor data arsip
                                </div>
                            </div>
                            <div class="d-flex flex-wrap gap-2">
                                <button type="button" class="btn btn-sm btn-outline-primary" onclick="saveCurrentOutingToArchivePrompt()">
                                    <i class="bi bi-box-arrow-in-down me-1"></i> Arsipkan Outing Aktif
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="triggerImportArchiveJson()">
                                    <i class="bi bi-upload me-1"></i> Upload Arsip JSON
                                </button>
                                <input type="file" id="inputImportArchiveJson" class="d-none" accept=".json" onchange="handleImportArchiveJson(event)">
                            </div>
                        </div>

                        <!-- SELECTOR OUTING & PREVIEW -->
                        <div class="bg-light p-3 rounded-3 border mb-3">
                            <div class="row g-2 align-items-center">
                                <div class="col-md-5">
                                    <label class="form-label small fw-semibold text-secondary mb-1">
                                        <i class="bi bi-check2-circle text-primary me-1"></i>Pilih Outing / Report:
                                    </label>
                                    <select id="settingOutingArchiveSelector" class="form-select form-select-sm fw-semibold" onchange="onSelectArchiveOuting(this.value)">
                                        <option value="current">🟢 Outing Aktif Saat Ini</option>
                                    </select>
                                </div>
                                <div class="col-md-7">
                                    <div class="d-flex flex-wrap gap-2 justify-content-md-end mt-2 mt-md-0">
                                        <button type="button" class="btn btn-sm btn-primary shadow-sm" onclick="openSoftcopyReportModal(currentSelectedReportOutingId)">
                                            <i class="bi bi-eye me-1"></i> Lihat & Cetak Softcopy
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="downloadStandaloneHtmlReport(currentSelectedReportOutingId)" title="Unduh file HTML standalone offline">
                                            <i class="bi bi-filetype-html me-1"></i> Unduh HTML
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-success" onclick="exportArchiveMasterExcel(currentSelectedReportOutingId)" title="Unduh Excel 8-sheet">
                                            <i class="bi bi-file-earmark-excel me-1"></i> Excel
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-dark" onclick="downloadArchiveJson(currentSelectedReportOutingId)" title="Unduh backup JSON">
                                            <i class="bi bi-filetype-json me-1"></i> JSON
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- PREVIEW CARD OF SELECTED OUTING -->
                            <div id="selectedOutingPreviewCard" class="mt-3 pt-3 border-top">
                                <!-- Populated dynamically by onSelectArchiveOuting -->
                            </div>
                        </div>

                        <!-- TABEL DAFTAR ARSIP OUTING SEBELUMNYA -->
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="fw-semibold small text-uppercase text-secondary mb-0">
                                <i class="bi bi-clock-history me-1"></i>Riwayat Arsip Outing Sebelumnya
                            </h6>
                            <small class="text-muted" id="archiveCountBadge">0 arsip tersimpan</small>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-sm table-hover align-middle border mb-0" style="font-size: 13px;">
                                <thead class="table-light">
                                    <tr>
                                        <th>Nama Acara Outing</th>
                                        <th>Periode / Lokasi</th>
                                        <th>Peserta</th>
                                        <th>Kas / Belanja</th>
                                        <th>Waktu Arsip</th>
                                        <th class="text-end">Aksi Softcopy</th>
                                    </tr>
                                </thead>
                                <tbody id="archivesTableBody">
                                    <tr>
                                        <td colspan="6" class="text-center py-3 text-muted">Memuat arsip outing...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- CARD: MANAJEMEN SIKLUS OUTING & PEMBERSIHAN DATA SUPABASE -->
                    <div class="card border-danger border-opacity-25 bg-danger bg-opacity-10 p-3 mt-4">
                        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3">
                            <div>
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <span class="badge bg-danger p-2 rounded-circle">
                                        <i class="bi bi-database-gear fs-6"></i>
                                    </span>
                                    <h6 class="fw-bold text-danger mb-0">
                                        Manajemen Siklus & Pembersihan Data Supabase
                                    </h6>
                                </div>
                                <div class="small text-secondary mt-1" style="line-height: 1.5;">
                                    Agar kuota Supabase tidak penuh dan query tetap cepat dari tahun ke tahun, Anda dapat membersihkan data kegiatan lama di Supabase setelah mengunduh Softcopy Report, lalu memperbarui sistem untuk Outing Baru.
                                </div>
                            </div>
                            <button type="button" class="btn btn-danger btn-sm text-nowrap shadow-sm" onclick="openPurgeSupabaseModal()">
                                <i class="bi bi-stars me-1"></i> Mulai Outing Baru & Bersihkan Supabase
                            </button>
                        </div>

                        <!-- LIVE DATABASE RECORD SUMMARY -->
                        <div class="bg-white p-3 rounded-3 border mt-3">
                            <div class="small fw-semibold text-secondary mb-2 d-flex justify-content-between align-items-center">
                                <span><i class="bi bi-hdd-network text-danger me-1"></i>Status Baris Data Aktif di Supabase & Sistem:</span>
                                <button type="button" class="btn btn-link p-0 text-decoration-none small text-muted" onclick="updateSupabaseStatsSummary()">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Refresh Status
                                </button>
                            </div>
                            <div class="row g-2 text-center" style="font-size: 12px;">
                                <div class="col-4 col-md-2">
                                    <div class="p-2 border rounded bg-light">
                                        <div class="text-muted small">Transaksi Kas</div>
                                        <strong class="fs-6 text-primary" id="dbStatFinance">0</strong>
                                    </div>
                                </div>
                                <div class="col-4 col-md-2">
                                    <div class="p-2 border rounded bg-light">
                                        <div class="text-muted small">Rundown</div>
                                        <strong class="fs-6 text-primary" id="dbStatRundown">0</strong>
                                    </div>
                                </div>
                                <div class="col-4 col-md-2">
                                    <div class="p-2 border rounded bg-light">
                                        <div class="text-muted small">Purchasing</div>
                                        <strong class="fs-6 text-primary" id="dbStatPurchasing">0</strong>
                                    </div>
                                </div>
                                <div class="col-4 col-md-2">
                                    <div class="p-2 border rounded bg-light">
                                        <div class="text-muted small">Logistik/Tugas</div>
                                        <strong class="fs-6 text-primary" id="dbStatLogistic">0</strong>
                                    </div>
                                </div>
                                <div class="col-4 col-md-2">
                                    <div class="p-2 border rounded bg-light">
                                        <div class="text-muted small">Konsumsi/Meal</div>
                                        <strong class="fs-6 text-primary" id="dbStatKonsumsi">0</strong>
                                    </div>
                                </div>
                                <div class="col-4 col-md-2">
                                    <div class="p-2 border rounded bg-light">
                                        <div class="text-muted small">Peserta</div>
                                        <strong class="fs-6 text-primary" id="dbStatParticipants">0</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>"""

if old_settings_export in html:
    html = html.replace(old_settings_export, new_settings_sections, 1)
    print("Settings sections injected.")

# 4. Inject Modals before </body>
modals_html = """
<!-- =====================================================
     MODAL: SOFTCOPY REPORT & PRINT LPJ OUTING
===================================================== -->
<div class="modal fade" id="modalSoftcopyReport" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white py-2 px-3 align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-file-earmark-text-fill fs-5"></i>
                    <div>
                        <h6 class="modal-title mb-0 fw-bold">Laporan Softcopy (LPJ) Outing</h6>
                        <small class="opacity-75" style="font-size: 11px;">Pratinjau resmi & cetak dokumen pertanggungjawaban kegiatan</small>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2 ms-auto me-2">
                    <span class="small d-none d-md-inline opacity-75">Pilih Outing:</span>
                    <select id="modalReportOutingSelector" class="form-select form-select-sm" style="max-width: 260px;" onchange="onModalReportOutingChanged(this.value)"></select>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body p-0">
                <!-- TOOLBAR AKSI REPORT -->
                <div class="bg-light p-2 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2 px-3 no-print">
                    <div class="small text-secondary">
                        <i class="bi bi-info-circle me-1"></i> Klik <strong>Cetak / Simpan PDF</strong> untuk menyimpan dokumen format A4 rapi
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                        <button type="button" class="btn btn-sm btn-primary shadow-sm" onclick="printSoftcopyReport()">
                            <i class="bi bi-printer me-1"></i> Cetak / Simpan PDF
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="downloadCurrentModalHtmlReport()" title="Unduh berkas .html mandiri">
                            <i class="bi bi-filetype-html me-1"></i> Unduh File HTML
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-success" onclick="downloadCurrentModalExcel()" title="Unduh Master Rekap Excel 8-Sheet">
                            <i class="bi bi-file-earmark-excel me-1"></i> Unduh Master Excel
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-dark" onclick="downloadCurrentModalJson()" title="Unduh Data Mentah JSON">
                            <i class="bi bi-filetype-json me-1"></i> Unduh JSON
                        </button>
                    </div>
                </div>

                <!-- PREVIEW CONTAINER & PAPER -->
                <div class="report-preview-container">
                    <div id="reportPrintArea" class="report-paper">
                        <!-- Dynamic Report Content generated by generateSoftcopyReportHtml -->
                    </div>
                </div>
            </div>

            <div class="modal-footer py-2 no-print">
                <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Tutup</button>
                <button type="button" class="btn btn-sm btn-primary" onclick="printSoftcopyReport()">
                    <i class="bi bi-printer me-1"></i> Cetak / Simpan PDF
                </button>
            </div>
        </div>
    </div>
</div>

<!-- =====================================================
     MODAL: BERSIHKAN DATA SUPABASE & MULAI OUTING BARU
===================================================== -->
<div class="modal fade" id="modalPurgeSupabase" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white py-2 px-3">
                <h6 class="modal-title fw-bold">
                    <i class="bi bi-stars me-2"></i>Mulai Outing Baru & Bersihkan Data Supabase
                </h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body p-3">
                <!-- STEP 1: BACKUP REMINDER -->
                <div class="alert alert-warning py-2 mb-3">
                    <div class="fw-bold mb-1"><i class="bi bi-shield-check me-1"></i>Langkah 1: Amankan Dokumen Softcopy Terlebih Dahulu</div>
                    <div class="small mb-2">
                        Sistem akan otomatis mengarsipkan data outing saat ini ke Riwayat Arsip. Namun Anda juga sangat disarankan untuk mengunduh Softcopy Report atau Master Excel ke komputer lokal Anda sekarang:
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                        <button type="button" class="btn btn-sm btn-outline-dark bg-white" onclick="openSoftcopyReportModal('current')">
                            <i class="bi bi-file-earmark-pdf me-1"></i> Unduh Softcopy Report LPJ
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-success bg-white" onclick="exportModuleExcel('master')">
                            <i class="bi bi-file-earmark-excel me-1"></i> Unduh Master Rekap Excel
                        </button>
                    </div>
                </div>

                <!-- STEP 2: SELECT TABLES TO PURGE FROM SUPABASE -->
                <div class="card p-3 mb-3 bg-light border">
                    <h6 class="fw-bold small text-uppercase text-secondary mb-2">
                        <i class="bi bi-trash3 me-1 text-danger"></i>Langkah 2: Pilih Data Kegiatan yang Dihapus dari Supabase
                    </h6>
                    <div class="small text-muted mb-2">
                        Centang tabel di bawah untuk dibersihkan dari database Supabase agar kuota hemat dan tidak menumpuk:
                    </div>
                    <div class="row g-2 mb-3" style="font-size: 13px;">
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input purge-chk" type="checkbox" id="purgeChkFinance" checked>
                                <label class="form-check-label" for="purgeChkFinance">
                                    Hapus <strong>Transaksi Kas</strong> (<span id="purgeCntFinance">0</span> baris)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input purge-chk" type="checkbox" id="purgeChkRundown" checked>
                                <label class="form-check-label" for="purgeChkRundown">
                                    Hapus <strong>Rundown Acara</strong> (<span id="purgeCntRundown">0</span> baris)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input purge-chk" type="checkbox" id="purgeChkPurchasing" checked>
                                <label class="form-check-label" for="purgeChkPurchasing">
                                    Hapus <strong>Purchasing & Foto Nota</strong> (<span id="purgeCntPurchasing">0</span> baris)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input purge-chk" type="checkbox" id="purgeChkTasks" checked>
                                <label class="form-check-label" for="purgeChkTasks">
                                    Hapus <strong>Tugas & Logistik</strong> (<span id="purgeCntTasks">0</span> baris)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input purge-chk" type="checkbox" id="purgeChkConsumptions" checked>
                                <label class="form-check-label" for="purgeChkConsumptions">
                                    Hapus <strong>Rencana Konsumsi/Meal</strong> (<span id="purgeCntConsumptions">0</span> baris)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input purge-chk" type="checkbox" id="purgeChkAnnouncements" checked>
                                <label class="form-check-label" for="purgeChkAnnouncements">
                                    Hapus <strong>Pengumuman Lama</strong> (<span id="purgeCntAnnouncements">0</span> baris)
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- PESERTA OPTIONS -->
                    <label class="form-label fw-semibold small text-dark mb-1">Kebijakan Data Peserta Outing:</label>
                    <div class="ps-1">
                        <div class="form-check mb-1">
                            <input class="form-check-input" type="radio" name="purgeParticipantOption" id="purgePartReset" value="reset_assignment" checked>
                            <label class="form-check-label small" for="purgePartReset">
                                <strong>Pertahankan Akun Peserta & Reset Penugasan</strong> (Direkomendasikan: Akun login & User ID tetap aktif agar rekan kerja tidak perlu registrasi ulang, hanya data kamar & bus yang dikosongkan)
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="purgeParticipantOption" id="purgePartDelete" value="delete_all">
                            <label class="form-check-label small" for="purgePartDelete">
                                <strong>Hapus Seluruh Data Peserta</strong> (Hapus semua peserta dari tabel Supabase)
                            </label>
                        </div>
                    </div>
                </div>

                <!-- STEP 3: NEW OUTING DETAILS -->
                <div class="card p-3 border">
                    <h6 class="fw-bold small text-uppercase text-secondary mb-2">
                        <i class="bi bi-pencil-square me-1 text-primary"></i>Langkah 3: Konfigurasi Outing Baru
                    </h6>
                    <div class="row g-2">
                        <div class="col-12">
                            <label class="form-label small fw-semibold">Nama Acara Outing Baru <span class="text-danger">*</span></label>
                            <input type="text" id="newOutingName" class="form-control form-control-sm" placeholder="Contoh: Annual Outing 2027 - Bali Coastal Gathering" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Tanggal Mulai <span class="text-danger">*</span></label>
                            <input type="date" id="newOutingStartDate" class="form-control form-control-sm" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Tanggal Selesai <span class="text-danger">*</span></label>
                            <input type="date" id="newOutingEndDate" class="form-control form-control-sm" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label small fw-semibold">Lokasi / Venue Baru <span class="text-danger">*</span></label>
                            <input type="text" id="newOutingLocation" class="form-control form-control-sm" placeholder="Contoh: The Patra Bali Resort & Villas, Kuta" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label small fw-semibold">Alamat Lengkap Venue</label>
                            <input type="text" id="newOutingAddress" class="form-control form-control-sm" placeholder="Alamat lengkap tujuan outing baru">
                        </div>
                        <div class="col-12">
                            <label class="form-label small fw-semibold">Tema / Deskripsi Singkat</label>
                            <textarea id="newOutingDescription" class="form-control form-control-sm" rows="2" placeholder="Tema atau catatan kegiatan outing baru"></textarea>
                        </div>
                    </div>
                </div>

                <div id="purgeModalMessage" class="mt-2"></div>
            </div>

            <div class="modal-footer py-2">
                <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Batal</button>
                <button type="button" class="btn btn-sm btn-danger px-3 shadow-sm" id="btnConfirmPurgeSupabase" onclick="executePurgeSupabaseAndNewOuting()">
                    <i class="bi bi-stars me-1"></i> Bersihkan Supabase & Terapkan Outing Baru
                </button>
            </div>
        </div>
    </div>
</div>
"""

body_end_marker = "</body>"
if 'id="modalSoftcopyReport"' not in html:
    html = html.replace(body_end_marker, modals_html + "\n\n" + body_end_marker, 1)
    print("Modals injected.")

# 5. Update setupManagementMenu() to include Softcopy Report & Arsip tile
old_mgmt_initiator = """    // INITIATOR / SETTINGS
    if (isAll) {
        menus.push({
            icon: 'bi-sliders',
            title: 'Pengaturan Outing',
            desc: 'Konfigurasi nama acara, tanggal & venue',
            action: "showPage('settings')"
        });
    }"""

new_mgmt_initiator = """    // SOFTCOPY REPORT & ARSIP (Accessible to All Users, Great for viewing reports)
    menus.push({
        icon: 'bi-file-earmark-pdf',
        title: 'Softcopy Report & Arsip',
        desc: 'Unduh laporan LPJ resmi, arsip kegiatan & cetak dokumen',
        action: "openSoftcopyReportModal()"
    });

    // INITIATOR / SETTINGS
    if (isAll) {
        menus.push({
            icon: 'bi-sliders',
            title: 'Pengaturan Outing',
            desc: 'Konfigurasi acara, arsip outing & pembersihan Supabase',
            action: "showPage('settings')"
        });
    }"""

if old_mgmt_initiator in html:
    html = html.replace(old_mgmt_initiator, new_mgmt_initiator, 1)
    print("Management menu updated.")

# 6. Update initSeedDataIfEmpty() to call initSampleArchiveIfEmpty()
old_seed_start = """// INITIAL SEED DATA
function initSeedDataIfEmpty() {
    // 1. Initial Outing Information"""

new_seed_start = """// INITIAL SEED DATA
function initSeedDataIfEmpty() {
    initSampleArchiveIfEmpty();
    // 1. Initial Outing Information"""

if old_seed_start in html:
    html = html.replace(old_seed_start, new_seed_start, 1)
    print("Seed data init updated.")

# 7. Add loadDashboard calls to refresh archive selectors and stats
old_load_dashboard_end = """        setupManagementMenu();
        showPage('home');"""

new_load_dashboard_end = """        setupManagementMenu();
        updateArchiveSelectors();
        renderArchivesTable();
        updateSupabaseStatsSummary();
        showPage('home');"""

if old_load_dashboard_end in html:
    html = html.replace(old_load_dashboard_end, new_load_dashboard_end, 1)
    print("loadDashboard updated.")

# 8. Append full JavaScript engine at the end of the script (before </script>)
script_end_marker = "</script>"
# find last </script>
last_script_pos = html.rfind(script_end_marker)

js_engine = """
/* ====================================================================
   OUTING SOFTCOPY REPORT & SUPABASE LIFECYCLE MANAGEMENT ENGINE
   - Softcopy LPJ Generator (PDF/Print/HTML/Excel/JSON)
   - Previous Outing Archives (Selector & Manager)
   - Supabase Data Purge & New Outing Cycle
==================================================================== */
const STORAGE_KEY_ARCHIVES = 'outing_archives';
let currentSelectedReportOutingId = 'current';

function getOutingArchives() {
    return STORAGE.get(STORAGE_KEY_ARCHIVES, []);
}

function initSampleArchiveIfEmpty() {
    const archives = getOutingArchives();
    if (!archives || archives.length === 0) {
        const sampleArchive = {
            id: 'arch-2025-puncak',
            title: 'Annual Outing 2025 - Safari & Tea Walk Puncak',
            created_at: '2025-09-22T10:00:00.000Z',
            outing: {
                id: '10000000-0000-0000-0000-000000000000',
                name: 'Annual Outing 2025 - Safari & Tea Walk Puncak',
                start_date: '2025-09-19',
                end_date: '2025-09-21',
                event_date: '2025-09-19',
                location: 'Pesona Alam Resort & Spa, Puncak, Bogor',
                address: 'Jl. Taman Safari No. 101, Cisarua, Bogor',
                status: 'COMPLETED',
                description: 'Outing kebersamaan dan outbound tahunan seluruh divisi karyawan.'
            },
            stats: {
                totalParticipants: 65,
                totalIncome: 45000000,
                totalExpense: 41500000,
                balance: 3500000,
                totalPurchasingActual: 7200000,
                totalPurchasingEst: 7500000,
                taskCount: 5,
                taskDonePercent: 100
            },
            rundowns: [
                { id: 'ar-1', start_time: '06:00 - 07:00', title: 'Registrasi & Keberangkatan Bus', location: 'Kantor Pusat', description: 'Briefing, pembagian snack box, kaos dan name tag', order_index: 1 },
                { id: 'ar-2', start_time: '10:00 - 12:30', title: 'Tea Walk di Kebun Teh Gunung Mas', location: 'Gunung Mas Puncak', description: 'Fun walk menyusuri kebun teh dan sesi foto bersama', order_index: 2 },
                { id: 'ar-3', start_time: '13:00 - 14:30', title: 'Makan Siang & Check-in Resort', location: 'Pesona Alam Resort', description: 'Makan siang prasmanan Sunda dan pembagian kunci kamar', order_index: 3 },
                { id: 'ar-4', start_time: '19:00 - 22:00', title: 'Malam Keakraban & BBQ Night', location: 'Outdoor Gazebo Resort', description: 'Pengundian doorprize utama Smart TV dan hiburan akustik', order_index: 4 },
                { id: 'ar-5', start_time: '09:00 - 12:00', title: 'Team Building & Penutupan Acara', location: 'Lapangan Hijau Resort', description: 'Fun games antar divisi, awarding pemenang, dan persiapan pulang', order_index: 5 }
            ],
            transactions: [
                { id: 'at-1', type: 'IN', amount: 32500000, category: 'Iuran Peserta', description: 'Iuran 65 peserta @Rp 500.000', transaction_date: '2025-09-05', status: 'POSTED' },
                { id: 'at-2', type: 'IN', amount: 12500000, category: 'Subsidi Perusahaan', description: 'Sponsorship dan dana operasional manajemen', transaction_date: '2025-09-08', status: 'POSTED' },
                { id: 'at-3', type: 'OUT', amount: 18500000, category: 'Penginapan', description: 'Pelunasan sewa kamar Pesona Alam Resort (2 malam)', transaction_date: '2025-09-15', status: 'POSTED' },
                { id: 'at-4', type: 'OUT', amount: 9000000, category: 'Transportasi', description: 'Sewa 2 unit bus pariwisata eksekutif 50 seaters', transaction_date: '2025-09-16', status: 'POSTED' },
                { id: 'at-5', type: 'OUT', amount: 8000000, category: 'Konsumsi', description: 'Katering prasmanan 3x makan & BBQ paket lengkap', transaction_date: '2025-09-18', status: 'POSTED' },
                { id: 'at-6', type: 'OUT', amount: 6000000, category: 'Doorprize & Acara', description: 'Pembelian hadiah doorprize utama & perlengkapan games', transaction_date: '2025-09-18', status: 'POSTED' }
            ],
            purchases: [
                { id: 'ap-1', item_name: 'Kaos Polo Outing 2025', quantity: 70, unit: 'Pcs', estimated_cost: 3850000, actual_cost: 3750000, vendor: 'Konveksi Berkah', status: 'COMPLETED', notes: 'Bahan katun warna army dengan bordir logo' },
                { id: 'ap-2', item_name: 'Hadiah Doorprize Smart TV 43 Inch', quantity: 1, unit: 'Unit', estimated_cost: 3200000, actual_cost: 3050000, vendor: 'Electronic City', status: 'COMPLETED', notes: 'Hadiah utama grand prize malam BBQ' },
                { id: 'ap-3', item_name: 'Spanduk & Photobooth 4x3 meter', quantity: 1, unit: 'Pcs', estimated_cost: 450000, actual_cost: 400000, vendor: 'Percetakan Grafika', status: 'COMPLETED', notes: 'Bahan flexi korea finishing ring mata ayam' }
            ],
            tasks: [
                { id: 'atk-1', title: 'Konfirmasi Armada Bus & Rute Perjalanan', priority: 'HIGH', deadline: '2025-09-17', status: 'DONE', progress: 100, assigned_to: 'Hendra Saputra' },
                { id: 'atk-2', title: 'Pelunasan Venue & Kamar Resort', priority: 'HIGH', deadline: '2025-09-15', status: 'DONE', progress: 100, assigned_to: 'Siti Rahma' },
                { id: 'atk-3', title: 'Distribusi Kaos & Goodie Bag Peserta', priority: 'MEDIUM', deadline: '2025-09-18', status: 'DONE', progress: 100, assigned_to: 'Tim Registrasi' },
                { id: 'atk-4', title: 'Persiapan Doorprize & Hadiah Fun Games', priority: 'HIGH', deadline: '2025-09-18', status: 'DONE', progress: 100, assigned_to: 'Tim Acara' },
                { id: 'atk-5', title: 'Briefing Koordinator Bus & Rundown Acara', priority: 'MEDIUM', deadline: '2025-09-18', status: 'DONE', progress: 100, assigned_to: 'Budi Santoso' }
            ],
            consumptions: [
                { id: 'ac-1', date: '2025-09-19', meal_type: 'SNACK_PAGI', location: 'Di dalam Bus Pariwisata', participant_count: 65, vendor: 'Dapur Snack Bu Ani', estimated_cost: 975000, actual_cost: 975000, status: 'ORDERED' },
                { id: 'ac-2', date: '2025-09-19', meal_type: 'MAKAN_SIANG', location: 'Resto Sunda Pesona Alam', participant_count: 65, vendor: 'In-house Resto', estimated_cost: 3250000, actual_cost: 3250000, status: 'ORDERED' },
                { id: 'ac-3', date: '2025-09-19', meal_type: 'MAKAN_MALAM', location: 'Gazebo BBQ Area', participant_count: 65, vendor: 'BBQ Chef Puncak', estimated_cost: 4500000, actual_cost: 4300000, status: 'ORDERED' }
            ],
            announcements: [
                { id: 'aa-1', title: 'Panduan Keberangkatan Outing 2025', content: 'Kumpul di halaman kantor pukul 06.00 WIB tepat. Dresscode kaos hijau army outing.', priority: 'HIGH', publish_date: '2025-09-16' },
                { id: 'aa-2', title: 'Pemberitahuan Cuaca & Pakaian Hangat', content: 'Suhu malam diperkirakan 18 derajat celcius. Mohon peserta membawa jaket tebal.', priority: 'NORMAL', publish_date: '2025-09-17' }
            ],
            participants: [
                { id: 'ap-1', username: 'budi_santoso', full_name: 'Budi Santoso', department: 'Management', gender: 'L', transport: 'Bus 1', room: 'Villa 101', phone: '081234567890', status: 'CONFIRMED' },
                { id: 'ap-2', username: 'siti_rahma', full_name: 'Siti Rahma', department: 'Finance', gender: 'P', transport: 'Bus 1', room: 'Villa 102', phone: '081234567891', status: 'CONFIRMED' },
                { id: 'ap-3', username: 'dedi_kurniawan', full_name: 'Dedi Kurniawan', department: 'Procurement', gender: 'L', transport: 'Bus 2', room: 'Villa 103', phone: '081234567892', status: 'CONFIRMED' },
                { id: 'ap-4', username: 'hendra_saputra', full_name: 'Hendra Saputra', department: 'General Affairs', gender: 'L', transport: 'Bus 1', room: 'Villa 101', phone: '081234567893', status: 'CONFIRMED' },
                { id: 'ap-5', username: 'dewi_lestari', full_name: 'Dewi Lestari', department: 'HR', gender: 'P', transport: 'Bus 2', room: 'Villa 102', phone: '081234567894', status: 'CONFIRMED' }
            ]
        };
        STORAGE.set(STORAGE_KEY_ARCHIVES, [sampleArchive]);
    }
}

function saveCurrentOutingToArchivePrompt() {
    const info = STORAGE.get('outing_current_info', {}) || {};
    const defaultTitle = `${info.name || 'Annual Outing'} (${new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })})`;
    const title = prompt('Masukkan nama label arsip outing ini:', defaultTitle);
    if (!title) return;

    const saved = saveCurrentOutingToArchive(title);
    alert(`Outing "${saved.title}" berhasil diarsipkan ke Riwayat Outing Sebelumnya! Anda dapat mengunduh softcopy report-nya kapan saja.`);
    updateArchiveSelectors();
    renderArchivesTable();
}

function saveCurrentOutingToArchive(customTitle) {
    const currentInfo = STORAGE.get('outing_current_info', {}) || {};
    const rundowns = STORAGE.get('outing_rundowns', []) || [];
    const transactions = STORAGE.get('outing_transactions', []) || [];
    const purchases = STORAGE.get('outing_purchases', []) || [];
    const tasks = STORAGE.get('outing_tasks', []) || [];
    const consumptions = STORAGE.get('outing_consumptions', []) || [];
    const announcements = STORAGE.get('outing_announcements', []) || [];
    const participants = STORAGE.get('outing_participants', []) || [];

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
        const type = String(t.type || '').toUpperCase();
        const amt = Number(t.amount) || 0;
        if (type === 'IN' || type === 'INCOME' || type === 'MASUK') totalIncome += amt;
        else if (type === 'OUT' || type === 'EXPENSE' || type === 'KELUAR') totalExpense += amt;
    });

    let totalPurchasingActual = 0;
    let totalPurchasingEst = 0;
    purchases.forEach(p => {
        totalPurchasingActual += (Number(p.actual_cost) || 0);
        totalPurchasingEst += (Number(p.estimated_cost) || 0);
    });

    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    const taskDonePercent = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

    const archiveId = 'arch-' + Date.now();
    const newArchive = {
        id: archiveId,
        title: customTitle || currentInfo.name || 'Outing ' + (new Date().getFullYear()),
        created_at: new Date().toISOString(),
        outing: JSON.parse(JSON.stringify(currentInfo)),
        stats: {
            totalParticipants: participants.length,
            totalIncome: totalIncome,
            totalExpense: totalExpense,
            balance: totalIncome - totalExpense,
            totalPurchasingActual: totalPurchasingActual,
            totalPurchasingEst: totalPurchasingEst,
            taskCount: tasks.length,
            taskDonePercent: taskDonePercent
        },
        rundowns: JSON.parse(JSON.stringify(rundowns)),
        transactions: JSON.parse(JSON.stringify(transactions)),
        purchases: JSON.parse(JSON.stringify(purchases)),
        tasks: JSON.parse(JSON.stringify(tasks)),
        consumptions: JSON.parse(JSON.stringify(consumptions)),
        announcements: JSON.parse(JSON.stringify(announcements)),
        participants: JSON.parse(JSON.stringify(participants))
    };

    const archives = getOutingArchives();
    archives.unshift(newArchive);
    STORAGE.set(STORAGE_KEY_ARCHIVES, archives);

    return newArchive;
}

function getOutingDataForReport(outingId) {
    if (!outingId || outingId === 'current') {
        const currentInfo = STORAGE.get('outing_current_info', {}) || {};
        const rundowns = STORAGE.get('outing_rundowns', []) || [];
        const transactions = STORAGE.get('outing_transactions', []) || [];
        const purchases = STORAGE.get('outing_purchases', []) || [];
        const tasks = STORAGE.get('outing_tasks', []) || [];
        const consumptions = STORAGE.get('outing_consumptions', []) || [];
        const announcements = STORAGE.get('outing_announcements', []) || [];
        const participants = STORAGE.get('outing_participants', []) || [];

        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach(t => {
            const type = String(t.type || '').toUpperCase();
            const amt = Number(t.amount) || 0;
            if (type === 'IN' || type === 'INCOME' || type === 'MASUK') totalIncome += amt;
            else if (type === 'OUT' || type === 'EXPENSE' || type === 'KELUAR') totalExpense += amt;
        });

        let totalPurchasingActual = 0;
        let totalPurchasingEst = 0;
        purchases.forEach(p => {
            totalPurchasingActual += (Number(p.actual_cost) || 0);
            totalPurchasingEst += (Number(p.estimated_cost) || 0);
        });

        const doneTasks = tasks.filter(t => t.status === 'DONE').length;
        const taskDonePercent = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

        return {
            isArchive: false,
            id: 'current',
            title: currentInfo.name || 'Annual Outing Bersama',
            outing: currentInfo,
            stats: {
                totalParticipants: participants.length,
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                balance: totalIncome - totalExpense,
                totalPurchasingActual: totalPurchasingActual,
                totalPurchasingEst: totalPurchasingEst,
                taskCount: tasks.length,
                taskDonePercent: taskDonePercent
            },
            rundowns: rundowns,
            transactions: transactions,
            purchases: purchases,
            tasks: tasks,
            consumptions: consumptions,
            announcements: announcements,
            participants: participants
        };
    } else {
        const archives = getOutingArchives();
        const found = archives.find(a => a.id === outingId);
        if (found) {
            return {
                isArchive: true,
                id: found.id,
                title: found.title || found.outing?.name || 'Arsip Outing',
                outing: found.outing || {},
                stats: found.stats || {},
                rundowns: found.rundowns || [],
                transactions: found.transactions || [],
                purchases: found.purchases || [],
                tasks: found.tasks || [],
                consumptions: found.consumptions || [],
                announcements: found.announcements || [],
                participants: found.participants || []
            };
        }
        return null;
    }
}

function generateSoftcopyReportHtml(data) {
    if (!data) return '<div class="alert alert-warning p-4 text-center">Data outing tidak ditemukan.</div>';

    const out = data.outing || {};
    const stats = data.stats || {};
    const rundowns = data.rundowns || [];
    const transactions = data.transactions || [];
    const purchases = data.purchases || [];
    const tasks = data.tasks || [];
    const consumptions = data.consumptions || [];
    const announcements = data.announcements || [];
    const participants = data.participants || [];

    const formatCurrency = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');
    const statusText = out.status || 'ACTIVE';
    const badgeClass = statusText === 'COMPLETED' ? 'bg-success text-white' : (statusText === 'ACTIVE' ? 'bg-primary text-white' : 'bg-warning text-dark');

    const printDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    let html = `
        <div class="report-header-box">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                    <div class="report-title">${escapeHtml(out.name || 'LAPORAN KEGIATAN OUTING')}</div>
                    <div class="report-subtitle">
                        LAPORAN PERTANGGUNGJAWABAN (LPJ) &amp; REKAPITULASI RESMI ACARA
                    </div>
                </div>
                <div class="text-end">
                    <span class="report-badge-status ${badgeClass}">STATUS: ${statusText}</span>
                    <div class="text-muted mt-1" style="font-size: 11px;">Tanggal Cetak: ${printDate}</div>
                </div>
            </div>
        </div>

        <!-- INFORMASI ACARA -->
        <div class="report-meta-grid">
            <div class="report-meta-item">
                <strong>Tanggal Pelaksanaan:</strong>
                <span>${escapeHtml(out.start_date || '-')} s/d ${escapeHtml(out.end_date || '-')}</span>
            </div>
            <div class="report-meta-item">
                <strong>Lokasi / Venue:</strong>
                <span>${escapeHtml(out.location || '-')}</span>
            </div>
            <div class="report-meta-item">
                <strong>Alamat Lengkap:</strong>
                <span>${escapeHtml(out.address || '-')}</span>
            </div>
            <div class="report-meta-item">
                <strong>Tema &amp; Deskripsi:</strong>
                <span>${escapeHtml(out.description || 'Kebersamaan seluruh anggota panitia dan peserta.')}</span>
            </div>
        </div>

        <!-- KPI SUMMARY ROW -->
        <div class="report-kpi-row">
            <div class="report-kpi-card">
                <div class="report-kpi-label">Total Peserta</div>
                <div class="report-kpi-val text-primary">${stats.totalParticipants || 0} Orang</div>
            </div>
            <div class="report-kpi-card kpi-success">
                <div class="report-kpi-label">Sisa Saldo Kas</div>
                <div class="report-kpi-val text-success">${formatCurrency(stats.balance || 0)}</div>
            </div>
            <div class="report-kpi-card kpi-danger">
                <div class="report-kpi-label">Total Pengeluaran</div>
                <div class="report-kpi-val text-danger">${formatCurrency(stats.totalExpense || 0)}</div>
            </div>
            <div class="report-kpi-card kpi-warning">
                <div class="report-kpi-label">Realisasi Belanja</div>
                <div class="report-kpi-val text-warning">${formatCurrency(stats.totalPurchasingActual || 0)}</div>
            </div>
            <div class="report-kpi-card kpi-info">
                <div class="report-kpi-label">Progress Logistik</div>
                <div class="report-kpi-val text-info">${stats.taskDonePercent || 0}% Selesai</div>
            </div>
        </div>

        <!-- BAB I: RUNDOWN -->
        <div class="report-section-heading">
            <span><i class="bi bi-calendar-event me-1"></i> BAB I. SUSUNAN ACARA &amp; RUNDOWN KEGIATAN</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${rundowns.length} Agenda Kegiatan</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th style="width: 140px;">Waktu Pelaksanaan</th>
                    <th>Nama Kegiatan / Agenda</th>
                    <th>Lokasi</th>
                    <th>Keterangan / PIC</th>
                </tr>
            </thead>
            <tbody>
                ${rundowns.length === 0 ? '<tr><td colspan="5" class="text-center text-muted py-2">Tidak ada data rundown</td></tr>' : 
                    rundowns.map((r, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td class="fw-semibold text-nowrap">${escapeHtml(r.start_time || '')} ${r.end_time ? '- ' + escapeHtml(r.end_time) : ''}</td>
                            <td class="fw-bold">${escapeHtml(r.title || r.activity || '-')}</td>
                            <td>${escapeHtml(r.location || '-')}</td>
                            <td>${escapeHtml(r.description || '-')}</td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB II: KEUANGAN -->
        <div class="report-section-heading">
            <span><i class="bi bi-wallet2 me-1"></i> BAB II. LAPORAN PERTANGGUNGJAWABAN KEUANGAN (BUKU KAS)</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">Pemasukan: ${formatCurrency(stats.totalIncome)} | Pengeluaran: ${formatCurrency(stats.totalExpense)}</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th style="width: 90px;">Tanggal</th>
                    <th style="width: 70px;" class="text-center">Jenis</th>
                    <th>Kategori</th>
                    <th>Deskripsi / Uraian Transaksi</th>
                    <th class="text-end" style="width: 120px;">Nominal (Rp)</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.length === 0 ? '<tr><td colspan="6" class="text-center text-muted py-2">Tidak ada data transaksi keuangan</td></tr>' :
                    transactions.map((t, i) => {
                        const isInc = ['IN', 'INCOME', 'MASUK'].includes(String(t.type || '').toUpperCase());
                        return `
                            <tr>
                                <td class="text-center">${i + 1}</td>
                                <td>${escapeHtml(t.transaction_date || '-')}</td>
                                <td class="text-center"><span class="badge ${isInc ? 'bg-success' : 'bg-danger'}" style="font-size: 9.5px;">${isInc ? 'MASUK' : 'KELUAR'}</span></td>
                                <td class="fw-semibold">${escapeHtml(t.category || '-')}</td>
                                <td>${escapeHtml(t.description || '-')}</td>
                                <td class="text-end fw-bold ${isInc ? 'text-success' : 'text-danger'}">${formatCurrency(t.amount)}</td>
                            </tr>
                        `;
                    }).join('')
                }
                <tr style="background: #edf2f7; font-weight: 700;">
                    <td colspan="5" class="text-end">SISA SALDO KAS AKHIR:</td>
                    <td class="text-end text-primary fs-6">${formatCurrency(stats.balance || 0)}</td>
                </tr>
            </tbody>
        </table>

        <!-- BAB III: PURCHASING -->
        <div class="report-section-heading">
            <span><i class="bi bi-cart-check me-1"></i> BAB III. REKAPITULASI PENGADAAN BARANG &amp; JASA (PURCHASING)</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${purchases.length} Permintaan Pengadaan</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th>Nama Barang / Kebutuhan</th>
                    <th style="width: 70px;" class="text-center">Qty / Satuan</th>
                    <th class="text-end" style="width: 100px;">Estimasi</th>
                    <th class="text-end" style="width: 100px;">Biaya Aktual</th>
                    <th>Vendor / Toko</th>
                    <th style="width: 90px;" class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                ${purchases.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-2">Tidak ada data purchasing</td></tr>' :
                    purchases.map((p, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td class="fw-bold">${escapeHtml(p.item_name || p.item || '-')}</td>
                            <td class="text-center">${p.quantity || 1} ${escapeHtml(p.unit || 'Pcs')}</td>
                            <td class="text-end text-muted">${formatCurrency(p.estimated_cost)}</td>
                            <td class="text-end fw-bold text-dark">${formatCurrency(p.actual_cost)}</td>
                            <td>${escapeHtml(p.vendor || '-')}</td>
                            <td class="text-center"><span class="badge bg-secondary" style="font-size: 9.5px;">${escapeHtml(p.status || 'PENDING')}</span></td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB IV: LOGISTIK & TUGAS -->
        <div class="report-section-heading">
            <span><i class="bi bi-box-seam me-1"></i> BAB IV. LOGISTIK, PERLENGKAPAN &amp; OPERASIONAL</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${tasks.length} Tugas Operasional</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th>Nama Tugas / Perlengkapan</th>
                    <th style="width: 80px;" class="text-center">Prioritas</th>
                    <th style="width: 90px;">Deadline</th>
                    <th>Penanggung Jawab</th>
                    <th style="width: 70px;" class="text-center">Progress</th>
                    <th style="width: 80px;" class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-2">Tidak ada data tugas logistik</td></tr>' :
                    tasks.map((t, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td class="fw-bold">${escapeHtml(t.title || t.description || '-')}</td>
                            <td class="text-center">${escapeHtml(t.priority || 'MEDIUM')}</td>
                            <td>${escapeHtml(t.deadline || '-')}</td>
                            <td>${escapeHtml(t.assigned_to || '-')}</td>
                            <td class="text-center fw-bold text-primary">${t.progress || (t.status === 'DONE' ? 100 : 0)}%</td>
                            <td class="text-center"><span class="badge ${t.status === 'DONE' ? 'bg-success' : 'bg-warning text-dark'}" style="font-size: 9.5px;">${escapeHtml(t.status || 'TODO')}</span></td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB V: KONSUMSI -->
        <div class="report-section-heading">
            <span><i class="bi bi-cup-hot me-1"></i> BAB V. RENCANA &amp; REALISASI KONSUMSI (MEAL PLAN)</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${consumptions.length} Sesi Makan</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th style="width: 90px;">Tanggal</th>
                    <th style="width: 110px;">Sesi Makan</th>
                    <th>Lokasi Makan</th>
                    <th style="width: 80px;" class="text-center">Porsi</th>
                    <th>Vendor Katering</th>
                    <th class="text-end" style="width: 100px;">Biaya Aktual</th>
                </tr>
            </thead>
            <tbody>
                ${consumptions.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-2">Tidak ada data meal plan konsumsi</td></tr>' :
                    consumptions.map((c, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td>${escapeHtml(c.date || '-')}</td>
                            <td class="fw-bold">${escapeHtml(c.meal_type || '-')}</td>
                            <td>${escapeHtml(c.location || '-')}</td>
                            <td class="text-center">${c.participant_count || 0} porsi</td>
                            <td>${escapeHtml(c.vendor || '-')}</td>
                            <td class="text-end fw-bold">${formatCurrency(c.actual_cost || c.estimated_cost)}</td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB VI: PENGUMUMAN -->
        <div class="report-section-heading">
            <span><i class="bi bi-megaphone me-1"></i> BAB VI. RIWAYAT SIARAN INFORMASI &amp; PENGUMUMAN</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${announcements.length} Siaran Informasi</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th style="width: 90px;">Tanggal</th>
                    <th style="width: 180px;">Judul Pengumuman</th>
                    <th style="width: 80px;" class="text-center">Prioritas</th>
                    <th>Isi Pesan Siaran</th>
                </tr>
            </thead>
            <tbody>
                ${announcements.length === 0 ? '<tr><td colspan="5" class="text-center text-muted py-2">Tidak ada siaran pengumuman</td></tr>' :
                    announcements.map((a, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td>${escapeHtml(a.publish_date || '-')}</td>
                            <td class="fw-bold">${escapeHtml(a.title || '-')}</td>
                            <td class="text-center"><span class="badge ${a.priority === 'HIGH' ? 'bg-danger' : 'bg-primary'}" style="font-size: 9.5px;">${escapeHtml(a.priority || 'NORMAL')}</span></td>
                            <td>${escapeHtml(a.content || a.message || '-')}</td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB VII: PESERTA -->
        <div class="report-section-heading">
            <span><i class="bi bi-people me-1"></i> BAB VII. DIREKTORI PESERTA OUTING &amp; FASILITAS</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${participants.length} Peserta Terdaftar</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 35px;" class="text-center">No</th>
                    <th>Nama Lengkap Peserta</th>
                    <th>Departemen</th>
                    <th style="width: 45px;" class="text-center">L/P</th>
                    <th>Armada Bus</th>
                    <th>Kamar / Rooming</th>
                    <th>No. WhatsApp</th>
                </tr>
            </thead>
            <tbody>
                ${participants.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-2">Tidak ada data peserta</td></tr>' :
                    participants.map((p, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td class="fw-bold">${escapeHtml(p.full_name || p.name || '-')}</td>
                            <td>${escapeHtml(p.department || '-')}</td>
                            <td class="text-center">${escapeHtml(p.gender || 'L')}</td>
                            <td>${escapeHtml(p.transport || 'Bus 1')}</td>
                            <td>${escapeHtml(p.room || 'Villa')}</td>
                            <td>${escapeHtml(p.phone || '-')}</td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- LEMBAR PENGESAHAN / TANDA TANGAN -->
        <div class="report-signatures">
            <div class="report-sign-box">
                <div>Mengetahui,</div>
                <div class="fw-bold">Ketua Panitia / Inisiator Acara</div>
                <div class="report-sign-line">Budi Santoso</div>
                <div class="text-muted" style="font-size: 10.5px;">Ketua Pelaksana Outing</div>
            </div>
            <div class="report-sign-box">
                <div>Dibuat &amp; Dilaporkan Oleh,</div>
                <div class="fw-bold">Seksi Keuangan / Bendahara</div>
                <div class="report-sign-line">Siti Rahma</div>
                <div class="text-muted" style="font-size: 10.5px;">Bendahara Panitia Outing</div>
            </div>
        </div>
    `;

    return html;
}

function updateArchiveSelectors() {
    const archives = getOutingArchives();
    const currentInfo = STORAGE.get('outing_current_info', {}) || {};
    const currentLabel = `🟢 Outing Aktif: ${currentInfo.name || 'Annual Outing'}`;

    const settingSel = document.getElementById('settingOutingArchiveSelector');
    const modalSel = document.getElementById('modalReportOutingSelector');

    let optionsHtml = `<option value="current">${escapeHtml(currentLabel)}</option>`;
    if (archives && archives.length > 0) {
        archives.forEach(arch => {
            const dt = arch.created_at ? new Date(arch.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '';
            optionsHtml += `<option value="${arch.id}">📦 ${escapeHtml(arch.title || arch.outing?.name || 'Arsip')} (${dt})</option>`;
        });
    }

    if (settingSel) settingSel.innerHTML = optionsHtml;
    if (modalSel) modalSel.innerHTML = optionsHtml;

    onSelectArchiveOuting(currentSelectedReportOutingId || 'current');
}

function onSelectArchiveOuting(selectedId) {
    currentSelectedReportOutingId = selectedId || 'current';
    const settingSel = document.getElementById('settingOutingArchiveSelector');
    if (settingSel && settingSel.value !== currentSelectedReportOutingId) {
        settingSel.value = currentSelectedReportOutingId;
    }
    const modalSel = document.getElementById('modalReportOutingSelector');
    if (modalSel && modalSel.value !== currentSelectedReportOutingId) {
        modalSel.value = currentSelectedReportOutingId;
    }

    const previewCard = document.getElementById('selectedOutingPreviewCard');
    if (!previewCard) return;

    const data = getOutingDataForReport(currentSelectedReportOutingId);
    if (!data) {
        previewCard.innerHTML = '<div class="text-muted small">Data outing tidak ditemukan.</div>';
        return;
    }

    const out = data.outing || {};
    const stats = data.stats || {};
    const isAct = !data.isArchive;

    previewCard.innerHTML = `
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge ${isAct ? 'bg-primary' : 'bg-secondary'}">${isAct ? 'Outing Aktif Saat Ini' : 'Outing Sebelumnya (Arsip)'}</span>
                    <strong class="text-dark">${escapeHtml(out.name || data.title)}</strong>
                </div>
                <div class="small text-muted">
                    <i class="bi bi-geo-alt me-1"></i>${escapeHtml(out.location || 'Puncak, Bogor')} &bull; 
                    <i class="bi bi-calendar me-1"></i>${escapeHtml(out.start_date || '-')} s/d ${escapeHtml(out.end_date || '-')}
                </div>
            </div>
            <div class="d-flex flex-wrap gap-2 text-center text-sm-end" style="font-size: 11.5px;">
                <div class="px-2 py-1 bg-white border rounded">
                    <div class="text-muted small">Peserta</div>
                    <strong class="text-primary">${stats.totalParticipants || 0}</strong>
                </div>
                <div class="px-2 py-1 bg-white border rounded">
                    <div class="text-muted small">Saldo Kas</div>
                    <strong class="text-success">Rp ${Number(stats.balance || 0).toLocaleString('id-ID')}</strong>
                </div>
                <div class="px-2 py-1 bg-white border rounded">
                    <div class="text-muted small">Purchasing</div>
                    <strong class="text-warning">Rp ${Number(stats.totalPurchasingActual || 0).toLocaleString('id-ID')}</strong>
                </div>
            </div>
        </div>
    `;
}

function renderArchivesTable() {
    const tbody = document.getElementById('archivesTableBody');
    const badge = document.getElementById('archiveCountBadge');
    if (!tbody) return;

    const archives = getOutingArchives();
    if (badge) badge.textContent = `${archives.length} arsip tersimpan`;

    if (!archives || archives.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-3 text-muted">
                    Belum ada riwayat arsip outing sebelumnya. Klik <strong>"Arsipkan Outing Aktif"</strong> untuk menyimpan snapshot outing saat ini.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = archives.map((arch, idx) => {
        const out = arch.outing || {};
        const stats = arch.stats || {};
        const archDate = arch.created_at ? new Date(arch.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
        return `
            <tr>
                <td>
                    <div class="fw-bold text-dark">${escapeHtml(arch.title || out.name || 'Outing')}</div>
                    <small class="text-muted">${escapeHtml(out.description || 'Arsip kegiatan outing sebelumnya')}</small>
                </td>
                <td>
                    <div>${escapeHtml(out.location || '-')}</div>
                    <small class="text-muted">${escapeHtml(out.start_date || '-')} s/d ${escapeHtml(out.end_date || '-')}</small>
                </td>
                <td class="text-center fw-semibold text-primary">${stats.totalParticipants || (arch.participants?.length || 0)} org</td>
                <td>
                    <div class="text-success fw-semibold">Saldo: Rp ${Number(stats.balance || 0).toLocaleString('id-ID')}</div>
                    <small class="text-muted">Biaya: Rp ${Number(stats.totalExpense || 0).toLocaleString('id-ID')}</small>
                </td>
                <td class="text-nowrap text-muted">${archDate}</td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-primary" onclick="openSoftcopyReportModal('${arch.id}')" title="Buka / Cetak Softcopy Report">
                            <i class="bi bi-file-earmark-pdf"></i> Report
                        </button>
                        <button type="button" class="btn btn-outline-success" onclick="exportArchiveMasterExcel('${arch.id}')" title="Unduh Master Rekap Excel 8-Sheet">
                            <i class="bi bi-file-earmark-excel"></i>
                        </button>
                        <button type="button" class="btn btn-outline-dark" onclick="downloadArchiveJson('${arch.id}')" title="Unduh file JSON">
                            <i class="bi bi-download"></i>
                        </button>
                        <button type="button" class="btn btn-outline-info" onclick="restoreArchiveToActive('${arch.id}')" title="Pulihkan data arsip ini ke sistem aktif">
                            <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="deleteArchive('${arch.id}')" title="Hapus arsip ini">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openSoftcopyReportModal(outingId) {
    currentSelectedReportOutingId = outingId || currentSelectedReportOutingId || 'current';
    updateArchiveSelectors();

    const data = getOutingDataForReport(currentSelectedReportOutingId);
    const printArea = document.getElementById('reportPrintArea');
    if (printArea) {
        printArea.innerHTML = generateSoftcopyReportHtml(data);
    }

    const modalEl = document.getElementById('modalSoftcopyReport');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
}

function onModalReportOutingChanged(newOutingId) {
    currentSelectedReportOutingId = newOutingId;
    const data = getOutingDataForReport(currentSelectedReportOutingId);
    const printArea = document.getElementById('reportPrintArea');
    if (printArea) {
        printArea.innerHTML = generateSoftcopyReportHtml(data);
    }
    const settingSel = document.getElementById('settingOutingArchiveSelector');
    if (settingSel) settingSel.value = newOutingId;
    onSelectArchiveOuting(newOutingId);
}

function printSoftcopyReport() {
    window.print();
}

function downloadCurrentModalHtmlReport() {
    downloadStandaloneHtmlReport(currentSelectedReportOutingId);
}

function downloadCurrentModalExcel() {
    exportArchiveMasterExcel(currentSelectedReportOutingId);
}

function downloadCurrentModalJson() {
    downloadArchiveJson(currentSelectedReportOutingId);
}

function downloadStandaloneHtmlReport(outingId) {
    const data = getOutingDataForReport(outingId);
    if (!data) {
        alert('Data outing tidak ditemukan.');
        return;
    }

    const reportBodyHtml = generateSoftcopyReportHtml(data);
    const safeTitle = (data.title || 'Laporan_Outing').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Report_Softcopy_${safeTitle}_${dateStr}.html`;

    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Softcopy - ${escapeHtml(data.title)}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background: #e2e8f0;
            padding: 30px 15px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
        }
        .report-paper {
            background: #ffffff;
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 48px;
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.15);
            border-radius: 8px;
        }
        .report-header-box { border-bottom: 3px double #0d6efd; padding-bottom: 18px; margin-bottom: 22px; }
        .report-title { font-size: 21px; font-weight: 800; color: #0b5ed7; text-transform: uppercase; margin-bottom: 3px; }
        .report-subtitle { font-size: 13.5px; color: #64748b; font-weight: 500; }
        .report-badge-status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .report-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; font-size: 12.5px; }
        .report-meta-item strong { display: block; color: #64748b; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px; }
        .report-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 24px; }
        .report-kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #fff; border-top: 3.5px solid #0d6efd; }
        .report-kpi-card.kpi-success { border-top-color: #198754; }
        .report-kpi-card.kpi-warning { border-top-color: #f59e0b; }
        .report-kpi-card.kpi-danger  { border-top-color: #dc3545; }
        .report-kpi-card.kpi-info    { border-top-color: #0dcaf0; }
        .report-kpi-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; }
        .report-kpi-val { font-size: 15.5px; font-weight: 800; color: #0f172a; margin-top: 2px; }
        .report-section-heading { font-size: 13.5px; font-weight: 700; color: #0f172a; text-transform: uppercase; padding-bottom: 5px; margin-top: 22px; margin-bottom: 10px; border-bottom: 1.5px solid #cbd5e1; display: flex; align-items: center; justify-content: space-between; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 16px; }
        .report-table th { background: #f1f5f9; color: #334155; font-weight: 700; text-transform: uppercase; font-size: 10px; padding: 7px 9px; border: 1px solid #cbd5e1; text-align: left; }
        .report-table td { padding: 6.5px 9px; border: 1px solid #e2e8f0; vertical-align: top; }
        .report-table tr:nth-child(even) td { background: #f8fafc; }
        .report-signatures { margin-top: 32px; padding-top: 14px; display: flex; justify-content: space-around; text-align: center; font-size: 11.5px; }
        .report-sign-box { width: 220px; }
        .report-sign-line { margin-top: 55px; border-bottom: 1.5px solid #334155; font-weight: 700; padding-bottom: 4px; }
        .floating-bar { position: fixed; top: 15px; right: 15px; z-index: 999; background: white; padding: 8px 14px; border-radius: 30px; box-shadow: 0 4px 15px rgba(0,0,0,.15); display: flex; gap: 8px; }
        @media print {
            body { background: white !important; padding: 0 !important; }
            .report-paper { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
            .floating-bar { display: none !important; }
            @page { size: A4 portrait; margin: 12mm 14mm; }
        }
    </style>
</head>
<body>
    <div class="floating-bar">
        <button class="btn btn-sm btn-primary" onclick="window.print()"><i class="bi bi-printer me-1"></i> Cetak / Simpan PDF</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="window.close()"><i class="bi bi-x-lg"></i></button>
    </div>
    <div class="report-paper">
        ${reportBodyHtml}
    </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Dokumen Softcopy Report <strong>${escapeHtml(data.title)}</strong> (.html) berhasil diunduh.`);
}

function downloadArchiveJson(outingId) {
    const data = getOutingDataForReport(outingId);
    if (!data) {
        alert('Data outing tidak ditemukan.');
        return;
    }

    const safeTitle = (data.title || 'Outing').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Backup_Outing_${safeTitle}_${dateStr}.json`;

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Berkas Backup JSON <strong>${escapeHtml(filename)}</strong> berhasil diunduh.`);
}

function exportArchiveMasterExcel(outingId) {
    const data = getOutingDataForReport(outingId);
    if (!data) {
        alert('Data outing tidak ditemukan.');
        return;
    }

    const wb = XLSX.utils.book_new();
    const todayStr = new Date().toISOString().split('T')[0];
    const outing = data.outing || {};

    // Sheet 1: Overview
    const overviewData = [
        { "Parameter": "Nama Kegiatan Outing", "Nilai": outing.name || data.title },
        { "Parameter": "Tanggal Pelaksanaan", "Nilai": `${outing.start_date || '-'} s/d ${outing.end_date || '-'}` },
        { "Parameter": "Lokasi Utama / Venue", "Nilai": outing.location || '-' },
        { "Parameter": "Alamat Lengkap", "Nilai": outing.address || '-' },
        { "Parameter": "Tema / Deskripsi", "Nilai": outing.description || '-' },
        { "Parameter": "Status Acara", "Nilai": outing.status || 'ACTIVE' },
        { "Parameter": "Tipe Data", "Nilai": data.isArchive ? 'Arsip Outing Sebelumnya' : 'Outing Aktif' },
        { "Parameter": "Waktu Ekspor Master", "Nilai": new Date().toLocaleString('id-ID') }
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    wsOverview['!cols'] = [{ wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsOverview, "Info Acara");

    // All Modules
    const moduleMap = [
        { key: 'rundown', name: 'Rundown Acara', data: data.rundowns || [] },
        { key: 'finance', name: 'Laporan Keuangan', data: data.transactions || [] },
        { key: 'purchasing', name: 'Purchasing', data: data.purchases || [] },
        { key: 'logistic', name: 'Logistik & Tugas', data: data.tasks || [] },
        { key: 'konsumsi', name: 'Konsumsi & Meal', data: data.consumptions || [] },
        { key: 'public_area', name: 'Public Area', data: data.announcements || [] },
        { key: 'participants', name: 'Data Peserta', data: data.participants || [] }
    ];

    moduleMap.forEach(m => {
        const conf = EXCEL_MODULE_CONFIG[m.key];
        const rows = conf ? conf.transformExport(m.data) : m.data;
        const ws = XLSX.utils.json_to_sheet(rows);

        if (rows.length > 0) {
            const colWidths = [];
            Object.keys(rows[0]).forEach(k => {
                let maxLen = k.length;
                rows.forEach(r => {
                    const val = String(r[k] || '');
                    if (val.length > maxLen) maxLen = val.length;
                });
                colWidths.push({ wch: Math.min(65, Math.max(maxLen + 3, 10)) });
            });
            ws['!cols'] = colWidths;
        }
        const sName = m.name.replace(/[\/\\?*:[\]]/g, '').slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sName);
    });

    const safeTitle = (data.title || 'Master_Rekap').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Master_Rekap_${safeTitle}_${todayStr}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast(`Master Rekap Excel <strong>${escapeHtml(filename)}</strong> (8 sheets) berhasil diunduh.`);
}

function restoreArchiveToActive(archiveId) {
    if (!canManage('settings')) {
        alert('Hanya Admin atau Inisiator yang berwenang memulihkan data outing.');
        return;
    }

    const archives = getOutingArchives();
    const found = archives.find(a => a.id === archiveId);
    if (!found) {
        alert('Arsip tidak ditemukan.');
        return;
    }

    const ok = confirm(`Apakah Anda yakin ingin memulihkan outing "${found.title}" menjadi outing aktif di sistem?\\n\\nData aktif saat ini akan digantikan dengan data dari arsip ini.`);
    if (!ok) return;

    // First, snapshot current active outing into archive
    saveCurrentOutingToArchive(`Cadangan Sebelum Restore (${new Date().toLocaleTimeString('id-ID')})`);

    // Restore data
    if (found.outing) STORAGE.set('outing_current_info', found.outing);
    if (found.rundowns) STORAGE.set('outing_rundowns', found.rundowns);
    if (found.transactions) STORAGE.set('outing_transactions', found.transactions);
    if (found.purchases) STORAGE.set('outing_purchases', found.purchases);
    if (found.tasks) STORAGE.set('outing_tasks', found.tasks);
    if (found.consumptions) STORAGE.set('outing_consumptions', found.consumptions);
    if (found.announcements) STORAGE.set('outing_announcements', found.announcements);
    if (found.participants) STORAGE.set('outing_participants', found.participants);

    // Sync Supabase Outing Info
    try {
        if (found.outing) supabaseClient.from('outings').upsert(found.outing).then(() => {});
    } catch (e) {}

    loadDashboard();
    alert(`Outing "${found.title}" berhasil dipulihkan menjadi outing aktif!`);
}

function deleteArchive(archiveId) {
    if (!canManage('settings')) {
        alert('Hanya Admin atau Inisiator yang dapat menghapus arsip.');
        return;
    }

    const archives = getOutingArchives();
    const found = archives.find(a => a.id === archiveId);
    if (!found) return;

    const ok = confirm(`Apakah Anda yakin ingin menghapus arsip "${found.title}" dari riwayat?`);
    if (!ok) return;

    const updated = archives.filter(a => a.id !== archiveId);
    STORAGE.set(STORAGE_KEY_ARCHIVES, updated);
    renderArchivesTable();
    updateArchiveSelectors();
    showToast('Arsip outing berhasil dihapus.');
}

function triggerImportArchiveJson() {
    const input = document.getElementById('inputImportArchiveJson');
    if (input) input.click();
}

function handleImportArchiveJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.outing && !data.title) {
                alert('Format berkas JSON arsip tidak valid.');
                return;
            }

            const newArchive = {
                id: 'arch-' + Date.now(),
                title: data.title || data.outing?.name || file.name.replace('.json', ''),
                created_at: new Date().toISOString(),
                outing: data.outing || {},
                stats: data.stats || {},
                rundowns: data.rundowns || [],
                transactions: data.transactions || [],
                purchases: data.purchases || [],
                tasks: data.tasks || [],
                consumptions: data.consumptions || [],
                announcements: data.announcements || [],
                participants: data.participants || []
            };

            const archives = getOutingArchives();
            archives.unshift(newArchive);
            STORAGE.set(STORAGE_KEY_ARCHIVES, archives);

            renderArchivesTable();
            updateArchiveSelectors();
            alert(`Arsip "${newArchive.title}" berhasil diimpor dari file JSON!`);
        } catch (err) {
            alert('Gagal membaca file JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function updateSupabaseStatsSummary() {
    const trans = STORAGE.get('outing_transactions', []) || [];
    const runds = STORAGE.get('outing_rundowns', []) || [];
    const purchs = STORAGE.get('outing_purchases', []) || [];
    const tasks = STORAGE.get('outing_tasks', []) || [];
    const conss = STORAGE.get('outing_consumptions', []) || [];
    const anns = STORAGE.get('outing_announcements', []) || [];
    const parts = STORAGE.get('outing_participants', []) || [];

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setVal('dbStatFinance', trans.length);
    setVal('dbStatRundown', runds.length);
    setVal('dbStatPurchasing', purchs.length);
    setVal('dbStatLogistic', tasks.length);
    setVal('dbStatKonsumsi', conss.length);
    setVal('dbStatParticipants', parts.length);

    setVal('purgeCntFinance', trans.length);
    setVal('purgeCntRundown', runds.length);
    setVal('purgeCntPurchasing', purchs.length);
    setVal('purgeCntTasks', tasks.length);
    setVal('purgeCntConsumptions', conss.length);
    setVal('purgeCntAnnouncements', anns.length);
}

function openPurgeSupabaseModal() {
    if (!canManage('settings')) {
        alert('Hanya Admin atau Inisiator yang berwenang membersihkan database Supabase dan memulai outing baru.');
        return;
    }

    updateSupabaseStatsSummary();

    const cur = STORAGE.get('outing_current_info', {}) || {};
    const nextYear = new Date().getFullYear() + 1;
    const nameInput = document.getElementById('newOutingName');
    if (nameInput) nameInput.value = `Annual Outing ${nextYear}`;
    const startInput = document.getElementById('newOutingStartDate');
    if (startInput) startInput.value = `${nextYear}-10-15`;
    const endInput = document.getElementById('newOutingEndDate');
    if (endInput) endInput.value = `${nextYear}-10-17`;
    const locInput = document.getElementById('newOutingLocation');
    if (locInput) locInput.value = 'Hotel & Resort Destinasi Pilihan';
    const addrInput = document.getElementById('newOutingAddress');
    if (addrInput) addrInput.value = '';
    const descInput = document.getElementById('newOutingDescription');
    if (descInput) descInput.value = 'Kegiatan Outing & Silaturahmi Tim';

    const msg = document.getElementById('purgeModalMessage');
    if (msg) msg.innerHTML = '';

    const modalEl = document.getElementById('modalPurgeSupabase');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
}

async function executePurgeSupabaseAndNewOuting() {
    const btn = document.getElementById('btnConfirmPurgeSupabase');
    const msg = document.getElementById('purgeModalMessage');
    const newName = document.getElementById('newOutingName').value.trim();
    const newStart = document.getElementById('newOutingStartDate').value;
    const newEnd = document.getElementById('newOutingEndDate').value;
    const newLoc = document.getElementById('newOutingLocation').value.trim();
    const newAddr = document.getElementById('newOutingAddress').value.trim();
    const newDesc = document.getElementById('newOutingDescription').value.trim();

    if (!newName || !newStart || !newEnd || !newLoc) {
        if (msg) msg.innerHTML = `<div class="alert alert-danger py-2 small">Mohon lengkapi Nama Acara, Tanggal, dan Lokasi Outing Baru.</div>`;
        return;
    }

    const ok = confirm(`PERINGATAN PEMBERSIHAN DATABASE SUPABASE:\\n\\n` +
        `Data kegiatan lama yang dicentang akan DIHAPUS dari tabel Supabase dan LocalStorage agar kuota database tetap hemat.\\n` +
        `Data outing saat ini akan otomatis dicadangkan ke Riwayat Arsip terlebih dahulu.\\n\\n` +
        `Lanjutkan pembersihan dan terapkan Outing Baru "${newName}"?`);
    if (!ok) return;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Membersihkan Supabase...`;
    }

    try {
        // 1. Automatic Archive of Current Outing before purge
        const currentOutingInfo = STORAGE.get('outing_current_info', {}) || {};
        saveCurrentOutingToArchive(`Arsip Sebelum Reset (${currentOutingInfo.name || 'Outing Sebelumnya'})`);

        // 2. Check checkboxes
        const purgeFinance = document.getElementById('purgeChkFinance')?.checked ?? true;
        const purgeRundown = document.getElementById('purgeChkRundown')?.checked ?? true;
        const purgePurchasing = document.getElementById('purgeChkPurchasing')?.checked ?? true;
        const purgeTasks = document.getElementById('purgeChkTasks')?.checked ?? true;
        const purgeConsumptions = document.getElementById('purgeChkConsumptions')?.checked ?? true;
        const purgeAnnouncements = document.getElementById('purgeChkAnnouncements')?.checked ?? true;

        const partOption = document.querySelector('input[name="purgeParticipantOption"]:checked')?.value || 'reset_assignment';

        // 3. Supabase Deletions with safety where clause (.neq('id', '00000000-0000-0000-0000-000000000000'))
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                if (purgeFinance) {
                    await supabaseClient.from('cash_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgeRundown) {
                    await supabaseClient.from('rundowns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgePurchasing) {
                    await supabaseClient.from('purchase_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgeTasks) {
                    await supabaseClient.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgeConsumptions) {
                    await supabaseClient.from('consumption_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgeAnnouncements) {
                    await supabaseClient.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }

                if (partOption === 'delete_all') {
                    await supabaseClient.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                } else if (partOption === 'reset_assignment') {
                    await supabaseClient.from('participants').update({ transport: 'Bus 1', room: 'Villa' }).neq('id', '00000000-0000-0000-0000-000000000000');
                }
            } catch (dbErr) {
                console.warn('Supabase bulk delete notice:', dbErr);
            }
        }

        // 4. Clear LocalStorage Arrays for purged modules
        if (purgeFinance) STORAGE.set('outing_transactions', []);
        if (purgeRundown) STORAGE.set('outing_rundowns', []);
        if (purgePurchasing) STORAGE.set('outing_purchases', []);
        if (purgeTasks) STORAGE.set('outing_tasks', []);
        if (purgeConsumptions) STORAGE.set('outing_consumptions', []);
        if (purgeAnnouncements) STORAGE.set('outing_announcements', []);

        if (partOption === 'delete_all') {
            STORAGE.set('outing_participants', []);
        } else if (partOption === 'reset_assignment') {
            const parts = STORAGE.get('outing_participants', []) || [];
            const resetParts = parts.map(p => ({ ...p, transport: 'Bus 1', room: 'Villa' }));
            STORAGE.set('outing_participants', resetParts);
        }

        // 5. Update Outing Master Info in Supabase & LocalStorage
        const newOutingRecord = {
            id: generateUUID(),
            name: newName,
            start_date: newStart,
            end_date: newEnd,
            event_date: newStart,
            location: newLoc,
            address: newAddr,
            status: 'PLANNING',
            description: newDesc,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        STORAGE.set('outing_current_info', newOutingRecord);
        currentOuting = newOutingRecord;

        try {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                await supabaseClient.from('outings').insert(newOutingRecord);
            }
        } catch (e) {}

        // 6. Close Modal & Reload
        bootstrap.Modal.getInstance(document.getElementById('modalPurgeSupabase')).hide();

        await loadDashboard();
        updateArchiveSelectors();
        renderArchivesTable();
        updateSupabaseStatsSummary();

        alert(`SUKSES! Data kegiatan lama berhasil dibersihkan dari database Supabase dan LocalStorage.\\n\\n` +
            `Sistem kini telah diperbarui untuk Outing Baru: "${newName}".\\n` +
            `Data outing sebelumnya tetap tersimpan aman di Riwayat Arsip & dapat diunduh softcopy-nya kapan saja!`);

    } catch (err) {
        console.error('Error executing purge:', err);
        if (msg) msg.innerHTML = `<div class="alert alert-danger py-2 small">Terjadi kesalahan: ${err.message}</div>`;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-stars me-1"></i> Bersihkan Supabase & Terapkan Outing Baru`;
        }
    }
}
"""

if 'OUTING SOFTCOPY REPORT & SUPABASE LIFECYCLE MANAGEMENT ENGINE' not in html:
    html = html[:last_script_pos] + "\n" + js_engine + "\n" + html[last_script_pos:]
    print("JS Engine injected.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Saved updated index.html successfully.")
