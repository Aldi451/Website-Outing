import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

with open('scratch/universal_excel_engine.js', 'r', encoding='utf-8') as f:
    engine_js = f.read()

# 1. Page Home: Add Master Export Toolbar after event-card
home_target = '''            <!-- EVENT HERO BANNER -->
            <div class="event-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="small opacity-75 mb-1 text-uppercase fw-semibold tracking-wider">
                            <i class="bi bi-geo-alt me-1"></i> Informasi Outing
                        </div>
                        <h2 id="eventName">Annual Outing Bersama</h2>
                        <div id="eventInfo" class="opacity-90">Memuat info outing...</div>
                    </div>
                    <button class="btn btn-sm btn-light bg-white bg-opacity-25 text-white border-0" id="btnEditEventTop" onclick="showPage('settings')" title="Kelola Outing">
                        <i class="bi bi-sliders"></i>
                    </button>
                </div>
            </div>'''

home_replacement = '''            <!-- EVENT HERO BANNER -->
            <div class="event-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="small opacity-75 mb-1 text-uppercase fw-semibold tracking-wider">
                            <i class="bi bi-geo-alt me-1"></i> Informasi Outing
                        </div>
                        <h2 id="eventName">Annual Outing Bersama</h2>
                        <div id="eventInfo" class="opacity-90">Memuat info outing...</div>
                    </div>
                    <button class="btn btn-sm btn-light bg-white bg-opacity-25 text-white border-0" id="btnEditEventTop" onclick="showPage('settings')" title="Kelola Outing">
                        <i class="bi bi-sliders"></i>
                    </button>
                </div>
            </div>

            <!-- ACTION TOOLBAR: MASTER EXPORT EXCEL -->
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
            </div>'''

assert home_target in content, "home_target not found!"
content = content.replace(home_target, home_replacement, 1)

# 2. Page Rundown: Add btnExportRundown
rundown_target = '''                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-success" id="btnImportRundown" onclick="openImportRundownModal()">
                            <i class="bi bi-file-earmark-excel me-1"></i> Import Excel
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddRundown" onclick="openRundownModal()">
                            <i class="bi bi-plus-lg me-1"></i> Tambah Kegiatan
                        </button>
                    </div>'''

rundown_replacement = '''                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-success" id="btnExportRundown" onclick="exportModuleExcel('rundown')">
                            <i class="bi bi-file-earmark-arrow-down me-1"></i> Export Excel
                        </button>
                        <button class="btn btn-sm btn-outline-success" id="btnImportRundown" onclick="openExcelImport('rundown')">
                            <i class="bi bi-file-earmark-excel me-1"></i> Import Excel
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddRundown" onclick="openRundownModal()">
                            <i class="bi bi-plus-lg me-1"></i> Tambah Kegiatan
                        </button>
                    </div>'''

assert rundown_target in content, "rundown_target not found!"
content = content.replace(rundown_target, rundown_replacement, 1)

# 3. Page Finance: Add btnExportFinance & btnImportFinance
finance_target = '''                    <button id="btnAddTransaction" class="btn btn-success btn-sm" onclick="openTransactionModal()">
                        <i class="bi bi-plus-lg me-1"></i> Catat Transaksi
                    </button>'''

finance_replacement = '''                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-success" id="btnExportFinance" onclick="exportModuleExcel('finance')">
                            <i class="bi bi-file-earmark-arrow-down me-1"></i> Export Excel
                        </button>
                        <button class="btn btn-sm btn-outline-success" id="btnImportFinance" onclick="openExcelImport('finance')">
                            <i class="bi bi-file-earmark-excel me-1"></i> Import Excel
                        </button>
                        <button id="btnAddTransaction" class="btn btn-primary btn-sm" onclick="openTransactionModal()">
                            <i class="bi bi-plus-lg me-1"></i> Catat Transaksi
                        </button>
                    </div>'''

assert finance_target in content, "finance_target not found!"
content = content.replace(finance_target, finance_replacement, 1)

# 4. Page Purchasing: Add btnExportPurchasing & btnImportPurchasing
purchasing_target = '''                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('management')">
                            <i class="bi bi-arrow-left me-1"></i> Menu
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddPurchase" onclick="openPurchaseModal()">
                            <i class="bi bi-plus-lg me-1"></i> Request Baru
                        </button>
                    </div>'''

