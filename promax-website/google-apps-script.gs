/**
 * Pro Max Solution - saves every "Request a proposal" form submission as a new
 * row in this Google Sheet (which opens in / downloads as Excel), and emails a
 * notification. Paste this whole file into Extensions > Apps Script.
 */
var NOTIFY_EMAIL = "pinchuan95@promaxsolution.org";
var HEADERS = ["Date & time (Malaysia)", "Full name", "Email", "Country", "Country code", "Contact number (with code)", "Service interested in", "IP address"];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#efe6d3");
      sheet.setFrozenRows(1);
    }

    var when = Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "yyyy-MM-dd HH:mm:ss");
    // Store the phone as text so the leading + / 0 is kept.
    var row = sheet.getLastRow() + 1;
    sheet.getRange(row, 5, 1, 2).setNumberFormat("@");
    sheet.getRange(row, 8).setNumberFormat("@");
    sheet.getRange(row, 1, 1, 8).setValues([[
      when, clean(data.name), clean(data.email), clean(data.country),
      clean(data.countryCode), clean(data.phone), clean(data.service), clean(data.ip)
    ]]);

    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: clean(data.email),
        subject: "New proposal request from " + clean(data.name),
        body: "Name: " + clean(data.name) + "\nEmail: " + clean(data.email) +
              "\nCountry: " + clean(data.country) +
              "\nContact number: " + clean(data.phone) +
              "\nService: " + clean(data.service) +
              "\nIP address: " + clean(data.ip) + "\nTime: " + when
      });
    } catch (mailErr) { /* the row is already saved; ignore email problems */ }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Stops spreadsheet formula injection (a value starting with = + - @ would run as a formula).
function clean(v) {
  v = String(v == null ? "" : v).slice(0, 300);
  return /^[=@]/.test(v) ? "'" + v : v;
}
