document.addEventListener('DOMContentLoaded', () => {
    const archiveForm = document.getElementById('archiveForm');
    const archiveList = document.getElementById('archiveList');

    // Fungsi Memuat Data
    function loadArchives() {
        const archives = JSON.parse(localStorage.getItem('vaultData')) || [];
        archiveList.innerHTML = '';

        if (archives.length === 0) {
            archiveList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:50px;">Brankas arsip masih kosong.</td></tr>';
            return;
        }

        archives.forEach((item, index) => {
            const row = document.createElement('tr');
            row.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
            row.style.opacity = "0";

            row.innerHTML = `
                <td>
                    <div style="font-weight:600; color:#fff;">${item.name}</div>
                    <div style="font-size:0.75rem; color:#94a3b8;">${item.date}</div>
                    <div style="font-size:0.7rem; color:var(--accent); cursor:pointer; margin-top:5px;" onclick="viewFile(${index})">
                        <i class="fas fa-eye"></i> Pratinjau File
                    </div>
                </td>
                <td><span class="category-tag">${item.category}</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn-dl btn-txt" onclick="downloadReport(${index}, 'txt')">TXT</button>
                        <button class="btn-dl btn-doc" onclick="downloadReport(${index}, 'doc')">DOC</button>
                        <button class="btn-dl btn-xls" onclick="downloadReport(${index}, 'xls')">XLS</button>
                    </div>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn-dl btn-asli" onclick="downloadOriginal(${index})">
                            <i class="fas fa-download"></i> UNDUH ASLI
                        </button>
                        <button class="btn-delete" onclick="deleteArchive(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            archiveList.appendChild(row);
        });
    }

    // Konversi File ke Base64
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // Event Simpan Berkas
    archiveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('fileInput');
        
        if (fileInput.files[0].size > 2 * 1024 * 1024) {
            return alert("Maaf, file maksimal 2MB agar browser tidak berat.");
        }

        const fileBase64 = await toBase64(fileInput.files[0]);
        const archives = JSON.parse(localStorage.getItem('vaultData')) || [];
        
        const newEntry = {
            name: document.getElementById('fileName').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            fileData: fileBase64,
            fileName: fileInput.files[0].name
        };

        archives.unshift(newEntry);
        localStorage.setItem('vaultData', JSON.stringify(archives));
        
        const btn = document.getElementById('saveBtn');
        btn.innerHTML = 'Tersimpan Aman! <i class="fas fa-check"></i>';
        setTimeout(() => {
            btn.innerHTML = '<span>Amankan Berkas</span> <i class="fas fa-shield-check"></i>';
            archiveForm.reset();
            loadArchives();
        }, 1000);
    });

    // Pratinjau File
    window.viewFile = (index) => {
        const item = JSON.parse(localStorage.getItem('vaultData'))[index];
        const win = window.open();
        win.document.write(`<iframe src="${item.fileData}" frameborder="0" style="width:100%; height:100%;" allowfullscreen></iframe>`);
    };

    // Download File Asli
    window.downloadOriginal = (index) => {
        const item = JSON.parse(localStorage.getItem('vaultData'))[index];
        const a = document.createElement("a");
        a.href = item.fileData;
        a.download = item.fileName;
        a.click();
    };

    // Download Laporan (TXT, DOC, XLS)
    window.downloadReport = (index, format) => {
        const item = JSON.parse(localStorage.getItem('vaultData'))[index];
        let content = "", mime = "", ext = format;

        if (format === 'txt') {
            content = `ARSIP DIGITAL: ${item.name}\nKategori: ${item.category}\nTanggal: ${item.date}\nFile: ${item.fileName}`;
            mime = 'text/plain';
        } else if (format === 'doc') {
            content = `<html><body><h2>Detail Arsip</h2><p><b>Nama:</b> ${item.name}</p><p><b>Kategori:</b> ${item.category}</p><p><b>Tanggal:</b> ${item.date}</p></body></html>`;
            mime = 'application/msword';
        } else if (format === 'xls') {
            content = `Nama Berkas\tKategori\tTanggal\n${item.name}\t${item.category}\t${item.date}`;
            mime = 'application/vnd.ms-excel';
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan_${item.name}.${ext}`;
        a.click();
    };

    // Hapus Arsip
    window.deleteArchive = (index) => {
        if (confirm("Hapus berkas ini dari brankas digital?")) {
            const archives = JSON.parse(localStorage.getItem('vaultData'));
            archives.splice(index, 1);
            localStorage.setItem('vaultData', JSON.stringify(archives));
            loadArchives();
        }
    };

    loadArchives();
});