purchasing_replacement = '''                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('management')">
                            <i class="bi bi-arrow-left me-1"></i> Menu
                        </button>
                        <button class="btn btn-sm btn-success" id="btnExportPurchasing" onclick="exportModuleExcel('purchasing')">
                            <i class="bi bi-file-earmark-arrow-down me-1"></i> Export Excel
                        </button>
                        <button class="btn btn-sm btn-outline-success" id="btnImportPurchasing" onclick="openExcelImport('purchasing')">
                            <i class="bi bi-file-earmark-excel me-1"></i> Import Excel
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddPurchase" onclick="openPurchaseModal()">
                            <i class="bi bi-plus-lg me-1"></i> Request Baru
                        </button>
                    </div>'''

assert purchasing_target in content, "purchasing_target not found!"
content = content.replace(purchasing_target, purchasing_replacement, 1)

# 5. Page Logistic: Add btnExportLogistic & btnImportLogistic
logistic_target = '''                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('management')">
                            <i class="bi bi-arrow-left me-1"></i> Menu
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddLogistic" onclick="openTaskModal()">
                            <i class="bi bi-plus-lg me-1"></i> Tambah Task
                        </button>
                    </div>'''

logistic_replacement = '''                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('management')">
                            <i class="bi bi-arrow-left me-1"></i> Menu
                        </button>
                        <button class="btn btn-sm btn-success" id="btnExportLogistic" onclick="exportModuleExcel('logistic')">
                            <i class="bi bi-file-earmark-arrow-down me-1"></i> Export Excel
                        </button>
                        <button class="btn btn-sm btn-outline-success" id="btnImportLogistic" onclick="openExcelImport('logistic')">
                            <i class="bi bi-file-earmark-excel me-1"></i> Import Excel
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddLogistic" onclick="openTaskModal()">
                            <i class="bi bi-plus-lg me-1"></i> Tambah Task
                        </button>
                    </div>'''

assert logistic_target in content, "logistic_target not found!"
content = content.replace(logistic_target, logistic_replacement, 1)

# 6. Page Konsumsi: Add btnExportKonsumsi & btnImportKonsumsi
konsumsi_target = '''                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('management')">
                            <i class="bi bi-arrow-left me-1"></i> Menu
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddKonsumsi" onclick="openConsumptionModal()">
                            <i class="bi bi-plus-lg me-1"></i> Tambah Jadwal Makan
                        </button>
                    </div>'''

konsumsi_replacement = '''                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('management')">
                            <i class="bi bi-arrow-left me-1"></i> Menu
                        </button>
                        <button class="btn btn-sm btn-success" id="btnExportKonsumsi" onclick="exportModuleExcel('konsumsi')">
                            <i class="bi bi-file-earmark-arrow-down me-1"></i> Export Excel
                        </button>
                        <button class="btn btn-sm btn-outline-success" id="btnImportKonsumsi" onclick="openExcelImport('konsumsi')">
                            <i class="bi bi-file-earmark-excel me-1"></i> Import Excel
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddKonsumsi" onclick="openConsumptionModal()">
                            <i class="bi bi-plus-lg me-1"></i> Tambah Jadwal Makan
                        </button>
                    </div>'''

assert konsumsi_target in content, "konsumsi_target not found!"
content = content.replace(konsumsi_target, konsumsi_replacement, 1)

# 7. Page Public Area: Add btnExportPublicArea & btnImportPublicArea
public_target = '''                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('management')">
                            <i class="bi bi-arrow-left me-1"></i> Menu
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddAnnouncement" onclick="openAnnouncementModal()">
                            <i class="bi bi-plus-lg me-1"></i> Buat Pengumuman
                        </button>
                    </div>'''

public_replacement = '''                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('management')">
                            <i class="bi bi-arrow-left me-1"></i> Menu
                        </button>
                        <button class="btn btn-sm btn-success" id="btnExportPublicArea" onclick="exportModuleExcel('public_area')">
                            <i class="bi bi-file-earmark-arrow-down me-1"></i> Export Excel
                        </button>
                        <button class="btn btn-sm btn-outline-success" id="btnImportPublicArea" onclick="openExcelImport('public_area')">
                            <i class="bi bi-file-earmark-excel me-1"></i> Import Excel
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddAnnouncement" onclick="openAnnouncementModal()">
                            <i class="bi bi-plus-lg me-1"></i> Buat Pengumuman
                        </button>
                    </div>'''

assert public_target in content, "public_target not found!"
content = content.replace(public_target, public_replacement, 1)

# 8. Page Participants: Add btnExportParticipants & btnImportParticipants
participants_target = '''                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('home')">
                            <i class="bi bi-arrow-left me-1"></i> Kembali
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddParticipant" onclick="openParticipantModal()">
                            <i class="bi bi-plus-lg me-1"></i> Tambah Peserta
                        </button>
                    </div>'''

