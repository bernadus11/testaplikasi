const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const routes = require("./routes/index");
const app = express();
const ExcelJS = require('exceljs');
const port = 8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "views");

const db = mysql.createConnection({
    host: "localhost",
    database: "siswa",
    user: "root",
    password: "",
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to database");
});
// middleware img
app.use(express.static('public'));

// Make the database connection available in the request object
app.use((req, res, next) => {
    req.db = db;
    next();
});
app.get('/download-excel', async (req, res) => {
    const kelas = req.query.kelas;

    const allowedKelas = ['1', '2', '3', '4', '5', '6'];
    if (!allowedKelas.includes(kelas)) {
        return res.status(400).send('Kelas tidak valid.');
    }

    const sql = `SELECT id AS noAbsen, nama, kelas, DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal, keterangan FROM user${kelas}`;
    db.query(sql, async (err, result) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Database query error");
        }

        const absenData = JSON.parse(JSON.stringify(result));

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Absensi Kelas ${kelas}`);

        worksheet.columns = [
            { header: 'No Absen', key: 'noAbsen', width: 15 },
            { header: 'Nama', key: 'nama', width: 30 },
            { header: 'Kelas', key: 'kelas', width: 10 },
            { header: 'Tanggal', key: 'tanggal', width: 15 },
            { header: 'Keterangan', key: 'keterangan', width: 20 }
        ];

        absenData.forEach((data) => {
            worksheet.addRow({
                ...data,
                tanggal: data.tanggal
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=absensi_kelas_${kelas}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    });
});
// Use routes
app.use('/', routes);
app.listen(port, () => {
    console.log("Server ready on port " + port);
});