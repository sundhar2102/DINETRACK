# 🍽️ Smart Table — Enterprise Automated Testing Documentation

Welcome to the **Smart Table Enterprise Automated Testing Framework**. This documentation outlines the test architecture, execution commands, report locations, and GitHub Actions CI/CD workflows for the Smart Table Web and Mobile platform.

---

## 📁 1. Project Structure

```text
SMARTTABLE/
│
├── frontend/                                   # Web Frontend (React + Vite + Tailwind)
├── backend/                                    # Backend API (Node.js + Express + SQLite/MySQL + Socket.IO)
│
├── tests/                                      # Enterprise Automated Test Suites
│   ├── selenium/                               # 🌐 Selenium Web E2E (220+ Tests)
│   │   ├── config/                             # Selenium driver configurations
│   │   ├── pages/                              # Page Object Model (POM) classes
│   │   ├── tests/                              # Partitioned feature suites
│   │   │   ├── authentication/                 # 30 tests (WEB-AUTH-001 to 030)
│   │   │   ├── restaurants/                    # 30 tests (WEB-REST-001 to 030)
│   │   │   ├── reservations/                   # 35 tests (WEB-BOOK-001 to 035)
│   │   │   ├── orders/                         # 35 tests (WEB-ORDER-001 to 035)
│   │   │   ├── location/                       # 20 tests (WEB-LOC-001 to 020)
│   │   │   ├── owner/                          # 30 tests (WEB-OWNER-001 to 030)
│   │   │   ├── realtime/                       # 10 tests (WEB-RT-001 to 010)
│   │   │   ├── navigation/                     # 10 tests (WEB-NAV-001 to 010)
│   │   │   ├── validation/                     # 10 tests (WEB-VAL-001 to 010)
│   │   │   └── regression/                     # 10 tests (WEB-REG-001 to 010)
│   │   ├── utils/                              # Screenshot and wait helpers
│   │   └── selenium.config.js                  # Chrome headless configuration
│   │
│   ├── appium/                                 # 📱 Appium Android Mobile E2E (110 Tests)
│   │   ├── config/                             # UiAutomator2 driver options
│   │   ├── screens/                            # Screen Object Model (SOM) classes
│   │   ├── tests/                              # Partitioned mobile suites
│   │   │   ├── authentication/                 # 20 tests (MOB-AUTH-001 to 020)
│   │   │   ├── restaurants/                    # 20 tests (MOB-REST-001 to 020)
│   │   │   ├── reservations/                   # 20 tests (MOB-BOOK-001 to 020)
│   │   │   ├── orders/                         # 20 tests (MOB-ORDER-001 to 020)
│   │   │   ├── owner/                          # 15 tests (MOB-OWNER-001 to 015)
│   │   │   ├── realtime/                       # 5 tests  (MOB-RT-001 to 005)
│   │   │   ├── navigation/                     # 5 tests  (MOB-NAV-001 to 005)
│   │   │   └── regression/                     # 5 tests  (MOB-REG-001 to 005)
│   │   ├── utils/                              # Mobile gestures & locators
│   │   └── appium.config.js                    # Android Appium 2 capabilities
│   │
│   ├── api/                                    # 🔌 API & DB Integration Tests (25 Tests)
│   ├── fixtures/                               # Mock data & JWT tokens
│   ├── test-data/                              # Controlled test JSON data files
│   └── utils/                                  # Winston logger & DB helpers
│
├── test-reports/                               # Generated Reports & Artifacts
│   ├── excel/                                  # SMARTTABLE_Test_Report.xlsx (5 Sheets)
│   ├── html/                                   # index.html (Responsive HTML Dashboard)
│   ├── screenshots/                            # Failure screenshots (web/ and mobile/)
│   ├── logs/                                   # test-execution.log (Structured Winston logs)
│   └── junit/                                  # results.json & XML results
│
├── scripts/                                    # Automation Scripts
│   ├── validate-test-count.js                  # Validates >= 300 executable tests
│   ├── generate-excel-report.js                # Compiles 5-sheet formatted Excel workbook
│   ├── generate-test-summary.js                # Prints CLI execution summary table
│   └── prepare-test-environment.js             # Initializes test DB & report folders
│
└── .github/workflows/                          # GitHub Actions CI Workflows
    ├── selenium-tests.yml                      # Selenium Web E2E Pipeline
    ├── api-tests.yml                           # API & DB Integration Pipeline
    └── mobile-tests.yml                        # Appium Mobile Android Pipeline
```

---

## 📊 2. Test Statistics & Distribution

| Testing Module | Test Layer | Framework | Unique Cases | Target Status |
|---|---|---|:---:|:---:|
| 🌐 **Selenium Web E2E** | Web UI & Full Flows | Selenium WebDriver + Mocha | **220** | Target >= 200 Met ✅ |
| 📱 **Appium Android Mobile** | Android Mobile UI | Appium 2 UiAutomator2 + Mocha | **110** | Target >= 100 Met ✅ |
| 🔌 **API & Database Tests** | Backend REST & DB | Axios + Mocha + Chai | **25** | Target Met ✅ |
| **TOTAL** | **Enterprise Matrix** | **Full Quality Suite** | **355** | **Minimum 300 Exceeded 🏆** |

---

## 🚀 3. Local Execution Commands

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Validate Total Test Count (>= 300 Tests)
```bash
node scripts/validate-test-count.js
```

### Step 3: Execute Selenium Web Tests
```bash
npm run test:web
```

### Step 4: Execute API & Database Integration Tests
```bash
npm run test:api
```

### Step 5: Execute Appium Mobile Tests
```bash
npm run test:mobile
```

### Step 6: Execute Full Test Matrix & Generate Reports
```bash
npm run test:all
```

### Step 7: Generate Multi-Sheet Excel Report
```bash
npm run report:excel
```

---

## 📑 4. Generated Test Reports

1. **Excel Analysis Workbook**:
   - **Path**: `test-reports/excel/SMARTTABLE_Test_Report.xlsx`
   - **Sheet 1**: `Test Summary` (KPIs, Pass/Fail Rate, Duration, Git Commit)
   - **Sheet 2**: `Detailed Test Results` (Test ID, Name, Platform, Module, Expected vs Actual, Status, Duration, Error)
   - **Sheet 3**: `Module Analysis` (Grouped metrics for all 9 modules)
   - **Sheet 4**: `Failed Tests` (Filtered failure audit trail)
   - **Sheet 5**: `Environment` (OS, Node, Browser, DB, Appium versions)
2. **HTML Responsive Dashboard**:
   - **Path**: `test-reports/html/index.html`
3. **Structured Winston Logs**:
   - **Path**: `test-reports/logs/test-execution.log`
4. **Failure Screenshots**:
   - **Path**: `test-reports/screenshots/web/` and `test-reports/screenshots/mobile/`

---

## ⚙️ 5. GitHub Actions Workflows

- **`selenium-tests.yml`**: Runs on push/PR to `main`, boots SQLite, starts backend & frontend, executes 220+ Selenium tests, and uploads `SMARTTABLE_Test_Report.xlsx` artifact.
- **`api-tests.yml`**: Runs on push/PR, executes all REST & DB tests.
- **`mobile-tests.yml`**: Runs on push/PR or manual dispatch (`workflow_dispatch`), runs Flutter analysis, unit/widget tests, and mobile validation audits.