participants_replacement = '''                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="showPage('home')">
                            <i class="bi bi-arrow-left me-1"></i> Kembali
                        </button>
                        <button class="btn btn-sm btn-success" id="btnExportParticipants" onclick="exportModuleExcel('participants')">
                            <i class="bi bi-file-earmark-arrow-down me-1"></i> Export Excel
                        </button>
                        <button class="btn btn-sm btn-outline-success" id="btnImportParticipants" onclick="openExcelImport('participants')">
                            <i class="bi bi-file-earmark-excel me-1"></i> Import Excel
                        </button>
                        <button class="btn btn-sm btn-primary" id="btnAddParticipant" onclick="openParticipantModal()">
                            <i class="bi bi-plus-lg me-1"></i> Tambah Peserta
                        </button>
                    </div>'''

assert participants_target in content, "participants_target not found!"
content = content.replace(participants_target, participants_replacement, 1)

# 9. Page Settings: Add Master Export Card after settings form
settings_target = '''                        <button type="submit" class="btn btn-primary px-4" id="btnSaveSettings">
                            <i class="bi bi-save me-1"></i> Simpan Pengaturan
                        </button>
                    </form>'''

settings_replacement = '''                        <button type="submit" class="btn btn-primary px-4" id="btnSaveSettings">
                            <i class="bi bi-save me-1"></i> Simpan Pengaturan
                        </button>
                    </form>

                    <!-- MASTER EXPORT BACKUP CARD -->
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
                    </div>'''

assert settings_target in content, "settings_target not found!"
content = content.replace(settings_target, settings_replacement, 1)

# 10. Universal Import Modal
modal_pattern = re.compile(r'<!-- MODAL: IMPORT RUNDOWN EXCEL -->.*?</div>\s*</div>\s*</div>\s*</div>', re.DOTALL)
m = modal_pattern.search(content)
assert m, "modalImportRundown not found!"

universal_modal_html = '''<!-- MODAL: UNIVERSAL EXCEL IMPORT (ALL MODULES) -->
<div class="modal fade" id="modalUniversalImportExcel" data-alias="modalImportRundown" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content border-0 shadow">
            <div class="modal-header bg-light border-bottom">
                <div>
                    <h5 class="modal-title fw-bold text-success mb-0" id="universalImportTitle">
                        <i class="bi bi-file-earmark-excel me-2"></i>Import Data dari Excel
                    </h5>
                    <small class="text-muted" id="universalImportSubtitle">Unggah berkas .xlsx, .xls, atau .csv untuk memperbarui data kegiatan</small>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-3 p-md-4">
                <!-- Panduan & Download Template -->
                <div class="card border border-success border-opacity-25 bg-success bg-opacity-10 p-3 mb-3">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                        <div>
                            <div class="fw-bold small text-success" id="universalImportGuideTitle">
                                <i class="bi bi-info-circle-fill me-1"></i> Format Kolom Excel yang Didukung:
                            </div>
                            <div class="small text-secondary mt-1" id="universalImportGuideColumns">
                                Memuat kolom...
                            </div>
                        </div>
                        <button type="button" class="btn btn-sm btn-success text-nowrap" id="btnDownloadTemplate" onclick="downloadCurrentModuleTemplate()">
                            <i class="bi bi-download me-1"></i> Unduh Template Excel
                        </button>
                    </div>
                </div>

                <!-- Input File -->
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Pilih Berkas Excel (.xlsx, .xls, .csv):</label>
                    <input type="file" id="universalExcelInput" class="form-control" accept=".xlsx, .xls, .csv" onchange="handleUniversalExcelUpload(event)">
                </div>

                <!-- Pratinjau & Edit Sebelum Simpan -->
                <div id="universalImportPreviewSection" class="d-none mt-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <h6 class="fw-bold mb-0">
                                <i class="bi bi-pencil-square text-primary me-1"></i> Pratinjau & Edit Data Sebelum Disimpan
                            </h6>
                            <small class="text-muted" id="universalImportRowCountLabel">0 baris terdeteksi</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="addManualUniversalImportRow()">
                            <i class="bi bi-plus-lg me-1"></i> Tambah Baris
                        </button>
                    </div>

                    <div class="table-responsive border rounded" style="max-height: 380px; overflow-y: auto;">
                        <table class="table table-sm table-hover align-middle mb-0" style="font-size: 13px;" id="universalImportTable">
                            <thead class="table-light sticky-top" id="universalImportTableHead">
                            </thead>
                            <tbody id="universalImportTableBody">
                            </tbody>
                        </table>
                    </div>

                    <!-- Pilihan Mode Simpan -->
                    <div class="mt-3 p-3 bg-light rounded border">
                        <label class="form-label small fw-semibold mb-2">Metode Penyimpanan:</label>
                        <div class="d-flex flex-column flex-sm-row gap-3">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="universalImportMode" id="universalModeReplace" value="replace" checked>
                                <label class="form-check-label small" for="universalModeReplace" id="universalModeReplaceLabel">
                                    <strong>Gantikan Seluruh Data</strong> (Data lama diganti dengan data baru dari file Excel ini)
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="universalImportMode" id="universalModeAppend" value="append">
                                <label class="form-check-label small" for="universalModeAppend" id="universalModeAppendLabel">
                                    <strong>Tambahkan</strong> (Gabungkan ke data yang sudah ada di sistem)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="universalImportAlertMsg" class="mt-3"></div>
            </div>
            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Batal</button>
                <button type="button" class="btn btn-success btn-sm px-3" id="btnSaveUniversalImport" onclick="saveUniversalImport()" disabled>
                    <i class="bi bi-check2-circle me-1"></i> Simpan Data ke Sistem
                </button>
            </div>
        </div>
    </div>
</div>'''

