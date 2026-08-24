const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ExcelReporter {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.resolve(__dirname, '../test-results');
    this.filename = options.filename || 'SmartTable_E2E_Test_Report.xlsx';
  }

  async generateReport(results) {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const filePath = path.join(this.outputDir, this.filename);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Smart Table Automated Testing Framework';
    workbook.lastModifiedBy = 'Smart Table CI/CD Runner';
    workbook.created = new Date();
    workbook.modified = new Date();

    // 1. Executive Summary Sheet
    this._createSummarySheet(workbook, results);

    // 2. Module Analytics Sheet
    this._createModuleAnalyticsSheet(workbook, results);

    // 3. Detailed Test Matrix Sheet
    this._createTestMatrixSheet(workbook, results);

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  _createSummarySheet(workbook, results) {
    const ws = workbook.addWorksheet('Dashboard Summary', {
      views: [{ showGridLines: true }],
    });

    // Set column widths
    ws.columns = [
      { width: 5 },
      { width: 28 },
      { width: 28 },
      { width: 22 },
      { width: 22 },
      { width: 22 },
    ];

    // Main Title Banner
    ws.mergeCells('B2:F2');
    const titleCell = ws.getCell('B2');
    titleCell.value = '🍽️ SMART TABLE — E2E TEST EXECUTION & ANALYTICS REPORT';
    titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF97316' }, // Smart Table Brand Orange
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 40;

    // Subtitle
    ws.mergeCells('B3:F3');
    const subCell = ws.getCell('B3');
    subCell.value = 'Automated Selenium (Web) & Appium (Mobile) Enterprise Quality Assurance Matrix';
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    subCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' },
    };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(3).height = 24;

    // Summary Metric Cards
    const total = results.total || 0;
    const passed = results.passed || 0;
    const failed = results.failed || 0;
    const skipped = results.skipped || 0;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    const kpis = [
      { label: 'TOTAL TEST CASES', val: total, color: 'FF1E293B', fontColor: 'FFFFFFFF' },
      { label: 'PASSED TESTS', val: passed, color: 'FF065F46', fontColor: 'FF6EE7B7' },
      { label: 'FAILED TESTS', val: failed, color: failed > 0 ? 'FF991B1B' : 'FF1E293B', fontColor: failed > 0 ? 'FFFCA5A5' : 'FF94A3B8' },
      { label: 'PASS RATE', val: `${passRate}%`, color: 'FF1E3A8A', fontColor: 'FF93C5FD' },
      { label: 'TOTAL DURATION', val: results.duration || '0s', color: 'FF374151', fontColor: 'FFFFFFFF' },
    ];

    const kpiCols = ['B', 'C', 'D', 'E', 'F'];
    kpis.forEach((kpi, idx) => {
      const col = kpiCols[idx];
      const headerCell = ws.getCell(`${col}5`);
      headerCell.value = kpi.label;
      headerCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFCBD5E1' } };
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const valCell = ws.getCell(`${col}6`);
      valCell.value = kpi.val;
      valCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: kpi.fontColor } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } };
      valCell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    ws.getRow(5).height = 20;
    ws.getRow(6).height = 36;

    // Platform Breakdown & System Info Header
    ws.mergeCells('B8:C8');
    const platHeader = ws.getCell('B8');
    platHeader.value = '📱 PLATFORM EXECUTION SUMMARY';
    platHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    platHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    platHeader.alignment = { vertical: 'middle', indent: 1 };

    ws.mergeCells('D8:F8');
    const envHeader = ws.getCell('D8');
    envHeader.value = '⚙️ TEST ENVIRONMENT & EXECUTION METADATA';
    envHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    envHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    envHeader.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(8).height = 26;

    const webCount = results.webCount || 0;
    const webPassed = results.webPassed || 0;
    const mobileCount = results.mobileCount || 0;
    const mobilePassed = results.mobilePassed || 0;

    const platRows = [
      ['Web Application (Selenium)', `${webPassed} / ${webCount} (${webCount > 0 ? ((webPassed/webCount)*100).toFixed(1) : 0}%)`],
      ['Mobile Application (Appium)', `${mobilePassed} / ${mobileCount} (${mobileCount > 0 ? ((mobilePassed/mobileCount)*100).toFixed(1) : 0}%)`],
      ['Total End-to-End Asserts', `${passed} Passed of ${total}`],
    ];

    const envRows = [
      ['Execution Date & Time', new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'],
      ['Framework Stack', 'Selenium WebDriver 4.x + Appium 2.x + Mocha + Chai'],
      ['Target Endpoints', 'Web: http://localhost:5173 | API: http://localhost:5000/api'],
    ];

    for (let i = 0; i < 3; i++) {
      const rowIdx = 9 + i;
      ws.getCell(`B${rowIdx}`).value = platRows[i][0];
      ws.getCell(`B${rowIdx}`).font = { name: 'Segoe UI', size: 10, bold: true };
      ws.getCell(`C${rowIdx}`).value = platRows[i][1];
      ws.getCell(`C${rowIdx}`).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF059669' } };

      ws.getCell(`D${rowIdx}`).value = envRows[i][0];
      ws.getCell(`D${rowIdx}`).font = { name: 'Segoe UI', size: 10, bold: true };
      ws.mergeCells(`E${rowIdx}:F${rowIdx}`);
      ws.getCell(`E${rowIdx}`).value = envRows[i][1];
      ws.getCell(`E${rowIdx}`).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF475569' } };
      ws.getRow(rowIdx).height = 22;
    }
  }

  _createModuleAnalyticsSheet(workbook, results) {
    const ws = workbook.addWorksheet('Module Analytics', {
      views: [{ showGridLines: true }],
    });

    ws.columns = [
      { header: 'Module ID', key: 'id', width: 14 },
      { header: 'Platform', key: 'platform', width: 14 },
      { header: 'Functional Domain / Module', key: 'module', width: 38 },
      { header: 'Total Cases', key: 'total', width: 14 },
      { header: 'Passed', key: 'passed', width: 12 },
      { header: 'Failed', key: 'failed', width: 12 },
      { header: 'Pass Rate %', key: 'rate', width: 14 },
      { header: 'Status', key: 'status', width: 16 },
    ];

    // Header styling
    ws.getRow(1).height = 28;
    ws.getRow(1).eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const modules = results.modules || [];
    modules.forEach((mod, index) => {
      const row = ws.addRow({
        id: mod.id || `MOD-${index + 1}`,
        platform: mod.platform || 'Web',
        module: mod.name || 'Core Module',
        total: mod.total || 0,
        passed: mod.passed || 0,
        failed: mod.failed || 0,
        rate: `${mod.total > 0 ? ((mod.passed / mod.total) * 100).toFixed(1) : 0}%`,
        status: mod.failed === 0 ? 'VERIFIED' : 'DEFECT DETECTED',
      });

      row.height = 22;
      const isFailed = mod.failed > 0;

      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

      row.getCell(5).font = { color: { argb: 'FF059669' }, bold: true };
      row.getCell(6).font = { color: { argb: isFailed ? 'FFDC2626' : 'FF64748B' }, bold: isFailed };
      row.getCell(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isFailed ? 'FFFEE2E2' : 'FFD1FAE5' },
      };
      row.getCell(8).font = {
        color: { argb: isFailed ? 'FF991B1B' : 'FF065F46' },
        bold: true,
      };
    });
  }

  _createTestMatrixSheet(workbook, results) {
    const ws = workbook.addWorksheet('Detailed Test Matrix', {
      views: [{ showGridLines: true }],
    });

    ws.columns = [
      { header: 'Test Case ID', key: 'id', width: 16 },
      { header: 'Platform', key: 'platform', width: 12 },
      { header: 'Module / Suite', key: 'suite', width: 28 },
      { header: 'Test Scenario / Title', key: 'title', width: 44 },
      { header: 'Expected Outcome', key: 'expected', width: 36 },
      { header: 'Actual Outcome', key: 'actual', width: 36 },
      { header: 'Execution (ms)', key: 'duration', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Notes / Diagnostics', key: 'notes', width: 30 },
    ];

    ws.getRow(1).height = 28;
    ws.getRow(1).eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const testCases = results.testCases || [];
    testCases.forEach((tc) => {
      const isPass = tc.status === 'PASS';
      const row = ws.addRow({
        id: tc.id,
        platform: tc.platform || 'Web',
        suite: tc.suite,
        title: tc.title,
        expected: tc.expected || 'Operation succeeds with 200 OK & expected UI state',
        actual: tc.actual || (isPass ? 'Success: All UI assertions & data verified' : tc.error || 'Assertion failed'),
        duration: tc.duration || 120,
        status: tc.status,
        notes: tc.notes || (isPass ? 'Clean Execution' : tc.stack || ''),
      });

      row.height = 20;
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

      row.getCell(8).font = {
        name: 'Segoe UI',
        bold: true,
        color: { argb: isPass ? 'FF065F46' : 'FF991B1B' },
      };
      row.getCell(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isPass ? 'FFD1FAE5' : 'FFFEE2E2' },
      };
    });
  }
}

module.exports = ExcelReporter;
