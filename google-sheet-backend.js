/**
 * google-sheet-backend.js  —  Google Apps Script
 *
 * HOW TO DEPLOY:
 *  1. Go to script.google.com → New Project
 *  2. Paste this entire file
 *  3. Replace YOUR_SHEET_ID_HERE with your Google Sheet ID
 *     (found in the Sheet URL: docs.google.com/spreadsheets/d/SHEET_ID/edit)
 *  4. Replace ADMIN_EMAIL_HERE with your email address
 *  5. Click Deploy → New Deployment → Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  6. Copy the Web App URL into script.js → SHEET_CONFIG.sheetScriptUrl
 *
 * TO TEST WITHOUT A BROWSER:
 *  Select the function "testDoPost" from the dropdown next to Run, then click Run.
 *  Check the Google Sheet for a new test row.
 *
 * WHY text/plain IN THE FETCH CALL:
 *  Google Apps Script cannot handle the CORS OPTIONS preflight that browsers
 *  send for 'application/json' POST requests. Sending as 'text/plain' skips
 *  the preflight entirely. We parse the body manually as JSON on this side.
 */

var SHEET_ID    = 'YOUR_SHEET_ID_HERE';
var SHEET_NAME  = 'Visitors';
var ADMIN_EMAIL = 'ADMIN_EMAIL_HERE';

/* ─── POST: Log a visit ─────────────────────────────────────────── */

function doPost(e) {
  try {
    // Guard: if called manually from the editor, e or e.postData won't exist.
    // In that case, redirect to the test function so the editor run is useful.
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'No POST data. Use testDoPost() to test from the editor.' });
    }

    // Body is sent as text/plain to avoid CORS preflight — parse it as JSON here
    var data = JSON.parse(e.postData.contents);

    // Honeypot check — reject bots that filled hidden field
    if (data.botcheck) {
      return jsonResponse({ success: false, error: 'Bot detected' });
    }

    var sheet = getOrCreateSheet();

    var rowData = [
      new Date().toISOString(),
      data.date      || new Date().toLocaleDateString(),
      data.time      || new Date().toLocaleTimeString(),
      data.name      || data.visitor_name    || '',
      data.email     || data.visitor_email   || '',
      data.purpose   || data.visitor_purpose || '',
      data.ip        || '',
      data.location  || '',
      data.isMobile  ? 'Mobile' : 'Desktop',
      data.screenResolution || '',
      extractBrowser(data.userAgent || ''),
      data.page      || '',
      data.referrer  || '',
      data.notify_me ? 'Yes' : 'No',
      data.fingerprint || '',
    ];

    sheet.appendRow(rowData);

    var total = sheet.getLastRow() - 1; // subtract header row

    // Send email notification to admin only if configured
    if (ADMIN_EMAIL && ADMIN_EMAIL !== 'ADMIN_EMAIL_HERE') {
      sendAdminEmail(data, total);
    }

    return jsonResponse({
      success: true,
      message: 'Visit logged',
      total:   total,
    });

  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ─── GET: Return visit counts ──────────────────────────────────── */

function doGet(e) {
  try {
    var sheet  = getOrCreateSheet();
    var total  = Math.max(0, sheet.getLastRow() - 1);
    var today  = new Date().toLocaleDateString();
    var data   = sheet.getDataRange().getValues();
    var todayCount = 0;

    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === today) todayCount++;
    }

    return jsonResponse({ total: total, today: todayCount });

  } catch (err) {
    Logger.log('doGet error: ' + err.toString());
    return jsonResponse({ total: 0, today: 0, error: err.toString() });
  }
}

/* ─── TEST FUNCTION (run this from the Apps Script editor) ─────── */
/*
 * HOW TO USE:
 *  1. In the Apps Script editor, click the function dropdown (next to Run)
 *  2. Select "testDoPost"
 *  3. Click Run
 *  4. Check your Google Sheet for a new row labelled "Test Visitor"
 *  5. Check your email for a test notification (if ADMIN_EMAIL is set)
 */

function testDoPost() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        timestamp:        new Date().toISOString(),
        date:             new Date().toLocaleDateString(),
        time:             new Date().toLocaleTimeString(),
        name:             'Test Visitor',
        email:            'test@example.com',
        purpose:          'Testing the sheet connection',
        ip:               '41.212.0.1',
        location:         'Nairobi, Kenya',
        isMobile:         false,
        screenResolution: '1920x1080',
        userAgent:        'Mozilla/5.0 (Test)',
        page:             'https://samuelmuli.com/',
        referrer:         'Direct',
        notify_me:        false,
        botcheck:         '',
      })
    }
  };

  var result = doPost(fakeEvent);
  Logger.log('testDoPost result: ' + result.getContent());
}

/* ─── HELPERS ───────────────────────────────────────────────────── */

function getOrCreateSheet() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Write header row
    sheet.appendRow([
      'Timestamp', 'Date', 'Time', 'Name', 'Email', 'Purpose',
      'IP', 'Location', 'Device', 'Resolution', 'Browser',
      'Page', 'Referrer', 'Notified', 'Fingerprint',
    ]);
    // Freeze and bold the header
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 15).setFontWeight('bold');
  }

  return sheet;
}

function extractBrowser(ua) {
  if (!ua) return 'Unknown';
  if (/Edg\//.test(ua))     return 'Edge';
  if (/OPR\//.test(ua))     return 'Opera';
  if (/Chrome\//.test(ua))  return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua))  return 'Safari';
  return 'Other';
}

function sendAdminEmail(data, total) {
  try {
    var subject = '🚀 New Visit — Samuel Muli Portfolio';
    var body = [
      'New website visit recorded.',
      '',
      'Time:       ' + (data.time     || new Date().toLocaleTimeString()),
      'Date:       ' + (data.date     || new Date().toLocaleDateString()),
      'Location:   ' + (data.location || 'Unknown'),
      'Device:     ' + (data.isMobile ? 'Mobile' : 'Desktop'),
      'Page:       ' + (data.page     || ''),
      'Referrer:   ' + (data.referrer || 'Direct'),
      '',
      data.name    ? 'Name:    ' + data.name    : '',
      data.email   ? 'Email:   ' + data.email   : '',
      data.purpose ? 'Purpose: ' + data.purpose : '',
      '',
      'Total visits so far: ' + total,
    ].filter(Boolean).join('\n');

    MailApp.sendEmail({ to: ADMIN_EMAIL, subject: subject, body: body });
  } catch (err) {
    Logger.log('Email error: ' + err.toString());
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}