content = content[:m.start()] + universal_modal_html + content[m.end():]

# 11. Add Toast Container before </body>
toast_html = '''<!-- TOAST NOTIFICATION CONTAINER -->
<div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1100;">
    <div id="appToast" class="toast align-items-center text-white bg-success border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
            <div class="toast-body" id="toastMessage">
                Berhasil!
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    </div>
</div>
'''
content = content.replace('</body>', toast_html + '\n</body>', 1)

# 12. updateViewOnlyNotices update
viewonly_target = '''function updateViewOnlyNotices() {
    const rundownAlert = document.getElementById('rundownViewOnlyAlert');
    const btnAddRundown = document.getElementById('btnAddRundown');
    const btnImportRundown = document.getElementById('btnImportRundown');
    if (canManage('rundown')) {
        rundownAlert?.classList.add('d-none');
        btnAddRundown?.classList.remove('d-none');
        btnImportRundown?.classList.remove('d-none');
    } else {
        rundownAlert?.classList.remove('d-none');
        btnAddRundown?.classList.add('d-none');
        btnImportRundown?.classList.add('d-none');
    }

    const financeAlert = document.getElementById('financeViewOnlyAlert');
    const btnAddTrans = document.getElementById('btnAddTransaction');
    if (canManage('finance')) {
        financeAlert?.classList.add('d-none');
        btnAddTrans?.classList.remove('d-none');
    } else {
        financeAlert?.classList.remove('d-none');
        btnAddTrans?.classList.add('d-none');
    }

    const purchAlert = document.getElementById('purchasingViewOnlyAlert');
    const btnAddPurch = document.getElementById('btnAddPurchase');
    if (canManage('purchasing')) {
        purchAlert?.classList.add('d-none');
        btnAddPurch?.classList.remove('d-none');
    } else {
        purchAlert?.classList.remove('d-none');
        btnAddPurch?.classList.add('d-none');
    }

    const logAlert = document.getElementById('logisticViewOnlyAlert');
    const btnAddLog = document.getElementById('btnAddLogistic');
    if (canManage('logistic')) {
        logAlert?.classList.add('d-none');
        btnAddLog?.classList.remove('d-none');
    } else {
        logAlert?.classList.remove('d-none');
        btnAddLog?.classList.add('d-none');
    }

    const konsAlert = document.getElementById('konsumsiViewOnlyAlert');
    const btnAddKons = document.getElementById('btnAddKonsumsi');
    if (canManage('konsumsi')) {
        konsAlert?.classList.add('d-none');
        btnAddKons?.classList.remove('d-none');
    } else {
        konsAlert?.classList.remove('d-none');
        btnAddKons?.classList.add('d-none');
    }

    const pubAlert = document.getElementById('publicAreaViewOnlyAlert');
    const btnAddPub = document.getElementById('btnAddAnnouncement');
    if (canManage('public_area')) {
        pubAlert?.classList.add('d-none');
        btnAddPub?.classList.remove('d-none');
    } else {
        pubAlert?.classList.remove('d-none');
        btnAddPub?.classList.add('d-none');
    }
}'''

