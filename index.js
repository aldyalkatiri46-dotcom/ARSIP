// Pastikan variabel db dan storage dari HTML terbaca
// Kita menggunakan library Firestore dan Storage dari window yang sudah diset di HTML
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const archiveForm = document.getElementById('archiveForm');
    const archiveList = document.getElementById('archiveList');

    // 1. FUNGSI MEMUAT DATA DARI FIREBASE
    async function loadArchives() {
        archiveList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:50px;">Menghubungkan ke Brankas Cloud...</td></tr>';
        
        try {
            // Ambil data dari koleksi "archives" urutkan berdasarkan waktu terbaru
            const q = query(collection(window.db, "archives"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            archiveList.innerHTML = '';

            if (querySnapshot.empty) {
                archiveList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:50px;">Brankas Cloud kosong.</td></tr>';
                return;
            }

            let index = 0;
            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                const docId = docSnap.id;
                
                const row = document.createElement('tr');
                row.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
                row.style.opacity = "0";

                row.innerHTML = `
                    <td>
                        <div style="font-weight:600; color:#fff;">${item.name}</div>
                        <div style="font-size:0.75rem; color:#94a3b8;">${item.date}</div>
                        <div style="font-size:0.7rem; color:var(--accent); cursor:pointer; margin-top:5px;" onclick="window.open('${item.fileUrl}', '_blank')">
                            <i class="fas fa-eye"></i> Pratinjau File
                        </div>
                    </td>
                    <td><span class="category-tag">${item.category}</span></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn-dl btn-txt" onclick="downloadReport('${item.name}', '${item.category}', '${item.date}', 'txt')">TXT</button>
                            <button class="btn-dl btn-doc" onclick="downloadReport('${item.name}', '${item.category}', '${item.date}', 'doc')">DOC</button>
                        </div>
                    </td>
                    <td>
                        <div class="btn-group">
                            <a href="${item.fileUrl}" target="_blank" class="btn-dl btn-asli" style="text-decoration:none; display:flex; align-items:center;">
                                <i class="fas fa-download"></i>
                            </a>
                            <button class="btn-delete" onclick="deleteArchive('${docId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                archiveList.appendChild(row);
                index++;
            });
        } catch (error) {
            console.error("Error memuat data:", error);
            archiveList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">Gagal memuat data. Periksa aturan Firebase Anda.</td></tr>';
        }
    }

    // 2. EVENT SIMPAN BERKAS KE CLOUD
    archiveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        const btn = document.getElementById('saveBtn');

        if (!file) return alert("Pilih file terlebih dahulu!");

        try {
            // Tampilan Loading
            btn.disabled = true;
            btn.innerHTML = 'Mengunggah ke Cloud... <i class="fas fa-spinner fa-spin"></i>';

            // A. Upload File ke Firebase Storage
            const storagePath = `berkas/${Date.now()}_${file.name}`;
            const storageRef = ref(window.storage, storagePath);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // B. Simpan Metadata ke Firestore
            await addDoc(collection(window.db, "archives"), {
                name: document.getElementById('fileName').value,
                category: document.getElementById('category').value,
                date: document.getElementById('date').value,
                fileUrl: downloadURL,
                fileName: file.name,
                createdAt: new Date()
            });

            btn.innerHTML = 'Berhasil Disimpan! <i class="fas fa-check"></i>';
            setTimeout(() => {
                btn.innerHTML = '<span>Amankan Berkas</span> <i class="fas fa-shield-check"></i>';
                btn.disabled = false;
                archiveForm.reset();
                loadArchives();
            }, 1500);

        } catch (error) {
            console.error("Gagal Simpan:", error);
            alert("Gagal mengunggah. Pastikan 'Rules' di Firebase Console sudah diatur ke 'true'.");
            btn.disabled = false;
            btn.innerHTML = '<span>Coba Lagi</span>';
        }
    });

    // 3. DOWNLOAD LAPORAN (LOGIKA MANUAL)
    window.downloadReport = (name, category, date, format) => {
        let content = "", mime = "", ext = format;
        if (format === 'txt') {
            content = `ARSIP DIGITAL: ${name}\nKategori: ${category}\nTanggal: ${date}`;
            mime = 'text/plain';
        } else {
            content = `<html><body><h2>Detail Arsip</h2><p>Nama: ${name}</p><p>Kategori: ${category}</p></body></html>`;
            mime = 'application/msword';
        }
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan_${name}.${ext}`;
        a.click();
    };

    // 4. HAPUS DATA DARI FIREBASE
    window.deleteArchive = async (id) => {
        if (confirm("Hapus berkas ini secara permanen dari Cloud?")) {
            try {
                await deleteDoc(doc(window.db, "archives", id));
                loadArchives();
            } catch (error) {
                alert("Gagal menghapus data.");
            }
        }
    };

    loadArchives();
});
