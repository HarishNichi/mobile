// HONDA MOTORCYCLE & SCOOTER INDIA (HMSI) - WMS MOBILE HANDHELD SCANNER APP
// Zebra TC57 / TC26 / Android Industrial Warehouse Terminal Execution Engine
// Implementation of H1 through H10 Specifications & Label Printing

const WMS_DEFAULT_USERS = [
  { userId: 'HND-USR-1002', pin: '1002', badge: 'BDG-002', name: 'Sanjay Verma', role: 'WAREHOUSE_OPERATOR', roleTitle: 'Warehouse Operator', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', shift: 'Shift A' },
  { userId: 'HND-USR-1003', pin: '1003', badge: 'BDG-003', name: 'Ramesh Gowda', role: 'SECURITY_OFFICER', roleTitle: 'Security Gate Officer', plant: 'HMSI Narsapur Plant 1', warehouse: 'GATE-02', shift: 'Shift A' },
  { userId: 'HND-USR-1004', pin: '1004', badge: 'BDG-004', name: 'Anand Murthy', role: 'LINE_SUPERVISOR', roleTitle: 'Line 1 Assembly Supervisor', plant: 'HMSI Narsapur Plant 1', warehouse: 'LINE-P1-L1', shift: 'Shift A' },
  { userId: 'HND-USR-1005', pin: '1005', badge: 'BDG-005', name: 'Vikram Patil', role: 'FORKLIFT_DRIVER', roleTitle: 'Reach Truck / Forklift Driver', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', shift: 'Shift A' }
];

function ensureWMSState() {
  if (!window.wms || typeof window.wms !== 'object') {
    window.wms = typeof loadWMSState === 'function' ? loadWMSState() : {};
  }
  if (!window.wms.gateEntries) window.wms.gateEntries = [];
  if (!window.wms.handlingUnits) window.wms.handlingUnits = [];
  if (!window.wms.putawayTasks) window.wms.putawayTasks = [];
  if (!window.wms.pickLists) window.wms.pickLists = [];
  if (!window.wms.materialRequisitions) window.wms.materialRequisitions = [];
  if (!window.wms.lineSupplyRequests) window.wms.lineSupplyRequests = [];
  if (!window.wms.goodsReceiptNotes) window.wms.goodsReceiptNotes = [];
  if (!window.wms.discrepancies) window.wms.discrepancies = [];
  if (!window.wms.purchaseOrders) window.wms.purchaseOrders = [];
  if (!window.wms.materials) window.wms.materials = [];
  if (!window.wms.sapSyncLogs) window.wms.sapSyncLogs = [];
  if (!window.wms.stockTransfers) window.wms.stockTransfers = [];
  if (!window.wms.cycleCounts) {
    window.wms.cycleCounts = [
      { countId: 'CC-HND-2026-0923-01', binCode: 'RM-A03-R04-S02-B05', materialCode: 'HND-THROT-KEIHIN', expectedQty: 80, countedQty: null, status: 'OPEN', assignedTo: 'HND-USR-1002', priority: 'HIGH', zone: 'Zone A - Powertrain' },
      { countId: 'CC-HND-2026-0923-02', binCode: 'RM-A02-R02-S01-B02', materialCode: 'HND-STR-MITSUBA', expectedQty: 40, countedQty: null, status: 'OPEN', assignedTo: 'HND-USR-1002', priority: 'NORMAL', zone: 'Zone A - Powertrain' },
      { countId: 'CC-HND-2026-0923-03', binCode: 'RM-B02-R01-S01-B01', materialCode: 'HND-ECU-KEIHIN-01', expectedQty: 10, countedQty: null, status: 'RECOUNT_REQUIRED', assignedTo: 'HND-USR-1002', priority: 'CRITICAL', zone: 'Zone B - Electronics' }
    ];
  }
  if (!window.wms.lineReturns) {
    window.wms.lineReturns = [
      { returnId: 'RET-2026-0081', lineId: 'Line 1 (Activa 6G)', materialCode: 'HND-THROT-KEIHIN', quantity: 5, reason: 'DEFECTIVE_COMPONENT', targetBin: 'QC-REJECT-ZONE-01', timestamp: '24-Sep-2026 14:20:10', returnedBy: 'Anand Murthy', status: 'In-Warehouse' }
    ];
  }
  if (!window.wms.reprintLogs) {
    window.wms.reprintLogs = [
      { logId: 'REP-LOG-901', labelType: 'HU', code: 'HU-HND-2026-009801', printer: 'PRN-DOCK-01', reason: 'DAMAGED_STICKER', requestedBy: 'Sanjay Verma', timestamp: '24-Sep-2026 15:10:00' }
    ];
  }
  if (!window.wms.userMaster || !window.wms.userMaster.length) {
    window.wms.userMaster = JSON.parse(JSON.stringify(WMS_DEFAULT_USERS));
  } else {
    // Ensure default PINs exist
    WMS_DEFAULT_USERS.forEach(defU => {
      const existing = window.wms.userMaster.find(u => u.userId === defU.userId);
      if (existing) {
        if (!existing.pin) existing.pin = defU.pin;
        if (!existing.badge) existing.badge = defU.badge;
      } else {
        window.wms.userMaster.push(JSON.parse(JSON.stringify(defU)));
      }
    });
  }
  return window.wms;
}

window.wms = ensureWMSState();

class MobileWMSApp {
  constructor() {
    ensureWMSState();
    this.currentView = 'login';
    this.taskCategory = 'inbound';
    this.scannedHU = null;
    this.activeUser = null;
    this.activeRole = localStorage.getItem('HONDA_MOB_ACTIVE_ROLE') || null;
    this.enquiryMode = 'BIN';
    this.enteredPin = '';
    this.activeShift = 'A';
  }

  init() {
    const savedUserId = localStorage.getItem('HONDA_MOB_ACTIVE_USER_ID');
    if (savedUserId && window.wms && window.wms.userMaster) {
      const user = window.wms.userMaster.find(u => u.userId === savedUserId);
      if (user) {
        this.activeUser = user;
        this.activeRole = user.role;
        this.applyRoleUI(user.role);
        return;
      }
    }
    if (this.activeRole) {
      this.applyRoleUI(this.activeRole);
    } else {
      this.logout();
    }
  }

  selectShift(shift, el) {
    this.activeShift = shift;
    document.querySelectorAll('.mob-shift-btn').forEach(btn => btn.classList.remove('active'));
    if (el) el.classList.add('active');
    this.playBeep('normal');
    this.showToast(`Active Shift: SHIFT ${shift}`, 'info', '⏱️');
  }

  clearOperatorInput() {
    const badgeDisplay = document.getElementById('mob-badge-display');
    if (badgeDisplay) badgeDisplay.textContent = 'OP-____';
    this.clearPin();
  }

  numpadPress(digit) {
    if (this.enteredPin.length < 4) {
      this.enteredPin += digit;
      this.updatePinDisplay();
      this.playBeep('normal');
      if (this.enteredPin.length === 4) {
        setTimeout(() => this.submitLoginWithPin(), 200);
      }
    }
  }

  numpadBackspace() {
    if (this.enteredPin.length > 0) {
      this.enteredPin = this.enteredPin.slice(0, -1);
      this.updatePinDisplay();
      this.playBeep('normal');
    }
  }

  clearPin() {
    this.enteredPin = '';
    this.updatePinDisplay();
  }

  updatePinDisplay() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pindot-${i}`);
      if (dot) {
        if (i < this.enteredPin.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      }
    }
    const txt = document.getElementById('pin-instruction-txt');
    if (txt) {
      const remaining = 4 - this.enteredPin.length;
      txt.textContent = remaining === 0 ? 'AUTHENTICATING...' : `ENTER REMAINING ${remaining} DIGIT${remaining > 1 ? 'S' : ''}`;
    }
  }

  // H1: Authentication with User ID + PIN / Badge Scan
  submitLoginWithPin() {
    const badgeText = document.getElementById('mob-badge-display')?.textContent.trim() || 'OP-7749';
    const pin = this.enteredPin || '1002';

    const users = (window.wms && window.wms.userMaster) ? window.wms.userMaster : WMS_DEFAULT_USERS;

    // Default to Rajesh Kumar / Sanjay Verma if typing on demo numpad
    let matched = users.find(u => u.pin === pin);
    if (!matched && (pin === '1002' || pin === '7749' || pin === '1004' || pin === '1003' || pin === '1005')) {
      matched = users[0];
    }

    if (!matched) {
      this.playBeep('error');
      this.showToast('Invalid Security PIN. Try PIN 1002, 1004, 1003 or 1005', 'error', '⛔');
      this.clearPin();
      return;
    }

    this.activeUser = matched;
    this.activeRole = matched.role;
    localStorage.setItem('HONDA_MOB_ACTIVE_ROLE', matched.role);
    localStorage.setItem('HONDA_MOB_ACTIVE_USER_ID', matched.userId);

    this.playBeep('success');
    this.showToast(`Logged in: Rajesh Kumar (${matched.roleTitle})`, 'success', '🔑');
    this.applyRoleUI(matched.role);
  }

  quickFillBadge(badgeId) {
    const users = (window.wms && window.wms.userMaster) ? window.wms.userMaster : WMS_DEFAULT_USERS;
    const u = users.find(x => x.badge === badgeId) || users[0];
    const badgeDisplay = document.getElementById('mob-badge-display');
    if (badgeDisplay) badgeDisplay.textContent = 'OP-7749';
    this.enteredPin = u.pin;
    this.updatePinDisplay();
    this.playBeep('success');
    this.showToast(`Badge ${badgeId} Verified • Auto-entering PIN`, 'info', '💳');
    setTimeout(() => this.submitLoginWithPin(), 400);
  }

  login(role) {
    this.activeRole = role;
    localStorage.setItem('HONDA_MOB_ACTIVE_ROLE', role);
    this.playBeep('success');
    this.applyRoleUI(role);
  }

  logout() {
    this.activeRole = null;
    this.activeUser = null;
    this.enteredPin = '';
    localStorage.removeItem('HONDA_MOB_ACTIVE_ROLE');
    localStorage.removeItem('HONDA_MOB_ACTIVE_USER_ID');
    this.playBeep('normal');

    const header = document.getElementById('mob-main-header');
    if (header) header.style.display = 'none';

    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';

    document.querySelectorAll('.mobile-view').forEach(v => {
      v.classList.remove('active');
      v.style.display = 'none';
    });
    const loginView = document.getElementById('mob-view-login');
    if (loginView) {
      loginView.classList.add('active');
      loginView.style.display = 'block';
    }
    this.updatePinDisplay();
    this.currentView = 'login';
  }

  applyRoleUI(role) {
    const header = document.getElementById('mob-main-header');
    if (header) header.style.display = 'flex';

    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (bottomNav) bottomNav.style.display = 'flex';

    const avatar = document.getElementById('mob-header-avatar');
    const nameHeader = document.getElementById('mob-user-name-header');
    const shiftBadge = document.getElementById('mob-user-shift-badge');

    if (avatar) avatar.textContent = 'RK';
    if (nameHeader) nameHeader.textContent = 'Rajesh Kumar';
    if (shiftBadge) shiftBadge.textContent = `SHIFT ${this.activeShift || 'A'}`;

    this.showView('home');
  }

  showView(viewId) {
    document.querySelectorAll('.mobile-view').forEach(v => {
      v.classList.remove('active');
      v.style.display = 'none';
    });
    document.querySelectorAll('.mob-nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById(`mob-view-${viewId}`);
    const navItem = document.querySelector(`.mob-nav-item[data-view="${viewId}"]`);

    if (target) {
      target.classList.add('active');
      target.style.display = 'block';
    }
    if (navItem) navItem.classList.add('active');
    this.currentView = viewId;

    if (viewId === 'home') this.renderHome();
    if (viewId === 'gate') this.renderMobileGateQueue();
    if (viewId === 'receiving') this.renderReceiving();
    if (viewId === 'putaway') this.renderPutaway();
    if (viewId === 'stock-enquiry') this.executeStockEnquiry();
    if (viewId === 'cycle-count') this.renderCycleCountList();
    if (viewId === 'picking') this.renderPickingQueue();
    if (viewId === 'issue-line') this.renderIssueHistory();
    if (viewId === 'returns') this.renderReturnsHistory();
    if (viewId === 'reprint') this.renderReprintHistory();
  }

  // H1: Dynamic Home Tiles Matching Image 2 Specifications
  renderHome() {
    const grid = document.getElementById('mob-home-tiles-grid');
    if (!grid) return;

    const gateCount = (window.wms.gateEntries || []).filter(g => g.status !== 'Completed').length || 12;
    const recCount = 28;
    const putCount = 42;
    const ccCount = 3;
    const pickCount = 19;

    const modules = [
      { id: 'gate', title: 'Truck Check-in', sub: 'Dock & Gate', icon: '🚚', iconBg: '#e0f2fe', iconColor: '#0284c7', count: gateCount, countBg: '#e0f2fe', countColor: '#0369a1', view: 'gate' },
      { id: 'receiving', title: 'Receiving', sub: 'Unload & GRN', icon: '📥', iconBg: '#ffedd5', iconColor: '#c2410c', count: recCount, countBg: '#ffedd5', countColor: '#9a3412', view: 'receiving' },
      { id: 'putaway', title: 'Putaway', sub: 'Stage to Racks', icon: '📦', iconBg: '#dcfce7', iconColor: '#15803d', count: putCount, countBg: '#bbf7d0', countColor: '#166534', view: 'putaway' },
      { id: 'stock', title: 'Stock & FIFO', sub: 'HU / Bin Lookup', icon: '🔍', iconBg: '#ede9fe', iconColor: '#6d28d9', count: 'LIVE', countBg: '#e0e7ff', countColor: '#3730a3', view: 'stock-enquiry' },
      { id: 'cycle', title: 'Cycle Count', sub: 'Blind Reconcile', icon: '📋', iconBg: '#e0f2fe', iconColor: '#0284c7', count: ccCount, countBg: '#bae6fd', countColor: '#0369a1', view: 'cycle-count' },
      { id: 'picking', title: 'Picking', sub: 'Wave & FIFO', icon: '🛒', iconBg: '#fee2e2', iconColor: '#b91c1c', count: pickCount, countBg: '#fee2e2', countColor: '#991b1b', view: 'picking' }
    ];

    grid.innerHTML = modules.map(m => `
      <div class="mob-task-tile" onclick="mob.showView('${m.view}')">
        <div class="mob-tile-icon-box" style="background:${m.iconBg}; color:${m.iconColor};">
          ${m.icon}
        </div>
        <div class="mob-tile-content">
          <div class="mob-tile-title-row">
            <span class="mob-tile-title">${m.title}</span>
            <span class="mob-tile-count-badge" style="background:${m.countBg}; color:${m.countColor};">${m.count}</span>
          </div>
          <div class="mob-tile-sub">${m.sub}</div>
        </div>
      </div>
    `).join('');
  }

  // H2: Truck Check-in (Gate/Dock)
  quickScanASNAtGate() {
    const input = document.getElementById('mob-ge-vehicle');
    if (input) input.value = 'ASN-HND-2026-00391';

    const supplierEl = document.getElementById('mob-ge-supplier-display');
    const poEl = document.getElementById('mob-ge-po');
    const qtyEl = document.getElementById('mob-ge-qty');
    const dockEl = document.getElementById('mob-ge-dock-assigned');

    if (supplierEl) supplierEl.value = 'Keihin India Electronics Pvt Ltd';
    if (poEl) poEl.value = 'PO-HND-2026-00421';
    if (qtyEl) qtyEl.value = '500 EA (Throttle Body)';
    if (dockEl) dockEl.textContent = 'Dock 04 (Chassis & Brakes Bay)';

    this.playBeep('normal');
    this.showToast('ASN-00391 Scanned • PO & Expected Qty Verified', 'info', '📄');
  }

  submitMobileGateEntry() {
    const asnInput = document.getElementById('mob-ge-vehicle');
    const supplierInput = document.getElementById('mob-ge-supplier-display');
    const poInput = document.getElementById('mob-ge-po');
    const qtyInput = document.getElementById('mob-ge-qty');
    const dockEl = document.getElementById('mob-ge-dock-assigned');

    const asn = asnInput?.value.trim() || 'ASN-HND-2026-00391';
    const supplier = supplierInput?.value || 'Keihin India Electronics Pvt Ltd';
    const po = poInput?.value || 'PO-HND-2026-00421';
    const dock = dockEl?.textContent || 'Dock 04 (Chassis & Brakes Bay)';
    const qty = 500;

    const newGE = {
      gateEntryNo: `GE-HND-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleNo: 'KA-01-AB-4821',
      supplier,
      poNumber: po,
      asnNumber: asn,
      driverName: 'Ravi Kumar',
      driverContact: '+91 98450 12345',
      arrivalTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plant: 'HMSI Narsapur Plant 1',
      gate: 'Security Gate 02 (North)',
      dock,
      expectedHUs: 5,
      expectedQty: qty,
      receivedHUs: 0,
      receivedQty: 0,
      status: 'Dock Assigned'
    };

    if (!window.wms.gateEntries) window.wms.gateEntries = [];
    window.wms.gateEntries.unshift(newGE);

    // Also add to incoming purchase orders so receiving has it
    if (!window.wms.purchaseOrders) window.wms.purchaseOrders = [];
    const existingPO = window.wms.purchaseOrders.find(p => p.poNumber === po);
    if (!existingPO) {
      window.wms.purchaseOrders.unshift({
        poNumber: po,
        supplier,
        plant: 'HMSI Narsapur Plant 1',
        materialCode: 'HND-THROT-KEIHIN',
        materialDescription: 'Keihin PGM-FI 26mm Throttle Body Assembly',
        orderedQuantity: qty,
        receivedQuantity: 0,
        openQuantity: qty,
        status: 'Receiving In Progress'
      });
    }

    saveWMSState(window.wms);

    // Reset Gate Inward Form inputs
    if (asnInput) asnInput.value = '';
    if (supplierInput) supplierInput.value = '';
    if (poInput) poInput.value = '';
    if (qtyInput) qtyInput.value = '';
    if (dockEl) dockEl.textContent = 'Awaiting Next Truck Scan...';

    this.playBeep('success');
    this.showToast(`Gate Pass ${newGE.gateEntryNo} Created ➔ Moving to Inbound Receiving (Dock 04)`, 'success', '🚚');
    this.renderMobileGateQueue();

    // Auto-advance directly to Receiving stage after 700ms
    setTimeout(() => {
      this.showView('receiving');
    }, 700);
  }

  renderMobileGateQueue() {
    const container = document.getElementById('mob-gate-queue-container');
    if (!container) return;

    const list = (window.wms.gateEntries || []).slice(0, 3);
    if (!list.length) {
      container.innerHTML = `<div style="text-align:center; color:#64748b; padding:15px; font-size:11px;">No active trucks in queue. Scan incoming ASN above.</div>`;
      return;
    }

    container.innerHTML = list.map(ge => `
      <div class="mob-task-card" style="border-left: 3px solid #10b981; margin-bottom:8px;">
        <div class="mob-task-card-header" style="display:flex; justify-content:space-between;">
          <span class="mob-task-id">🚚 ${ge.vehicleNo}</span>
          <span class="mob-task-badge" style="background:#f0fdf4; color:#166534;">${ge.status}</span>
        </div>
        <div class="mob-task-details" style="font-size:11px; color:#334155; margin:4px 0;">
          <div>Supplier: <strong>${ge.supplier}</strong></div>
          <div>PO: <strong>${ge.poNumber}</strong> | ASN: ${ge.asnNumber}</div>
        </div>
        <div class="mob-task-locations" style="font-size:11px; color:#0284c7; display:flex; justify-content:space-between; align-items:center;">
          <span>Pass: ${ge.gateEntryNo}</span> ➔ <span><strong>${ge.dock}</strong></span>
        </div>
      </div>
    `).join('');
  }

  // H3: Inbound Receiving with Tolerance Checks, Photo Mock & MRN Generation
  onReceivingASNChange() {
    const asn = document.getElementById('mob-rec-asn-select')?.value;
    const matName = document.getElementById('mob-rec-mat-name');
    const expQty = document.getElementById('mob-rec-expected-qty');
    const lotEl = document.getElementById('mob-rec-lot');
    const goodInput = document.getElementById('mob-rec-good-qty');
    const badInput = document.getElementById('mob-rec-bad-qty');

    if (asn === 'ASN-HND-2026-00600-10') {
      if (matName) matName.textContent = 'HND-ECU-KEIHIN-01 (Keihin ECU OBD2 - PO-600 #10)';
      if (expQty) expQty.textContent = '400 EA (Tolerance ±5%)';
      if (lotEl) lotEl.textContent = 'BAT-KEI-2026-09-25-01';
      if (goodInput) goodInput.value = '400';
      if (badInput) badInput.value = '0';
    } else if (asn === 'ASN-HND-2026-00600-20') {
      if (matName) matName.textContent = 'HND-CVT-BELT-BND (Bando V-Belt Drive - PO-600 #20)';
      if (expQty) expQty.textContent = '500 EA (Tolerance ±5%)';
      if (lotEl) lotEl.textContent = 'BAT-BND-2026-09-26-01';
      if (goodInput) goodInput.value = '490';
      if (badInput) badInput.value = '10';
    } else if (asn === 'ASN-HND-2026-00600-30') {
      if (matName) matName.textContent = 'HND-THROT-KEIHIN (Keihin Throttle Body - PO-600 #30)';
      if (expQty) expQty.textContent = '600 EA (Tolerance ±5%)';
      if (lotEl) lotEl.textContent = 'BAT-KEI-2026-09-25-02';
      if (goodInput) goodInput.value = '300';
      if (badInput) badInput.value = '0';
    } else if (asn === 'ASN-HND-2026-00394') {
      if (matName) matName.textContent = 'HND-SHK-SHOWA (Telescopic Suspension)';
      if (expQty) expQty.textContent = '400 SET (Tolerance ±5%)';
      if (lotEl) lotEl.textContent = 'BAT-SHW-2026-09-22-04';
      if (goodInput) goodInput.value = '390';
      if (badInput) badInput.value = '10';
    } else {
      if (matName) matName.textContent = 'HND-THROT-KEIHIN (26mm Throttle Body)';
      if (expQty) expQty.textContent = '500 EA (Tolerance ±5%)';
      if (lotEl) lotEl.textContent = 'BAT-KEI-2026-09-23-01';
      if (goodInput) goodInput.value = '480';
      if (badInput) badInput.value = '20';
    }

    this.checkReceivingTolerance();
    this.updateBoxesBreakdown();
  }

  updateBoxesBreakdown() {
    const goodQty = parseInt(document.getElementById('mob-rec-good-qty')?.value || '480', 10);
    const boxInput = document.getElementById('mob-rec-boxes-qty');
    const boxTxt = document.getElementById('mob-rec-qty-per-box-txt');
    let numBoxes = parseInt(boxInput?.value || '1', 10);
    if (!numBoxes || numBoxes <= 0) numBoxes = 1;

    const avg = Math.round(goodQty / numBoxes);
    if (boxTxt) boxTxt.textContent = `${avg} EA / Box (${numBoxes} Boxes)`;
  }

  triggerScanReceivingMat() {
    this.playBeep('normal');
    this.showToast('Supplier Multi-Part Barcode Verified', 'info', '📷');
  }

  checkReceivingTolerance() {
    const goodQty = parseInt(document.getElementById('mob-rec-good-qty')?.value || '0', 10);
    const badQty = parseInt(document.getElementById('mob-rec-bad-qty')?.value || '0', 10);
    const total = goodQty + badQty;
    const expText = document.getElementById('mob-rec-expected-qty')?.textContent || '500';
    const expTotal = parseInt(expText.match(/\d+/)?.[0] || '500', 10);

    const reasonBox = document.getElementById('mob-rec-reason-box');
    if (reasonBox) reasonBox.style.display = badQty > 0 ? 'block' : 'none';

    const bar = document.getElementById('mob-rec-progress-bar');
    const txt = document.getElementById('mob-rec-progress-txt');
    const pct = Math.min(100, Math.round((total / expTotal) * 100));

    if (bar) bar.style.width = `${pct}%`;
    if (txt) txt.textContent = `${pct}% Inspected (${total}/${expTotal})`;

    if (total > expTotal * 1.05) {
      this.showToast('⚠️ Warning: Quantity exceeds +5% tolerance! Supervisor approval required.', 'error', '⚠️');
    }
    this.updateBoxesBreakdown();
  }

  captureReceivingPhoto() {
    const badge = document.getElementById('mob-photo-badge');
    if (badge) badge.style.display = 'inline';
    this.playBeep('success');
    this.showToast('Damaged crate photo attached to inspection report', 'success', '📸');
  }

  printNearestPalletLabel() {
    const goodQty = parseInt(document.getElementById('mob-rec-good-qty')?.value || '480', 10);
    const numBoxes = parseInt(document.getElementById('mob-rec-boxes-qty')?.value || '4', 10);
    const matNameEl = document.getElementById('mob-rec-mat-name')?.textContent || 'HND-THROT-KEIHIN';
    const matCode = matNameEl.split(' ')[0] || 'HND-THROT-KEIHIN';
    const lotNo = document.getElementById('mob-rec-lot')?.textContent || 'BAT-KEI-2026-09-25-01';

    // Generate individual HU labels for each box
    this.activeBoxesList = [];
    const baseQty = Math.floor(goodQty / numBoxes);
    const remainder = goodQty % numBoxes;

    for (let i = 1; i <= numBoxes; i++) {
      const boxQty = i === numBoxes ? baseQty + remainder : baseQty;
      this.activeBoxesList.push({
        boxIndex: i,
        totalBoxes: numBoxes,
        huNumber: `HU-HND-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        partNo: matCode,
        partDesc: matNameEl,
        qty: boxQty,
        lotNo,
        supplier: 'Keihin India Electronics Pvt Ltd',
        grn: 'MRN-PENDING'
      });
    }

    this.currentBoxIndex = 0;
    this.renderHULabelBoxCarousel();
  }

  submitCloseReceivingMRN() {
    const asn = document.getElementById('mob-rec-asn-select')?.value || 'ASN-HND-2026-00391';
    const goodQty = parseInt(document.getElementById('mob-rec-good-qty')?.value || '480', 10);
    const badQty = parseInt(document.getElementById('mob-rec-bad-qty')?.value || '20', 10);
    const mrnNo = `MRN-HND-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newHU = `HU-HND-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create GRN / MRN
    if (!window.wms.goodsReceiptNotes) window.wms.goodsReceiptNotes = [];
    window.wms.goodsReceiptNotes.unshift({
      grnNumber: mrnNo,
      poNumber: 'PO-HND-2026-00421',
      supplier: 'Keihin India Electronics Pvt Ltd',
      receivedHUs: Math.ceil(goodQty / 100),
      acceptedQuantity: goodQty,
      uom: 'EA',
      status: 'MRN Created (Pending Approval)',
      receiptTimestamp: new Date().toLocaleTimeString(),
      inspector: this.activeUser?.name || 'Rajesh Kumar'
    });

    // Create Putaway Task
    if (!window.wms.putawayTasks) window.wms.putawayTasks = [];
    window.wms.putawayTasks.unshift({
      taskId: `PUT-HND-${Math.floor(100 + Math.random() * 900)}`,
      huNumber: newHU,
      materialCode: 'HND-THROT-KEIHIN',
      quantity: goodQty,
      uom: 'EA',
      sourceLocation: 'Central Inbound Dock 01',
      suggestedLocation: 'RM-A03-R04-S02-B05',
      status: 'Open'
    });

    // Add HU to Handling Units inventory
    if (!window.wms.handlingUnits) window.wms.handlingUnits = [];
    window.wms.handlingUnits.unshift({
      huNumber: newHU,
      materialCode: 'HND-THROT-KEIHIN',
      description: 'Keihin Throttle Body Sub-Assy (Activa 6G)',
      quantity: goodQty,
      uom: 'EA',
      location: 'STAGING-DOCK-04',
      status: 'READY_FOR_PUTAWAY',
      plant: 'HMSI Narsapur Plant 1',
      supplier: 'Keihin India Electronics Pvt Ltd',
      batch: `BT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      mfgDate: new Date().toISOString().split('T')[0],
      fifoPriority: 1
    });

    saveWMSState(window.wms);

    // Reset Receiving form fields
    const goodInput = document.getElementById('mob-rec-good-qty');
    const badInput = document.getElementById('mob-rec-bad-qty');
    const photoBadge = document.getElementById('mob-photo-badge');
    if (goodInput) goodInput.value = '0';
    if (badInput) badInput.value = '0';
    if (photoBadge) photoBadge.style.display = 'none';

    this.playBeep('success');
    this.showToast(`Receiving Closed • ${mrnNo} Created ➔ Advance to Putaway`, 'success', '📑');

    // Automatically advance to Putaway view after 700ms
    setTimeout(() => {
      this.showView('putaway');
    }, 700);
  }

  renderReceiving() {
    this.checkReceivingTolerance();
  }

  // H4: Putaway with Wrong Bin Error, Override & Bin Full Suggestion
  onPutawayTaskSelect() {
    const val = document.getElementById('mob-put-task-select')?.value;
    const binTxt = document.getElementById('mob-put-suggested-bin-txt');
    const itemTxt = document.getElementById('mob-put-item-txt');

    if (val === 'PUT-HND-003') {
      if (binTxt) binTxt.textContent = 'RM-D01-R01-S01-B01';
      if (itemTxt) itemTxt.textContent = 'Material: HND-TYR-MRF-90 | Qty: 130 EA';
    } else {
      if (binTxt) binTxt.textContent = 'RM-A03-R04-S02-B05';
      if (itemTxt) itemTxt.textContent = 'Material: HND-THROT-KEIHIN | Qty: 120 EA';
    }
  }

  quickScanPutawayHU() {
    const val = document.getElementById('mob-put-task-select')?.value;
    const task = (window.wms.putawayTasks || []).find(t => t.taskId === val);
    let huNumber = task?.huNumber;
    if (!huNumber) {
      huNumber = (val === 'PUT-HND-003') ? 'HU-HND-2026-009809' : 'HU-HND-2026-009803';
    }
    const input = document.getElementById('mob-put-hu-scan-input');
    if (input) input.value = huNumber;
    this.playBeep('normal');
    this.showToast(`HU Scanned: ${huNumber}`, 'info', '🏷️');
  }

  quickFillCorrectPutawayBin() {
    const suggested = document.getElementById('mob-put-suggested-bin-txt')?.textContent.trim() || 'RM-D01-R01-S01-B01';
    const input = document.getElementById('mob-put-bin-scan-input');
    if (input) input.value = suggested;
    this.playBeep('normal');
    this.showToast(`Bin Scanned: ${suggested}`, 'info', '📍');
  }

  triggerBinFullSuggestion() {
    const altBins = ['RM-A04-R02-S01-B01', 'RM-A05-R01-S02-B02', 'RM-B01-R01-S01-B01'];
    const chosen = altBins[Math.floor(Math.random() * altBins.length)];
    const binTxt = document.getElementById('mob-put-suggested-bin-txt');
    const input = document.getElementById('mob-put-bin-scan-input');

    if (binTxt) binTxt.textContent = chosen;
    if (input) input.value = chosen;

    this.playBeep('normal');
    this.showToast(`Bin Full Alert: Auto-suggested nearest vacant bin ${chosen}`, 'info', '💡');
  }

  overridePutawayBin() {
    const override = prompt('Enter supervisor authorized override bin code:');
    if (override) {
      const input = document.getElementById('mob-put-bin-scan-input');
      if (input) input.value = override.trim();
      this.showToast(`Bin Overridden to ${override} (Logged to Audit)`, 'info', '✏️');
    }
  }

  confirmPutawayExecution() {
    const scannedHU = document.getElementById('mob-put-hu-scan-input')?.value.trim();
    const scannedBin = document.getElementById('mob-put-bin-scan-input')?.value.trim();
    const suggestedBin = document.getElementById('mob-put-suggested-bin-txt')?.textContent.trim();

    if (!scannedHU) {
      this.playBeep('error');
      this.showToast('Scan HU label barcode before confirming putaway', 'error', '⚠️');
      return;
    }

    if (!scannedBin) {
      this.playBeep('error');
      this.showToast('Scan destination bin barcode before confirming', 'error', '⚠️');
      return;
    }

    if (scannedBin !== suggestedBin) {
      this.playBeep('error');
      this.showToast(`Error: Scanned bin ${scannedBin} does not match suggested bin ${suggestedBin}`, 'error', '⛔');
      return;
    }

    // Update putaway task status and HU location
    const selectedTaskId = document.getElementById('mob-put-task-select')?.value;
    const currentTask = (window.wms.putawayTasks || []).find(t => t.taskId === selectedTaskId) ||
                        (window.wms.putawayTasks || []).find(t => t.status === 'Open');
    if (currentTask) {
      currentTask.status = 'Completed';
      const hu = (window.wms.handlingUnits || []).find(h => h.huNumber === currentTask.huNumber || h.huNumber.includes(scannedHU) || scannedHU.includes(h.huNumber));
      if (hu) {
        hu.location = scannedBin;
        hu.status = 'AVAILABLE';
      }
    }

    saveWMSState(window.wms);

    // Clear putaway scan inputs
    const huInput = document.getElementById('mob-put-hu-scan-input');
    if (huInput) huInput.value = '';
    const binInput = document.getElementById('mob-put-bin-scan-input');
    if (binInput) binInput.value = '';

    this.playBeep('success');
    this.showToast(`Putaway Completed! Material stored in ${scannedBin} ➔ Moving to Stock Enquiry`, 'success', '✅');

    // Auto-advance to Stock Enquiry to view updated bin stock
    setTimeout(() => {
      this.showView('stock-enquiry');
    }, 700);
  }

  renderPutaway() {
    this.onPutawayTaskSelect();
    const container = document.getElementById('mob-putaway-queue-container');
    if (!container) return;

    const list = (window.wms.putawayTasks || []).filter(t => t.status === 'Open').slice(0, 3);
    container.innerHTML = list.map(t => `
      <div class="mob-task-card" style="border-left: 3px solid #f59e0b; margin-bottom:8px;">
        <div class="mob-task-card-header" style="display:flex; justify-content:space-between;">
          <span class="mob-task-id">📦 ${t.taskId}</span>
          <span class="mob-task-badge" style="background:#fef3c7; color:#b45309; font-weight:800; padding:2px 6px; border-radius:4px;">${t.status}</span>
        </div>
        <div class="mob-task-details" style="font-size:11px; color:#334155; margin:4px 0; line-height:1.6;">
          <div>HU: <strong style="color:#0f172a;">${t.huNumber}</strong> (${t.quantity} ${t.uom || 'EA'})</div>
          <div>Suggested Bin: <strong style="color:#0284c7;">${t.suggestedLocation}</strong></div>
        </div>
      </div>
    `).join('');
  }

  // H5: Stock Enquiry (Dual-Mode: Bin Contents OR Part/HU FIFO Queue)
  setEnquiryMode(mode) {
    this.enquiryMode = mode;
    const tabBin = document.getElementById('tab-enq-bin');
    const tabMat = document.getElementById('tab-enq-mat');
    const input = document.getElementById('mob-enquiry-input');

    if (mode === 'BIN') {
      if (tabBin) {
        tabBin.style.background = '#8b3e00';
        tabBin.style.color = '#ffffff';
      }
      if (tabMat) {
        tabMat.style.background = '#f1f5f9';
        tabMat.style.color = '#334155';
      }
      if (input) {
        input.value = 'RM-A03-R04-S02-B05';
        input.placeholder = 'Scan Bin barcode (e.g. RM-A03-R04-S02-B05)...';
      }
    } else {
      if (tabBin) {
        tabBin.style.background = '#f1f5f9';
        tabBin.style.color = '#334155';
      }
      if (tabMat) {
        tabMat.style.background = '#8b3e00';
        tabMat.style.color = '#ffffff';
      }
      if (input) {
        input.value = 'HND-THROT-KEIHIN';
        input.placeholder = 'Scan HU / Material (e.g. HND-THROT-KEIHIN)...';
      }
    }
    this.executeStockEnquiry();
  }

  executeStockEnquiry() {
    const q = document.getElementById('mob-enquiry-input')?.value.trim();
    const container = document.getElementById('mob-enquiry-results-container');
    if (!container) return;

    if (this.enquiryMode === 'BIN') {
      const husInBin = (window.wms.handlingUnits || []).filter(h => h.location === q || h.location?.includes(q));
      if (!husInBin.length) {
        container.innerHTML = `
          <div style="background:#ffffff; padding:12px; border-radius:10px; border:1px solid #e2e8f0; text-align:center; color:#64748b;">
            No Handling Units found at bin location: <strong style="color:#0f172a;">${q}</strong>. Bin is vacant.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="font-size:11px; font-weight:800; color:#0284c7; margin-bottom:6px;">CONTENTS OF BIN: ${q}</div>
      ` + husInBin.map(h => `
        <div class="mob-task-card" style="border-left: 3px solid #06b6d4; margin-bottom:8px;">
          <div class="mob-task-card-header" style="display:flex; justify-content:space-between;">
            <strong style="color:#0f172a; font-size:12px;">${h.huNumber}</strong>
            <span class="wms-badge badge-available" style="background:#f0fdf4; color:#166534; font-weight:800; padding:2px 6px; border-radius:4px;">${h.status}</span>
          </div>
          <div style="font-size:11px; line-height:1.6; color:#334155; margin-top:4px;">
            <div>Part: <strong style="color:#0f172a;">${h.materialCode}</strong></div>
            <div>Qty: <strong style="color:#0f172a;">${h.quantity} ${h.uom}</strong></div>
            <div>Batch: <strong style="color:#0369a1;">${h.batch}</strong> (FIFO Priority P${h.fifoPriority || 1})</div>
          </div>
        </div>
      `).join('');
    } else {
      const husWithMat = (window.wms.handlingUnits || []).filter(h => h.materialCode === q || h.materialCode?.includes(q));
      container.innerHTML = `
        <div style="font-size:11px; font-weight:800; color:#166534; margin-bottom:6px;">FIFO ALLOCATION QUEUE FOR: ${q}</div>
      ` + husWithMat.map((h, i) => `
        <div class="mob-task-card" style="border-left: 3px solid ${i === 0 ? '#10b981' : '#f59e0b'}; margin-bottom:8px;">
          <div class="mob-task-card-header" style="display:flex; justify-content:space-between;">
            <strong style="color:#0f172a; font-size:12px;">${h.huNumber}</strong>
            <span class="wms-badge badge-fifo-p${i + 1}" style="background:#eff6ff; color:#1d4ed8; font-weight:800; padding:2px 6px; border-radius:4px;">FIFO Rank #${i + 1}</span>
          </div>
          <div style="font-size:11px; line-height:1.6; color:#334155; margin-top:4px;">
            <div>Bin Location: <strong style="color:#0284c7;">${h.location}</strong></div>
            <div>Batch: <strong style="color:#0369a1;">${h.batch}</strong> | Qty: <strong style="color:#0f172a;">${h.quantity} ${h.uom}</strong></div>
            <div>Mfg Date: <span style="color:#475569;">${h.mfgDate || '2026-09-18'}</span></div>
          </div>
        </div>
      `).join('');
    }
  }

  // H6: Cycle Counting (Blind Count Mode & Recount Handlers)
  onCycleCountTaskSelect() {
    const task = document.getElementById('mob-cc-task-select')?.value;
    const binInput = document.getElementById('mob-cc-bin-input');
    const matInput = document.getElementById('mob-cc-mat-input');
    if (binInput) binInput.value = '';
    if (matInput) matInput.value = '';
  }

  quickScanCCBin() {
    const task = document.getElementById('mob-cc-task-select')?.value;
    const input = document.getElementById('mob-cc-bin-input');
    if (input) {
      input.value = task.includes('03') ? 'RM-B02-R01-S01-B01' : 'RM-A03-R04-S02-B05';
    }
    this.playBeep('normal');
    this.showToast('Bin Barcode Verified', 'info', '✅');
  }

  quickScanCCMat() {
    const task = document.getElementById('mob-cc-task-select')?.value;
    const input = document.getElementById('mob-cc-mat-input');
    if (input) {
      input.value = task.includes('03') ? 'HND-ECU-KEIHIN-01' : 'HND-THROT-KEIHIN';
    }
    this.playBeep('normal');
    this.showToast('Part Barcode Verified', 'info', '✅');
  }

  submitCycleCount() {
    const binInput = document.getElementById('mob-cc-bin-input');
    const matInput = document.getElementById('mob-cc-mat-input');
    const qtyInput = document.getElementById('mob-cc-qty-input');

    const bin = binInput?.value.trim();
    const mat = matInput?.value.trim();
    const counted = parseInt(qtyInput?.value || '0', 10);
    const taskId = document.getElementById('mob-cc-task-select')?.value;

    if (!bin || !mat) {
      this.playBeep('error');
      this.showToast('Scan both Bin barcode and Material/HU barcode', 'error', '⚠️');
      return;
    }

    const cc = (window.wms.cycleCounts || []).find(c => c.countId === taskId);
    if (cc) {
      cc.countedQty = counted;
      cc.status = 'COMPLETED';
      const variance = counted - (cc.expectedQty || 80);
      if (variance !== 0) {
        cc.status = 'RECOUNT_REQUIRED';
        this.playBeep('error');
        this.showToast(`Variance detected (${variance > 0 ? '+' : ''}${variance} EA). Recount task scheduled!`, 'error', '⚠️');
      } else {
        this.playBeep('success');
        this.showToast(`Cycle Count Verified: 0 Variance for ${bin}`, 'success', '🎉');
      }
    } else {
      this.playBeep('success');
      this.showToast(`Cycle Count for ${bin} submitted`, 'success', '✅');
    }

    // Clear count form inputs
    if (binInput) binInput.value = '';
    if (matInput) matInput.value = '';
    if (qtyInput) qtyInput.value = '';

    saveWMSState(window.wms);
    this.renderCycleCountList();
  }

  renderCycleCountList() {
    const container = document.getElementById('mob-cycle-count-list-container');
    if (!container) return;

    const list = window.wms.cycleCounts || [];
    container.innerHTML = list.map(c => `
      <div class="mob-task-card" style="border-left: 3px solid ${c.status === 'COMPLETED' ? '#10b981' : (c.status === 'RECOUNT_REQUIRED' ? '#ef4444' : '#a855f7')}; margin-bottom:8px;">
        <div class="mob-task-card-header" style="display:flex; justify-content:space-between;">
          <strong style="color:#0f172a; font-size:12px;">${c.countId}</strong>
          <span class="wms-badge" style="background:#f1f5f9; color:#334155;">${c.status}</span>
        </div>
        <div style="font-size:11px; line-height:1.6; color:#475569; margin-top:4px;">
          <div>Bin: <strong style="color:#0284c7;">${c.binCode}</strong> | Part: <strong>${c.materialCode}</strong></div>
          <div>Blind Count Status: <strong>${c.countedQty !== null ? `${c.countedQty} EA Counted` : 'Pending Count'}</strong></div>
        </div>
      </div>
    `).join('');
  }

  fillMaxPickQty(qty) {
    const input = document.getElementById('mob-pick-qty-input');
    if (input) input.value = qty;
    this.playBeep('normal');
    this.showToast(`Pick Quantity set to ${qty} EA`, 'info', '🔢');
  }

  validatePickQtyInput(el) {
    if (!el) return;
    const max = parseInt(el.getAttribute('max') || '80', 10);
    const min = parseInt(el.getAttribute('min') || '1', 10);
    let val = parseInt(el.value, 10);

    if (val > max) {
      el.value = max;
      this.playBeep('error');
      this.showToast(`Quantity cannot exceed maximum required ${max} EA`, 'error', '⚠️');
    } else if (val < min && el.value !== '') {
      el.value = min;
    }
  }

  // H7: Strict FIFO Picking
  quickFillCorrectFIFOHU() {
    const binInput = document.getElementById('mob-pick-scan-bin');
    const huInput = document.getElementById('mob-pick-scan-hu');
    const qtyInput = document.getElementById('mob-pick-qty-input');
    if (binInput) binInput.value = 'RM-A03-R04-S02-B05';
    if (huInput) huInput.value = 'HU-HND-2026-009801';
    if (qtyInput) qtyInput.value = '80';
    this.playBeep('normal');
    this.showToast('Oldest FIFO Lot (Priority #1) Barcode Scanned • Qty: 80 EA', 'info', '✅');
  }

  quickTestNonFIFOHU() {
    const binInput = document.getElementById('mob-pick-scan-bin');
    const huInput = document.getElementById('mob-pick-scan-hu');
    const qtyInput = document.getElementById('mob-pick-qty-input');
    if (binInput) binInput.value = 'RM-A03-R04-S02-B05';
    if (huInput) huInput.value = 'HU-HND-2026-009805';
    if (qtyInput) qtyInput.value = '80';

    // Trigger FIFO warning
    this.playBeep('error');
    this.showFIFOException(
      { huNumber: 'HU-HND-2026-009805', batch: 'BAT-KEI-2026-09-23-01', fifoPriority: 3 },
      { huNumber: 'HU-HND-2026-009801', batch: 'BAT-KEI-2026-09-18-01', location: 'RM-A03-R04-S02-B05' }
    );
  }

  reportShortPick() {
    const reason = prompt('Enter Short Pick Reason (e.g. Broken Crate, Inaccessible High Rack):');
    if (reason) {
      this.playBeep('error');
      this.showToast(`Short Pick Logged: "${reason}". Shortage incident created.`, 'error', '⚠️');
    }
  }

  printPickSlipModal() {
    this.showPickSlipPreview('PL-HND-2026-00129', 'Line 1 (Activa 6G)', 'HND-THROT-KEIHIN', 80, 'RM-A03-R04-S02-B05');
  }

  confirmFIFOPick() {
    const binInput = document.getElementById('mob-pick-scan-bin');
    const huInput = document.getElementById('mob-pick-scan-hu');
    const qtyInput = document.getElementById('mob-pick-qty-input');

    const bin = binInput?.value.trim();
    const hu = huInput?.value.trim();
    let qty = parseInt(qtyInput?.value || '80', 10);

    if (!bin || !hu) {
      this.playBeep('error');
      this.showToast('Scan target Bin and FIFO HU barcode', 'error', '⚠️');
      return;
    }

    if (!qty || qty <= 0) {
      this.playBeep('error');
      this.showToast('Enter valid pick quantity', 'error', '⚠️');
      return;
    }

    if (qty > 80) {
      if (qtyInput) qtyInput.value = '80';
      this.playBeep('error');
      this.showToast('Error: Pick quantity cannot exceed requested 80 EA', 'error', '⛔');
      return;
    }

    // Update Pick List status
    if (window.wms.pickLists && window.wms.pickLists.length) {
      window.wms.pickLists[0].status = 'Picked & Staged';
      window.wms.pickLists[0].pickedQty = qty;
    }

    // Clear picking form fields
    if (binInput) binInput.value = '';
    if (huInput) huInput.value = '';
    if (qtyInput) qtyInput.value = '80';

    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`Pick Success: ${qty} EA of ${hu} staged at Lineside STG-P1-L1 ➔ Advance to Issue to Line`, 'success', '🛒');

    // Auto-advance to Issue to Line stage after 700ms
    setTimeout(() => {
      this.showView('issue-line');
    }, 700);
  }

  renderPickingQueue() {
    const container = document.getElementById('mob-pick-queue-container');
    if (!container) return;

    const list = window.wms.pickLists || [];
    container.innerHTML = list.slice(0, 3).map(pl => `
      <div class="mob-task-card" style="border-left: 3px solid #ec4899; margin-bottom:8px;">
        <div class="mob-task-card-header" style="display:flex; justify-content:space-between;">
          <strong style="color:#0f172a;">${pl.pickListNo}</strong>
          <span class="wms-badge badge-fifo">${pl.status}</span>
        </div>
        <div style="font-size:11px; line-height:1.6; color:#475569; margin-top:4px;">
          <div>Destination: <strong>${pl.line}</strong></div>
          <div>Staging: <strong>${pl.stagingLocation}</strong></div>
        </div>
      </div>
    `).join('');
  }

  // H8: Issue to Line (Trolley Barcode & SAP Movement 261)
  verifyTrolleyBarcode() {
    this.playBeep('normal');
    this.showToast('Trolley Barcode PL-00129 Verified for Line 1 Delivery', 'info', '🛒');
  }

  confirmLineIssueGI() {
    const trolleyInput = document.getElementById('mob-issue-trolley-input');
    const stgInput = document.getElementById('mob-issue-stg-scan');
    const stg = stgInput?.value.trim() || 'STG-P1-L1';

    if (!window.wms.sapSyncLogs) window.wms.sapSyncLogs = [];
    window.wms.sapSyncLogs.unshift({
      syncId: `SYNC-GI-${Date.now()}`,
      interfaceId: 'BAPI_GOODSMVT_CREATE',
      direction: 'OUTBOUND',
      sapDocNo: `SAP-MATDOC-5000${Math.floor(1000 + Math.random() * 9000)}`,
      wmsRef: 'PL-HND-2026-00129',
      payloadType: 'MOVEMENT_261_GOODS_ISSUE',
      status: 'POSTED_TO_SAP (200 OK)',
      timestamp: new Date().toLocaleTimeString()
    });

    // Clear inputs
    if (trolleyInput) trolleyInput.value = '';
    if (stgInput) stgInput.value = '';

    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`Goods Issue 261 Sent to SAP • Material Delivered to ${stg} ➔ Process Completed`, 'success', '🚀');
    this.renderIssueHistory();

    // Auto-advance back to Home after 1200ms
    setTimeout(() => {
      this.showView('home');
    }, 1200);
  }

  renderIssueHistory() {
    const container = document.getElementById('mob-issue-history-container');
    if (!container) return;

    const logs = (window.wms.sapSyncLogs || []).filter(l => l.payloadType?.includes('261') || l.payloadType?.includes('ISSUE')).slice(0, 3);
    container.innerHTML = logs.map(l => `
      <div class="mob-task-card" style="border-left: 3px solid #8b5cf6; margin-bottom:8px;">
        <div class="mob-task-card-header" style="display:flex; justify-content:space-between;">
          <strong style="color:#0f172a;">${l.sapDocNo}</strong>
          <span class="wms-badge badge-available">SAP GI 261</span>
        </div>
        <div style="font-size:11px; color:#475569; margin-top:4px;">
          <div>Ref: ${l.wmsRef} | Time: ${l.timestamp}</div>
          <div style="color:#15803d; font-weight:800;">Status: ${l.status}</div>
        </div>
      </div>
    `).join('');
  }

  // H9: Returns from Line
  submitLineReturn() {
    const line = document.getElementById('mob-ret-line')?.value;
    const mat = document.getElementById('mob-ret-mat')?.value;
    const qtyInput = document.getElementById('mob-ret-qty');
    const qty = parseInt(qtyInput?.value || '5', 10);
    const reason = document.getElementById('mob-ret-reason')?.value;
    const targetBin = document.getElementById('mob-ret-target-bin')?.value;

    const returnId = `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReturn = {
      returnId,
      lineId: line,
      materialCode: mat,
      quantity: qty,
      reason,
      targetBin,
      timestamp: new Date().toLocaleTimeString(),
      returnedBy: this.activeUser?.name || 'Line Supervisor',
      status: 'Putaway Generated'
    };

    if (!window.wms.lineReturns) window.wms.lineReturns = [];
    window.wms.lineReturns.unshift(newReturn);

    // Create putaway task for the return
    if (!window.wms.putawayTasks) window.wms.putawayTasks = [];
    window.wms.putawayTasks.unshift({
      taskId: `PUT-RET-${Math.floor(100 + Math.random() * 900)}`,
      huNumber: `HU-RET-${Math.floor(10000 + Math.random() * 90000)}`,
      materialCode: mat,
      quantity: qty,
      uom: 'EA',
      sourceLocation: line,
      suggestedLocation: targetBin,
      status: 'Open'
    });

    // Reset return form
    if (qtyInput) qtyInput.value = '1';

    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`Return ${returnId} Accepted • Putaway to ${targetBin} Created ➔ Move to Putaway`, 'success', '📦');
    this.renderReturnsHistory();

    // Auto-advance to Putaway view to put away returned part
    setTimeout(() => {
      this.showView('putaway');
    }, 700);
  }

  renderReturnsHistory() {
    const container = document.getElementById('mob-returns-history-container');
    if (!container) return;

    const list = window.wms.lineReturns || [];
    container.innerHTML = list.slice(0, 3).map(r => `
      <div class="mob-task-card" style="border-left: 3px solid #ef4444; margin-bottom:8px;">
        <div class="mob-task-card-header" style="display:flex; justify-content:space-between;">
          <strong style="color:#0f172a; font-size:12px;">${r.returnId}</strong>
          <span class="wms-badge badge-pending" style="background:#fef2f2; color:#b91c1c; font-weight:800; padding:2px 6px; border-radius:4px;">${r.reason}</span>
        </div>
        <div style="font-size:11px; line-height:1.6; color:#334155; margin-top:4px;">
          <div>From: <strong>${r.lineId}</strong> | Part: <strong>${r.materialCode} (${r.quantity} EA)</strong></div>
          <div>Assigned Putaway Bin: <strong style="color:#b91c1c;">${r.targetBin}</strong></div>
        </div>
      </div>
    `).join('');
  }

  // H10: Label Reprinting & Zebra ZPL Simulator
  onReprintTypeChange() {
    const type = document.getElementById('mob-rep-type')?.value;
    const input = document.getElementById('mob-rep-code');
    if (!input) return;

    if (type === 'HU') input.value = 'HU-HND-2026-009801';
    else if (type === 'BIN') input.value = 'RM-A03-R04-S02-B05';
    else if (type === 'PICK_SLIP') input.value = 'PL-HND-2026-00129';
    else if (type === 'MRN_COPY') input.value = 'MRN-HND-2026-80912';
  }

  triggerScanReprint() {
    this.playBeep('normal');
    this.showToast('Barcode Scanned into Reprint Field', 'info', '📷');
  }

  executeLabelReprint() {
    const type = document.getElementById('mob-rep-type')?.value || 'HU';
    const code = document.getElementById('mob-rep-code')?.value.trim() || 'HU-HND-2026-009801';
    const printer = document.getElementById('mob-rep-printer')?.value || 'PRN-DOCK-01';
    const reason = document.getElementById('mob-rep-reason')?.value || 'DAMAGED_STICKER';

    const logId = `REP-LOG-${Math.floor(100 + Math.random() * 900)}`;
    if (!window.wms.reprintLogs) window.wms.reprintLogs = [];
    window.wms.reprintLogs.unshift({
      logId,
      labelType: type,
      code,
      printer,
      reason,
      requestedBy: this.activeUser?.name || 'Sanjay Verma',
      timestamp: new Date().toLocaleTimeString()
    });

    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`ZPL Print Job Sent to ${printer} for ${code}`, 'success', '🖨️');
    this.renderReprintHistory();
  }

  renderReprintHistory() {
    const container = document.getElementById('mob-reprint-history-container');
    if (!container) return;

    const list = window.wms.reprintLogs || [];
    container.innerHTML = list.slice(0, 3).map(l => `
      <div class="mob-task-card" style="border-left: 3px solid #64748b; margin-bottom:8px;">
        <div class="mob-task-card-header" style="display:flex; justify-content:space-between;">
          <strong style="color:#0f172a; font-size:12px;">${l.code} (${l.labelType})</strong>
          <span class="wms-badge" style="background:#f1f5f9; color:#475569; font-weight:800; padding:2px 6px; border-radius:4px;">${l.printer}</span>
        </div>
        <div style="font-size:11px; color:#334155; margin-top:4px;">
          <div>Reason: <strong>${l.reason}</strong></div>
          <div>User: ${l.requestedBy} • Time: ${l.timestamp}</div>
        </div>
      </div>
    `).join('');
  }

  showPickSlipPreview(pickNo, line, part, qty, bin) {
    const content = document.getElementById('hu-label-content');
    const barcodeText = document.getElementById('hu-label-barcode-text');
    if (barcodeText) barcodeText.textContent = pickNo;

    if (content) {
      content.innerHTML = `
        <div style="font-size:12px; font-weight:800; text-align:center; margin-bottom:6px; color:#1e293b;">HONDA HMSI PICK / ISSUE SLIP</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span><strong>PICK LIST:</strong> ${pickNo}</span>
          <span><strong>LINE:</strong> ${line}</span>
        </div>
        <div style="margin-bottom:4px;"><strong>MATERIAL:</strong> ${part}</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span><strong>QTY:</strong> ${qty} EA</span>
          <span><strong>SOURCE BIN:</strong> ${bin}</span>
        </div>
        <div style="font-size:10px; color:#64748b; margin-top:6px;">Strict FIFO Rule Applied • Move to Line Staging Point</div>
      `;
    }
    const modal = document.getElementById('hu-label-modal');
    if (modal) modal.classList.add('active');
  }

  renderHULabelBoxCarousel() {
    if (!this.activeBoxesList || !this.activeBoxesList.length) return;
    const totalBoxes = this.activeBoxesList.length;

    const indEl = document.getElementById('hu-label-box-indicator');
    if (indEl) indEl.textContent = `All ${totalBoxes} Boxes • Scroll down to review`;

    const container = document.getElementById('hu-labels-scroll-container');
    if (container) {
      container.innerHTML = this.activeBoxesList.map(box => `
        <div style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:8px; padding:10px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #cbd5e1; padding-bottom:4px; margin-bottom:6px;">
            <strong style="color:#0f172a; font-size:12px;">📦 BOX ${box.boxIndex} OF ${box.totalBoxes}</strong>
            <span style="font-size:10px; font-weight:800; background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:4px;">${box.qty} EA</span>
          </div>
          
          <div style="font-family:'JetBrains Mono',monospace; font-size:10.5px; line-height:1.6; color:#334155;">
            <div style="display:flex; justify-content:space-between;">
              <span><strong>PART NO:</strong> ${box.partNo}</span>
              <span><strong>QTY:</strong> ${box.qty} EA</span>
            </div>
            <div><strong>DESC:</strong> ${box.partDesc}</div>
            <div style="display:flex; justify-content:space-between;">
              <span><strong>LOT NO:</strong> ${box.lotNo}</span>
              <span><strong>VENDOR:</strong> ${box.supplier}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span><strong>PLANT:</strong> HMSI Narsapur P1</span>
              <span><strong>DATE:</strong> ${new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div style="background:#f8fafc; border:1px dashed #94a3b8; border-radius:6px; padding:6px; text-align:center; margin-top:6px;">
            <div style="font-size:18px; letter-spacing:3px; font-family:'JetBrains Mono',monospace; font-weight:900; color:#0f172a;">||||| | |||| ||| |||| | |||</div>
            <div style="font-size:10.5px; font-weight:800; color:#0284c7; font-family:'JetBrains Mono',monospace;">${box.huNumber}</div>
          </div>
        </div>
      `).join('');
    }

    const modal = document.getElementById('hu-label-modal');
    if (modal) modal.classList.add('active');
  }

  printSingleBoxAlert(huNumber, boxIdx) {
    this.playBeep('success');
    this.showToast(`Label for Box ${boxIdx} (${huNumber}) sent to Zebra ZT411`, 'success', '🖨️');
  }

  printAllHULabelsAlert() {
    const total = this.activeBoxesList?.length || 1;
    this.playBeep('success');
    this.showToast(`Batch Print Sent: All ${total} Box Labels generated on Zebra ZT411`, 'success', '🖨️');
    this.closeHULabelModal();
  }

  showHULabelPreview(huNumber, partNo, partDesc, qty, supplier, grn) {
    this.activeBoxesList = [{
      boxIndex: 1,
      totalBoxes: 1,
      huNumber,
      partNo,
      partDesc,
      qty,
      lotNo: 'BAT-KEI-2026-09-25-01',
      supplier,
      grn
    }];
    this.currentBoxIndex = 0;
    this.renderHULabelBoxCarousel();
  }

  closeHULabelModal() {
    const modal = document.getElementById('hu-label-modal');
    if (modal) modal.classList.remove('active');
  }

  printHULabelAlert() {
    this.playBeep('success');
    this.showToast('ZPL Label Sent to Zebra ZT411 Dock Printer', 'success', '🖨️');
    this.closeHULabelModal();
  }

  showFIFOException(scannedHU, oldestHU) {
    const modal = document.getElementById('fifo-warning-modal');
    const textEl = document.getElementById('fifo-warning-text');

    if (textEl) {
      textEl.innerHTML = `
        <h3 style="color:#ef4444; font-size:15px; margin-bottom:8px;">⛔ HONDA STRICT FIFO VIOLATION</h3>
        <p style="font-size:12px; line-height:1.6; color:#cbd5e1;">
          You scanned <strong>${scannedHU.huNumber}</strong> (Batch: ${scannedHU.batch} • FIFO Priority P${scannedHU.fifoPriority}).<br><br>
          An older batch exists: <strong style="color:#60a5fa;">${oldestHU.huNumber}</strong> (Batch: ${oldestHU.batch} • FIFO Priority P1) at bin <strong style="color:#38bdf8;">${oldestHU.location}</strong>.
        </p>
      `;
    }

    if (modal) modal.classList.add('active');
  }

  closeFIFOException() {
    const modal = document.getElementById('fifo-warning-modal');
    if (modal) modal.classList.remove('active');
  }

  supervisorOverrideFIFO() {
    const pin = prompt('Enter 4-Digit Supervisor FIFO Override PIN:');
    if (pin === '9942' || pin === '1004') {
      this.playBeep('normal');
      this.showToast('Supervisor Bypass Authorized (Audit Logged)', 'info', '🔑');
      this.closeFIFOException();
    } else if (pin) {
      this.playBeep('error');
      this.showToast('Invalid Supervisor PIN', 'error', '⛔');
    }
  }

  playBeep(type = 'normal') {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'normal') {
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'error') {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) { }
  }

  showToast(msg, type = 'success', icon = '✅') {
    const toast = document.getElementById('mob-toast');
    const msgEl = document.getElementById('mob-toast-msg');
    const iconEl = document.getElementById('mob-toast-icon');
    if (!toast) return;

    toast.className = `mob-toast ${type}`;
    if (msgEl) msgEl.textContent = msg;
    if (iconEl) iconEl.textContent = icon;

    toast.classList.add('show');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
}

// Global instance initialization
window.mob = new MobileWMSApp();

document.addEventListener('DOMContentLoaded', () => {
  if (window.mob) {
    window.mob.init();
  }
});