viewonly_replacement = '''function updateViewOnlyNotices() {
    // 1. Rundown
    const rundownAlert = document.getElementById('rundownViewOnlyAlert');
    const btnAddRundown = document.getElementById('btnAddRundown');
    const btnImportRundown = document.getElementById('btnImportRundown');
    if (canManage('rundown')) {
        rundownAlert?.classList.add('d-none');
        btnAddRundown?.classList.remove('d-none');
        btnImportRundown?.classList.remove('d-none');
    } else {
        rundownAlert?.classList.remove('d-none');
        btnAddRundown?.classList.add('d-none');
        btnImportRundown?.classList.add('d-none');
    }

    // 2. Keuangan
    const financeAlert = document.getElementById('financeViewOnlyAlert');
    const btnAddTrans = document.getElementById('btnAddTransaction');
    const btnImportFinance = document.getElementById('btnImportFinance');
    if (canManage('finance')) {
        financeAlert?.classList.add('d-none');
        btnAddTrans?.classList.remove('d-none');
        btnImportFinance?.classList.remove('d-none');
    } else {
        financeAlert?.classList.remove('d-none');
        btnAddTrans?.classList.add('d-none');
        btnImportFinance?.classList.add('d-none');
    }

    // 3. Purchasing
    const purchAlert = document.getElementById('purchasingViewOnlyAlert');
    const btnAddPurch = document.getElementById('btnAddPurchase');
    const btnImportPurch = document.getElementById('btnImportPurchasing');
    if (canManage('purchasing')) {
        purchAlert?.classList.add('d-none');
        btnAddPurch?.classList.remove('d-none');
        btnImportPurch?.classList.remove('d-none');
    } else {
        purchAlert?.classList.remove('d-none');
        btnAddPurch?.classList.add('d-none');
        btnImportPurch?.classList.add('d-none');
    }

    // 4. Logistic
    const logAlert = document.getElementById('logisticViewOnlyAlert');
    const btnAddLog = document.getElementById('btnAddLogistic');
    const btnImportLog = document.getElementById('btnImportLogistic');
    if (canManage('logistic')) {
        logAlert?.classList.add('d-none');
        btnAddLog?.classList.remove('d-none');
        btnImportLog?.classList.remove('d-none');
    } else {
        logAlert?.classList.remove('d-none');
        btnAddLog?.classList.add('d-none');
        btnImportLog?.classList.add('d-none');
    }

    // 5. Konsumsi
    const konsAlert = document.getElementById('konsumsiViewOnlyAlert');
    const btnAddKons = document.getElementById('btnAddKonsumsi');
    const btnImportKons = document.getElementById('btnImportKonsumsi');
    if (canManage('konsumsi')) {
        konsAlert?.classList.add('d-none');
        btnAddKons?.classList.remove('d-none');
        btnImportKons?.classList.remove('d-none');
    } else {
        konsAlert?.classList.remove('d-none');
        btnAddKons?.classList.add('d-none');
        btnImportKons?.classList.add('d-none');
    }

    // 6. Public Area
    const pubAlert = document.getElementById('publicAreaViewOnlyAlert');
    const btnAddPub = document.getElementById('btnAddAnnouncement');
    const btnImportPub = document.getElementById('btnImportPublicArea');
    if (canManage('public_area')) {
        pubAlert?.classList.add('d-none');
        btnAddPub?.classList.remove('d-none');
        btnImportPub?.classList.remove('d-none');
    } else {
        pubAlert?.classList.remove('d-none');
        btnAddPub?.classList.add('d-none');
        btnImportPub?.classList.add('d-none');
    }

    // 7. Peserta
    const btnAddPart = document.getElementById('btnAddParticipant');
    const btnImportPart = document.getElementById('btnImportParticipants');
    if (canManage('participants')) {
        btnAddPart?.classList.remove('d-none');
        btnImportPart?.classList.remove('d-none');
    } else {
        btnAddPart?.classList.add('d-none');
        btnImportPart?.classList.add('d-none');
    }
}'''

assert viewonly_target in content, "viewonly_target not found!"
content = content.replace(viewonly_target, viewonly_replacement, 1)

# 13. Replace old Rundown Excel Engine in JS with Universal Engine
js_pattern = re.compile(r'/\* =====================================================\s+RUNDOWN EXCEL IMPORT & EXPORT ENGINE\s+===================================================== \*/.*?/\* =====================================================\s+FINANCE MODULE', re.DOTALL)
m_js = js_pattern.search(content)
assert m_js, "Rundown JS pattern not found!"

content = content[:m_js.start()] + engine_js + '\n\n/* =====================================================\n   FINANCE MODULE' + content[m_js.end():]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS: index.html has been updated with Universal Excel Engine!')
