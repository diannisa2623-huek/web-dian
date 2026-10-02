/**
 * KotaKu — Backend Survei Kota Favorit (Google Apps Script)
 * Tempel di: Spreadsheet > Ekstensi > Apps Script
 */
const SHEET_NAME = "Responses";
// Harus sama persis dengan daftar kota di app.js
const CITIES = ["Yogyakarta", "Bali", "Bandung", "Jakarta", "Surabaya", "Malang", "Semarang", "Makassar"];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["Timestamp", "Nama", "Kota", "Alasan"]);
    sh.setFrozenRows(1);
    sh.getRange("A1:D1").setFontWeight("bold").setBackground("#f7e6e8");
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Mencegah formula injection di spreadsheet
function clean_(v, max) {
  let s = String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function doGet() {
  try {
    const sh = getSheet_();
    const last = sh.getLastRow();
    const counts = {};
    CITIES.forEach(function (c) { counts[c] = 0; });
    let recent = [];
    if (last > 1) {
      const rows = sh.getRange(2, 1, last - 1, 4).getValues();
      rows.forEach(function (r) { if (counts.hasOwnProperty(r[2])) counts[r[2]]++; });
      recent = rows.slice(-5).reverse().map(function (r) {
        return { name: String(r[1]), city: String(r[2]), reason: String(r[3] || "") };
      });
    }
    return json_({ ok: true, counts: counts, recent: recent });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const d = JSON.parse(e.postData.contents);
    const name = clean_(d.name, 50);
    const city = String(d.city || "");
    const reason = clean_(d.reason, 200);
    if (name.length < 2) throw new Error("Nama tidak valid");
    if (CITIES.indexOf(city) === -1) throw new Error("Kota tidak valid");
    getSheet_().appendRow([new Date(), name, city, reason]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
