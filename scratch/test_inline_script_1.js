
let currentSelectedReportOutingId = 'current';

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
        const sName = m.name.replace(/[\/\\?*:\[\]]/g, '').slice(0, 31);
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

    const ok = confirm(`Apakah Anda yakin ingin memulihkan outing "${found.title}" menjadi outing aktif di sistem?\n\nData aktif saat ini akan digantikan dengan data dari arsip ini.`);
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

    const ok = confirm(`PERINGATAN PEMBERSIHAN DATABASE SUPABASE:\n\n` +
        `Data kegiatan lama yang dicentang akan DIHAPUS dari tabel Supabase dan LocalStorage agar kuota database tetap hemat.\n` +
        `Data outing saat ini akan otomatis dicadangkan ke Riwayat Arsip terlebih dahulu.\n\n` +
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

        alert(`SUKSES! Data kegiatan lama berhasil dibersihkan dari database Supabase dan LocalStorage.\n\n` +
            `Sistem kini telah diperbarui untuk Outing Baru: "${newName}".\n` +
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
