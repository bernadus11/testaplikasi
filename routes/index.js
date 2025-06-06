const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    res.render("home", { title: "Beranda" });
});
// Route for home page
router.get('/kelas1', (req, res) => {
    const sql = "SELECT id, nama, kelas, DATE(created_at) AS created_at, keterangan FROM user1";
    
    req.db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).send("Database query error");
        }

        const users = JSON.parse(JSON.stringify(result));
        res.render("kelas1", { users: users, title: "Data Siswa kelas 1" });
    });
});

// Routes for each class
const classes = [1, 2, 3, 4, 5, 6];
classes.forEach((kelas) => {
    router.get(`/kelas${kelas}`, (req, res) => {
        const sql = `SELECT id, nama, kelas, DATE(created_at) AS created_at, keterangan FROM user${kelas}`;
        
        req.db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).send("Database query error");
            }

            const users = JSON.parse(JSON.stringify(result));
            res.render(`kelas${kelas}`, { users: users, title: `Data Siswa kelas ${kelas}` });
        });
    });
});

// Routes for adding students
classes.forEach((kelas) => {
    router.post(`/tambah${kelas}`, (req, res) => {
        const insertSql = `INSERT INTO user${kelas} (id, nama, kelas) VALUES (?, ?, ?)`;
        req.db.query(insertSql, [req.body.id, req.body.nama, req.body.kelas], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    // Kirim status 400 jika terjadi duplikasi
                    return res.status(400).send('Maaf no absen sudah terisi'); // Mengirim pesan sebagai teks
                }
                throw err; // Tangani error lain
            }
            res.redirect(`/kelas${kelas}`);
        });
    });
});



// Route for deleting a student
classes.forEach((kelas) => {
    router.post(`/delete${kelas}/:id`, (req, res) => {
        const id = req.params.id;
        const sql = `DELETE FROM user${kelas} WHERE id = ?`;
        
        req.db.query(sql, [id], (err, result) => {
            if (err) {
                return res.status(500).send("Database query error");
            } else {
                res.redirect(`/kelas${kelas}`);
            }
        });
    });
});
// Route for editing a student
classes.forEach((kelas) => {
router.get(`/edit${kelas}/:id`, (req, res) => {
    let sql = `SELECT * FROM user${kelas} WHERE id = ?`;
    req.db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.render("edit", { user1: result[0] });
    });
});
});

// Route for updating a student
router.post(`/update/data/:id`, (req, res) => {
    let { nama, kelas, created_at, keterangan } = req.body;
    // Query to update the appropriate class table
    let sql = `UPDATE user${kelas} SET nama = ?, kelas = ?, created_at=?, keterangan=? WHERE id = ?`;
    req.db.query(sql, [nama, kelas, created_at, keterangan, req.params.id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database update failed."); // Handle error response
        }
        res.redirect(`/kelas${kelas}`); // Redirect to the appropriate class page
    });
});
router.get('/laporan/:kelas', (req, res) => {
    const kelas = req.params.kelas;

    // Pastikan hanya menerima kelas 1-6 (bisa divalidasi juga)
    const allowedKelas = ['1', '2', '3', '4', '5', '6'];
    if (!allowedKelas.includes(kelas)) {
        return res.status(400).send('Kelas tidak valid.');
    }

    // Nama tabel berdasarkan kelas, misal: user1, user2, dst
    const tableName = `user${kelas}`;
    const sql = `SELECT id, nama, kelas, DATE(created_at) AS created_at, keterangan FROM ${tableName} WHERE kelas = ?`;
    
    req.db.query(sql, [kelas], (err, result) => {
        if (err) {
            return res.status(500).send('Database query error');
        }

        const laporan = JSON.parse(JSON.stringify(result));
        res.render('laporan', {
            laporan,
            title: `Laporan Kelas ${kelas}`,
            kelas
        });
    });
});


module.exports = router;