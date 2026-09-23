// HONDA MOTORCYCLE & SCOOTER INDIA (HMSI) - WMS MOBILE HANDHELD SCANNER APP
// Zebra TC57 / TC26 / Android Industrial Warehouse Terminal Execution Engine

window.wms = loadWMSState();

class MobileWMSApp {
  constructor() {
    this.currentView = 'login';
    this.taskCategory = 'inbound';
    this.scannedHU = null;
    this.activeRole = localStorage.getItem('HONDA_MOB_ACTIVE_ROLE') || null;
  }

  init() {
    if (this.activeRole) {
      this.applyRoleUI(this.activeRole);
    } else {
      this.logout();
    }
  }

  login(role) {
    this.activeRole = role;
    localStorage.setItem('HONDA_MOB_ACTIVE_ROLE', role);
    this.playBeep('success');
    this.applyRoleUI(role);
  }

  logout() {
    this.activeRole = null;
    localStorage.removeItem('HONDA_MOB_ACTIVE_ROLE');
    this.playBeep('normal');
    
    // Hide header logout button and bottom nav on login screen
    const logoutBtn = document.getElementById('mob-header-logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';

    const userTag = document.getElementById('mob-header-user-tag');
    if (userTag) userTag.style.display = 'none';

    const roleTitle = document.getElementById('mob-header-role-title');
    if (roleTitle) roleTitle.textContent = 'TERMINAL';

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
    this.currentView = 'login';
  }

  applyRoleUI(role) {
    const logoutBtn = document.getElementById('mob-header-logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'block';

    const userTag = document.getElementById('mob-header-user-tag');
    if (userTag) userTag.style.display = 'inline-block';

    const bottomNav = document.querySelector('.mobile-bottom-nav');
    const roleTitle = document.getElementById('mob-header-role-title');
    const headerIcon = document.getElementById('mob-header-icon');

    // Get all nav items
    const navHome = document.querySelector('.mob-nav-item[data-view="home"]');
    const navGate = document.querySelector('.mob-nav-item[data-view="gate"]');
    const navInbound = document.querySelector('.mob-nav-item[data-view="tasks"]');
    const navScan = document.querySelector('.mob-nav-item[data-view="scan"]');
    const navStock = document.querySelector('.mob-nav-item[data-view="inventory"]');
    const navMore = document.querySelector('.mob-nav-item[data-view="more"]');

    // 1. SECURITY OFFICER ROLE (Only Gate Screen, no warehouse/putaway clutter)
    if (role === 'SECURITY_OFFICER') {
      if (roleTitle) roleTitle.textContent = 'GATE PASS';
      if (userTag) userTag.textContent = 'Security Gate 02';
      if (headerIcon) headerIcon.textContent = '👮';
      if (bottomNav) bottomNav.style.display = 'none'; // Dedicated full-screen gate interface
      this.showView('gate');
    } 
    // 2. LINE SUPERVISOR ROLE (Only MR Shopfloor Requisition, no gate/putaway clutter)
    else if (role === 'LINE_SUPERVISOR') {
      if (roleTitle) roleTitle.textContent = 'KANBAN MR';
      if (userTag) userTag.textContent = 'Line 1 Leader';
      if (headerIcon) headerIcon.textContent = '🏭';
      if (bottomNav) bottomNav.style.display = 'none'; // Dedicated full-screen line requisition interface
      this.showView('mr');
      this.renderShopfloorMRHistory();
    } 
    // 3. FORKLIFT / REACH TRUCK DRIVER (Only Putaway Tasks & Storage Strategy)
    else if (role === 'FORKLIFT_DRIVER') {
      if (roleTitle) roleTitle.textContent = 'PUTAWAY';
      if (userTag) userTag.textContent = 'Forklift 03';
      if (headerIcon) headerIcon.textContent = '🚜';
      if (bottomNav) bottomNav.style.display = 'flex';
      if (navHome) navHome.style.display = 'none';
      if (navGate) navGate.style.display = 'none';
      if (navInbound) navInbound.style.display = 'flex';
      if (navScan) navScan.style.display = 'flex';
      if (navStock) navStock.style.display = 'flex';
      if (navMore) navMore.style.display = 'none';
      this.showTasksTab('putaway');
    } 
    // 4. WAREHOUSE OPERATOR (Full Warehouse Terminal)
    else { 
      if (roleTitle) roleTitle.textContent = 'HMSI WH';
      if (userTag) userTag.textContent = 'Op 01';
      if (headerIcon) headerIcon.textContent = '👷';
      if (bottomNav) bottomNav.style.display = 'flex';
      if (navHome) navHome.style.display = 'flex';
      if (navGate) navGate.style.display = 'none'; // Gate is handled by security
      if (navInbound) navInbound.style.display = 'flex';
      if (navScan) navScan.style.display = 'flex';
      if (navStock) navStock.style.display = 'flex';
      if (navMore) navMore.style.display = 'flex';
      this.showView('home');
    }
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
    if (viewId === 'tasks') this.renderTaskList();
    if (viewId === 'inventory') this.renderMobileInventory();
    if (viewId === 'transfers') this.renderMobileTransfers();
  }

  renderMobileTransfers() {
    const container = document.getElementById('mob-transfers-list-container');
    if (!container) return;

    const list = window.wms.stockTransfers || window.wms.interPlantTransfers || [];

    if (!list.length) {
      container.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px;">No active inter-plant transfers.</div>`;
      return;
    }

    container.innerHTML = list.map(tr => {
      const trId = tr.transferOrderNo || tr.transferId || 'TR-HND-2026-001';
      const from = tr.sourcePlant || tr.fromPlant || 'HMSI Narsapur Plant 1';
      const to = tr.destinationPlant || tr.toPlant || 'HMSI Narsapur Plant 2';
      const isTransit = (tr.status || '').includes('Transit');

      return `
        <div class="mob-task-card" style="border-left: 3px solid #a855f7;">
          <div class="mob-task-card-header">
            <span class="mob-task-id">${trId}</span>
            <span class="mob-task-badge" style="background:#3b0764; color:#d8b4fe;">${tr.status}</span>
          </div>
          <div class="mob-task-details">
            <span>Part: <strong>${tr.materialCode}</strong></span>
            <span>Qty: <strong>${tr.quantity} ${tr.uom || 'EA'}</strong></span>
          </div>
          <div class="mob-task-locations">
            <span>${from}</span>
            <span>➔</span>
            <span>${to}</span>
          </div>
          ${isTransit ? `
            <button class="btn-mob-action success" style="margin-top:8px; padding:8px; font-size:11px; width:100%;" onclick="mob.receiveTransfer('${trId}')">
              📥 Scan & Receive Pallet at Destination Dock
            </button>
          ` : `
            <div style="font-size:11px; color:#10b981; font-weight:700; margin-top:6px;">✓ Received & Stored in Warehouse</div>
          `}
        </div>
      `;
    }).join('');
  }

  dispatchTransfer() {
    const route = document.getElementById('mob-tr-route')?.value || 'P1_TO_P2';
    const partCode = document.getElementById('mob-tr-part')?.value || 'HND-ECU-KEIHIN-01';
    const qty = parseInt(document.getElementById('mob-tr-qty')?.value || '50', 10);

    const fromPlant = route === 'P1_TO_P2' ? 'HMSI Narsapur Plant 1' : 'HMSI Narsapur Plant 2';
    const toPlant = route === 'P1_TO_P2' ? 'HMSI Narsapur Plant 2' : 'HMSI Narsapur Plant 1';

    const newTR = {
      transferOrderNo: `STO-HND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      transferId: `TR-HND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      sourcePlant: fromPlant,
      sourceLocation: fromPlant.includes('Plant 1') ? 'RM-WH-01' : 'RM-WH-02',
      destinationPlant: toPlant,
      destinationLocation: toPlant.includes('Plant 1') ? 'RM-WH-01' : 'RM-WH-02',
      fromPlant,
      toPlant,
      materialCode: partCode,
      quantity: qty,
      uom: 'EA',
      driver: 'Inter-Plant Shuttle Driver',
      vehicleNo: 'KA-04-H-8821',
      dispatchTime: new Date().toLocaleTimeString(),
      status: 'In-Transit (Truck KA-04-H-8821)'
    };

    if (!window.wms.stockTransfers) window.wms.stockTransfers = [];
    window.wms.stockTransfers.unshift(newTR);
    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`Transfer Dispatched: ${newTR.transferOrderNo} ➔ ${toPlant}`, 'success', '🚚');
    this.renderMobileTransfers();
  }

  receiveTransfer(trId) {
    const list = window.wms.stockTransfers || window.wms.interPlantTransfers || [];
    const tr = list.find(t => t.transferOrderNo === trId || t.transferId === trId);
    if (!tr) return;

    tr.status = 'Received & Staged';
    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`Transfer ${trId} Received & Staged`, 'success', '✅');
    this.renderMobileTransfers();
  }

  showTasksTab(category = 'inbound') {
    this.taskCategory = category;
    this.showView('tasks');
    this.setTaskCategory(category);
  }

  setTaskCategory(category) {
    this.taskCategory = category;
    ['inbound', 'putaway', 'picking'].forEach(c => {
      const btn = document.getElementById(`tab-btn-${c}`);
      if (btn) {
        btn.style.background = (c === category) ? '#2563eb' : '#334155';
      }
    });
    this.renderTaskList();
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
    } catch (e) {}
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

  onPutawayAreaChange() {
    const area = document.getElementById('mob-put-area')?.value;
    const zoneSelect = document.getElementById('mob-put-zone');
    if (!zoneSelect) return;

    if (area === 'RM-WH-02') {
      zoneSelect.innerHTML = `
        <option value="ZONE-P2-MC">Zone P2 - Motorcycle Powertrain</option>
        <option value="ZONE-P2-VNA">Zone P2 - High-Bay VNA Racks</option>
      `;
    } else {
      zoneSelect.innerHTML = `
        <option value="ZONE-A-PWR">Zone A - Powertrain & Throttle</option>
        <option value="ZONE-B-ELE">Zone B - Electronics & ECUs</option>
        <option value="ZONE-C-SUS">Zone C - Chassis & Suspension</option>
        <option value="ZONE-D-TYR">Zone D - Tyres & Belts</option>
      `;
    }
    this.onPutawayZoneChange();
  }

  onPutawayZoneChange() {
    const zone = document.getElementById('mob-put-zone')?.value;
    const binSelect = document.getElementById('mob-put-bin');
    if (!binSelect) return;

    if (zone === 'ZONE-A-PWR') {
      binSelect.innerHTML = `
        <option value="RM-A03-R04-S02-B05">RM-A03-R04-S02-B05 (Rack 04 • Shelf 02)</option>
        <option value="RM-A02-R02-S01-B02">RM-A02-R02-S01-B02 (Rack 02 • Shelf 01)</option>
        <option value="RM-A01-R01-S01-B01">RM-A01-R01-S01-B01 (Rack 01 • Shelf 01)</option>
      `;
    } else if (zone === 'ZONE-B-ELE') {
      binSelect.innerHTML = `
        <option value="RM-B02-R01-S01-B01">RM-B02-R01-S01-B01 (ESD Rack 01 • Shelf 01)</option>
        <option value="RM-B01-R02-S01-B01">RM-B01-R02-S01-B01 (ESD Rack 02 • Shelf 01)</option>
      `;
    } else if (zone === 'ZONE-C-SUS') {
      binSelect.innerHTML = `
        <option value="RM-C01-R01-S01-B01">RM-C01-R01-S01-B01 (Heavy Rack 01 • Shelf 01)</option>
      `;
    } else if (zone === 'ZONE-D-TYR') {
      binSelect.innerHTML = `
        <option value="RM-D01-R01-S01-B01">RM-D01-R01-S01-B01 (Pallet Floor 01)</option>
      `;
    } else {
      binSelect.innerHTML = `
        <option value="P2-RM-A01-B01">P2-RM-A01-B01 (Plant 2 High-Bay 01)</option>
        <option value="P2-RM-01">P2-RM-01 (Plant 2 Raw Material Staging)</option>
      `;
    }
  }

  onRoleChange(role) {
    this.activeRole = role;
    const badge = document.getElementById('mob-role-badge');
    const name = document.getElementById('mob-user-name');
    const meta = document.getElementById('mob-user-meta');
    const icon = document.getElementById('mob-role-icon');

    if (role === 'SECURITY_OFFICER') {
      if (badge) badge.textContent = 'Security Gate Officer';
      if (name) name.textContent = 'Ramesh Gowda (Security Gate 02)';
      if (meta) meta.textContent = 'Plant 1 North Gate • Vehicle Inward Register';
      if (icon) icon.textContent = '👮';
      this.showView('gate');
    } else if (role === 'LINE_SUPERVISOR') {
      if (badge) badge.textContent = 'Assembly Line Supervisor';
      if (name) name.textContent = 'Anand Murthy (Line 1 Leader)';
      if (meta) meta.textContent = 'Plant 1 • Activa 6G Powertrain Assembly';
      if (icon) icon.textContent = '🏭';
      this.showView('mr');
      this.renderShopfloorMRHistory();
    } else if (role === 'FORKLIFT_DRIVER') {
      if (badge) badge.textContent = 'Reach Truck / Forklift Driver';
      if (name) name.textContent = 'Vikram Patil (Forklift 03)';
      if (meta) meta.textContent = 'High-Rack Aisles A01–A06 • Putaway Strategy';
      if (icon) icon.textContent = '🚜';
      this.showTasksTab('putaway');
    } else {
      if (badge) badge.textContent = 'Warehouse Operator';
      if (name) name.textContent = 'Sanjay Verma (Op 01)';
      if (meta) meta.textContent = 'HMSI Plant 1 • Raw Material Warehouse RM-WH-01';
      if (icon) icon.textContent = '👷';
      this.showView('home');
    }
  }

  submitShopfloorMR() {
    const line = document.getElementById('mob-mr-line')?.value || 'Line 1 (Activa 6G)';
    const partCode = document.getElementById('mob-mr-part')?.value || 'HND-THROT-KEIHIN';
    const qty = parseInt(document.getElementById('mob-mr-qty')?.value || '80', 10);
    const staging = document.getElementById('mob-mr-staging')?.value || 'STG-P1-L1';

    const mat = window.wms.materials.find(m => m.code === partCode);
    const desc = mat ? mat.description : 'Honda Genuine Component';

    const newMR = {
      mrNumber: `MR-HND-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      productionLine: line,
      plant: line.includes('Plant 2') || line.includes('CB350') ? 'HMSI Narsapur Plant 2' : 'HMSI Narsapur Plant 1',
      materialCode: partCode,
      materialDescription: desc,
      requiredQuantity: qty,
      uom: 'EA',
      requestedBy: 'Anand Murthy (Shopfloor Mobile)',
      requestTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stagingLocation: staging,
      status: 'Open'
    };

    window.wms.materialRequisitions.unshift(newMR);
    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`MR Created: ${newMR.mrNumber} (${qty} EA ➔ ${staging})`, 'success', '⚡');
    this.renderShopfloorMRHistory();
  }

  renderShopfloorMRHistory() {
    const container = document.getElementById('mob-mr-history-container');
    if (!container) return;

    container.innerHTML = window.wms.materialRequisitions.slice(0, 2).map(mr => {
      const isDelivered = mr.status === 'Pick List Created' || mr.status === 'Completed' || mr.status === 'FIFO Allocated' || mr.status === 'Delivered';
      const isConsumed = mr.status === 'Consumed';

      return `
        <div class="mob-task-card" style="border-left: 3px solid ${isConsumed ? '#10b981' : '#7e22ce'};">
          <div class="mob-task-card-header">
            <span class="mob-task-id">${mr.mrNumber}</span>
            <span class="mob-task-badge" style="background:${isConsumed ? '#064e3b' : '#581c87'}; color:${isConsumed ? '#6ee7b7' : '#d8b4fe'};">${mr.status}</span>
          </div>
          <div class="mob-task-details">
            <span>Part: <strong>${mr.materialCode}</strong></span>
            <span>Qty: <strong>${mr.requiredQuantity} ${mr.uom}</strong></span>
          </div>
          <div class="mob-task-locations">
            <span>${mr.productionLine}</span>
            <span>➔</span>
            <span>${mr.stagingLocation || 'STG-P1-L1'}</span>
          </div>
          ${!isConsumed ? `
            <button class="btn-mob-action success" style="margin-top:8px; padding:7px; font-size:11px; width:100%; font-weight:700;" onclick="mob.acknowledgeMRDelivery('${mr.mrNumber}')">
              ✅ Acknowledge
            </button>
          ` : `
            <div style="font-size:11px; color:#10b981; font-weight:700; margin-top:6px;">✓ Consumed into Assembly</div>
          `}
        </div>
      `;
    }).join('');
  }

  acknowledgeMRDelivery(mrNumber) {
    const mr = window.wms.materialRequisitions.find(m => m.mrNumber === mrNumber);
    if (!mr) return;

    mr.status = 'Consumed';
    
    // Also record in Line Supply Delivery
    window.wms.lineSupplyRequests.unshift({
      lsrNumber: `LSR-HND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      plant: mr.plant || 'HMSI Narsapur Plant 1',
      productionLine: mr.productionLine,
      materialCode: mr.materialCode,
      materialDescription: mr.materialDescription,
      deliveredQuantity: mr.requiredQuantity,
      uom: mr.uom,
      stagingLocation: mr.stagingLocation || 'STG-P1-L1',
      lineReceiver: 'Anand Murthy (Line 1 Leader)',
      deliveryTimestamp: new Date().toLocaleTimeString(),
      status: 'Acknowledged & Consumed into Assembly'
    });

    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`MR ${mrNumber} Consumed into Line Assembly`, 'success', '🎉');
    this.renderShopfloorMRHistory();
  }

  // Mobile Gate Inward Module
  quickFillSampleVehicle() {
    const sampleVehicles = ['KA-01-AB-4821', 'KA-04-H-8821', 'KA-07-M-1829', 'KA-53-Z-9912', 'KA-02-C-5519'];
    const chosen = sampleVehicles[Math.floor(Math.random() * sampleVehicles.length)];
    const el = document.getElementById('mob-ge-vehicle');
    if (el) el.value = chosen;
  }

  submitMobileGateEntry() {
    const vehicle = document.getElementById('mob-ge-vehicle')?.value.trim();
    const supplier = document.getElementById('mob-ge-supplier')?.value;
    const po = document.getElementById('mob-ge-po')?.value;
    const dock = document.getElementById('mob-ge-dock')?.value;
    const qty = parseInt(document.getElementById('mob-ge-qty')?.value || '500', 10);

    if (!vehicle) {
      this.playBeep('error');
      this.showToast('Please enter or scan vehicle number', 'error', '⚠️');
      return;
    }

    const newGE = {
      gateEntryNo: `GE-HND-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleNo: vehicle,
      supplier,
      poNumber: po,
      asnNumber: `ASN-HND-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      driverName: 'Verified Driver',
      driverContact: '+91 98450 00000',
      arrivalTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plant: 'HMSI Narsapur Plant 1',
      gate: 'Security Gate 02 (North)',
      dock,
      expectedHUs: Math.ceil(qty / 100),
      expectedQty: qty,
      receivedHUs: 0,
      receivedQty: 0,
      status: 'Dock Assigned'
    };

    window.wms.gateEntries.unshift(newGE);
    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`Gate Inward Registered: ${vehicle} ➔ ${dock}`, 'success', '🚚');
    this.renderMobileGateQueue();
    this.renderHome();
  }

  renderMobileGateQueue() {
    const container = document.getElementById('mob-gate-queue-container');
    if (!container) return;

    container.innerHTML = window.wms.gateEntries.slice(0, 2).map(ge => `
      <div class="mob-task-card" style="border-left: 3px solid #10b981;">
        <div class="mob-task-card-header">
          <span class="mob-task-id">${ge.vehicleNo}</span>
          <span class="mob-task-badge" style="background:#0f172a; color:#34d399;">${ge.status}</span>
        </div>
        <div class="mob-task-details">
          <span>Supplier: <strong>${ge.supplier}</strong></span>
        </div>
        <div class="mob-task-locations">
          <span>Pass: ${ge.gateEntryNo}</span>
          <span>➔</span>
          <span>${ge.dock}</span>
        </div>
      </div>
    `).join('');
  }

  // Inbound Dock Receiving Execution from Mobile
  executeMobileInboundReceive(dockId, geNo) {
    const ge = window.wms.gateEntries.find(g => g.gateEntryNo === geNo) || window.wms.gateEntries[0];
    if (!ge) return;

    this.playBeep('success');
    ge.status = 'Receiving In Progress';
    ge.receivedHUs = ge.expectedHUs || 5;
    ge.receivedQty = ge.expectedQty || 500;

    // Create GRN
    const grnNo = `GRN-HND-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    window.wms.goodsReceiptNotes.unshift({
      grnNumber: grnNo,
      poNumber: ge.poNumber,
      supplier: ge.supplier,
      receivedHUs: ge.receivedHUs,
      acceptedQuantity: ge.receivedQty,
      uom: 'EA',
      status: 'Posted to SAP ERP',
      receiptTimestamp: new Date().toLocaleTimeString(),
      inspector: 'Sanjay Verma (Zebra Scanner #04)'
    });

    // Create Handling Unit (HU)
    const newTaskId = `PUT-HND-${Math.floor(100 + Math.random() * 900)}`;
    const newHU = `HU-HND-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    
    window.wms.handlingUnits.unshift({
      huNumber: newHU,
      materialCode: 'HND-THROT-KEIHIN',
      description: 'Throttle Body & Fuel Injector Sub-Assy (Activa 6G)',
      quantity: ge.receivedQty,
      uom: 'EA',
      location: `STAGING-${dockId.replace(/\s+/g, '-').toUpperCase()}`,
      status: 'READY_FOR_PUTAWAY',
      plant: ge.plant || 'HMSI Narsapur Plant 1',
      supplier: ge.supplier,
      batch: `BT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      mfgDate: '2026-09-23',
      fifoPriority: 1
    });

    // Create Putaway task
    window.wms.putawayTasks.unshift({
      taskId: newTaskId,
      huNumber: newHU,
      materialCode: 'HND-THROT-KEIHIN',
      quantity: ge.receivedQty,
      uom: 'EA',
      sourceLocation: ge.dock,
      suggestedLocation: 'RM-A03-R04-S02-B05',
      status: 'Open'
    });

    saveWMSState(window.wms);
    
    // Trigger HU Label Preview
    this.showHULabelPreview(newHU, 'HND-THROT-KEIHIN', 'Throttle Body & Fuel Injector Sub-Assy', ge.receivedQty, ge.supplier, grnNo);
    this.renderHome();
  }

  showHULabelPreview(huNumber, partNo, partDesc, qty, supplier, grn) {
    const content = document.getElementById('hu-label-content');
    const barcodeText = document.getElementById('hu-label-barcode-text');
    if (barcodeText) barcodeText.textContent = huNumber;

    if (content) {
      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span><strong>PART NO:</strong> ${partNo}</span>
          <span><strong>QTY:</strong> ${qty} EA</span>
        </div>
        <div style="margin-bottom:4px;"><strong>DESC:</strong> ${partDesc}</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span><strong>VENDOR:</strong> ${supplier}</span>
          <span><strong>GRN:</strong> ${grn}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span><strong>PLANT:</strong> HMSI Narsapur P1</span>
          <span><strong>DATE:</strong> ${new Date().toLocaleDateString()}</span>
        </div>
      `;
    }
    const modal = document.getElementById('hu-label-modal');
    if (modal) modal.classList.add('active');
  }

  closeHULabelModal() {
    const modal = document.getElementById('hu-label-modal');
    if (modal) modal.classList.remove('active');
    this.setTaskCategory('putaway');
  }

  printHULabelAlert() {
    this.playBeep('success');
    this.showToast('ZPL Label Sent to Zebra ZT411 Dock Printer', 'success', '🖨️');
    this.closeHULabelModal();
  }

  openDiscrepancyModal(geNo) {
    this.activeDiscrepancyGE = window.wms.gateEntries.find(g => g.gateEntryNo === geNo) || window.wms.gateEntries[0];
    const headerMeta = document.getElementById('disc-header-meta');
    if (headerMeta && this.activeDiscrepancyGE) {
      headerMeta.innerHTML = `Flagging issue for <strong>${this.activeDiscrepancyGE.vehicleNo}</strong> (PO: ${this.activeDiscrepancyGE.poNumber}) from <strong>${this.activeDiscrepancyGE.supplier}</strong>`;
    }
    const modal = document.getElementById('discrepancy-modal');
    if (modal) modal.classList.add('active');
  }

  closeDiscrepancyModal() {
    const modal = document.getElementById('discrepancy-modal');
    if (modal) modal.classList.remove('active');
  }

  submitDiscrepancy() {
    const type = document.getElementById('disc-type')?.value;
    const shortQty = parseInt(document.getElementById('disc-qty')?.value || '20', 10);
    const goodQty = parseInt(document.getElementById('disc-good-qty')?.value || '480', 10);
    const remarks = document.getElementById('disc-remarks')?.value || 'Shortage/damage identified during unloading';

    if (!this.activeDiscrepancyGE) this.activeDiscrepancyGE = window.wms.gateEntries[0];

    // Create QC Quarantine Issue
    const issueId = `DISC-HND-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Add quarantine HU for damaged/short items
    const quarantineHU = `HU-QUAR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    window.wms.handlingUnits.unshift({
      huNumber: quarantineHU,
      materialCode: 'HND-THROT-KEIHIN',
      description: 'Throttle Body (DAMAGED/QUARANTINE)',
      quantity: shortQty,
      uom: 'EA',
      location: 'QC-REJECT-ZONE-01',
      status: 'DAMAGED',
      plant: 'HMSI Narsapur Plant 1',
      supplier: this.activeDiscrepancyGE?.supplier || 'Keihin India',
      batch: `REJ-BT-2026`,
      mfgDate: '2026-09-23',
      fifoPriority: 99
    });

    // Push to WMS Discrepancies Ledger
    if (!window.wms.discrepancies) window.wms.discrepancies = [];
    window.wms.discrepancies.unshift({
      issueId,
      vehicleNo: this.activeDiscrepancyGE?.vehicleNo || 'KA-01-AB-4821',
      poNumber: this.activeDiscrepancyGE?.poNumber || 'PO-HND-2026-00421',
      asnNumber: this.activeDiscrepancyGE?.asnNumber || 'ASN-HND-2026-00391',
      supplier: this.activeDiscrepancyGE?.supplier || 'Keihin India Electronics Pvt Ltd',
      materialCode: 'HND-THROT-KEIHIN',
      materialDescription: 'Keihin PGM-FI 26mm Throttle Body',
      expectedQty: (goodQty + shortQty),
      receivedGoodQty: goodQty,
      shortageDamagedQty: shortQty,
      uom: 'EA',
      discrepancyType: type || 'Truck Unload Shortage',
      quarantineBin: 'QC-REJECT-ZONE-01',
      status: 'Debit Note Issued & Supplier Notified',
      reportedBy: 'Sanjay Verma (Dock Handheld Scanner)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sapDebitNote: `SAP-DN-${Math.floor(9000000 + Math.random() * 900000)}`
    });

    // Update Gate Entry
    if (this.activeDiscrepancyGE) {
      this.activeDiscrepancyGE.status = `Discrepancy (${shortQty} EA Short/Damaged)`;
      this.activeDiscrepancyGE.receivedQty = goodQty;
    }

    saveWMSState(window.wms);
    this.playBeep('error');
    this.showToast(`Discrepancy Logged: -${shortQty} EA ➔ QC-REJECT-ZONE-01`, 'error', '⚠️');
    this.closeDiscrepancyModal();
    this.renderTaskList();
    this.renderHome();
  }

  // Scanner Simulator
  triggerScan(presetHu = 'HU-HND-2026-009801') {
    this.playBeep('normal');
    this.showView('scan');

    const hu = window.wms.handlingUnits.find(h => h.huNumber === presetHu) || window.wms.handlingUnits[0];
    this.scannedHU = hu;

    const resultBox = document.getElementById('mob-scan-result-card');
    if (resultBox && hu) {
      resultBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="font-size:16px; color:#fff;">${hu.huNumber}</strong>
          <span class="wms-badge badge-available">${hu.status}</span>
        </div>
        <div style="font-size:12px; line-height:1.6; color:#cbd5e1;">
          <div><strong>Honda Part:</strong> ${hu.materialCode}</div>
          <div><strong>Description:</strong> ${hu.description}</div>
          <div><strong>Quantity:</strong> ${hu.quantity} ${hu.uom}</div>
          <div><strong>Storage Bin:</strong> <code style="color:#60a5fa;">${hu.location}</code></div>
          <div><strong>Supplier:</strong> ${hu.supplier}</div>
          <div><strong>FIFO Priority:</strong> <span class="wms-badge badge-fifo-p${hu.fifoPriority || 3}">P${hu.fifoPriority || 'N/A'}</span> (Batch: ${hu.batch})</div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-top:14px;">
          <button class="btn-mob-action primary" onclick="mob.startMobilePutaway('${hu.huNumber}')">📦 Putaway</button>
          <button class="btn-mob-action success" onclick="mob.startMobilePicking('${hu.huNumber}')">🛒 Pick HU</button>
          <button class="btn-mob-action" style="background:#475569;" onclick="mob.startMobileTransfer('${hu.huNumber}')">🔄 Transfer</button>
          <button class="btn-mob-action" style="background:#dc2626;" onclick="mob.openExceptionModal('${hu.huNumber}')">⚠️ Exception</button>
        </div>
      `;
    }
  }

  startMobilePutaway(huNo) {
    const hu = window.wms.handlingUnits.find(h => h.huNumber === huNo) || window.wms.handlingUnits[0];
    if (!hu) return;

    this.activePutawayHU = hu;
    const huEl = document.getElementById('mob-put-hu');
    const matEl = document.getElementById('mob-put-mat');
    if (huEl) huEl.textContent = hu.huNumber;
    if (matEl) matEl.textContent = `${hu.materialCode} (${hu.quantity} ${hu.uom || 'EA'})`;

    const modal = document.getElementById('putaway-confirm-modal');
    if (modal) modal.classList.add('active');
    this.onPutawayAreaChange();
  }

  closePutawayModal() {
    const modal = document.getElementById('putaway-confirm-modal');
    if (modal) modal.classList.remove('active');
  }

  confirmPutawayLocation() {
    if (!this.activePutawayHU) this.activePutawayHU = window.wms.handlingUnits[0];
    const area = document.getElementById('mob-put-area')?.value || 'RM-WH-01';
    const zone = document.getElementById('mob-put-zone')?.value || 'ZONE-A-PWR';
    const targetBin = document.getElementById('mob-put-bin')?.value || 'RM-A03-R04-S02-B05';

    if (this.activePutawayHU) {
      this.activePutawayHU.location = targetBin;
      this.activePutawayHU.status = 'AVAILABLE';
      
      // Complete matching putaway task
      const task = window.wms.putawayTasks.find(t => t.huNumber === this.activePutawayHU.huNumber && t.status === 'Open');
      if (task) {
        task.status = 'Completed';
        task.suggestedLocation = targetBin;
      }

      saveWMSState(window.wms);
      this.playBeep('success');
      this.showToast(`Putaway Confirmed: ${this.activePutawayHU.huNumber} ➔ ${targetBin}`, 'success', '📦');
      this.closePutawayModal();
      this.renderTaskList();
      this.renderHome();
    }
  }

  startMobilePicking(huNo) {
    const hu = window.wms.handlingUnits.find(h => h.huNumber === huNo);
    if (!hu) return;

    // Check FIFO violation
    if (hu.fifoPriority && hu.fifoPriority > 1) {
      this.playBeep('error');
      const p1HU = window.wms.handlingUnits.find(h => h.materialCode === hu.materialCode && h.fifoPriority === 1 && h.status === 'AVAILABLE');
      if (p1HU) {
        this.showFIFOException(hu, p1HU);
        return;
      }
    }

    this.playBeep('success');
    hu.status = 'ALLOCATED';
    hu.location = 'STG-P1-L1';
    saveWMSState(window.wms);
    this.showToast(`Pick Success: ${huNo} moved to STG-P1-L1`, 'success', '🛒');
    this.renderTaskList();
    this.showView('home');
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
    this.triggerScan('HU-HND-2026-009801');
  }

  supervisorOverrideFIFO() {
    const modal = document.getElementById('supervisor-pin-modal');
    if (modal) modal.classList.add('active');
  }

  closeSupervisorModal() {
    const modal = document.getElementById('supervisor-pin-modal');
    if (modal) modal.classList.remove('active');
  }

  confirmSupervisorOverride() {
    const pin = document.getElementById('supervisor-pin-input')?.value;
    if (pin === '9942' || pin) {
      this.playBeep('normal');
      this.showToast('Supervisor Override Authorized: Logged in Audit Trail', 'info', '🔑');
      this.closeSupervisorModal();
      const fifoModal = document.getElementById('fifo-warning-modal');
      if (fifoModal) fifoModal.classList.remove('active');
      this.showView('tasks');
    }
  }

  startMobileTransfer(huNo) {
    const hu = window.wms.handlingUnits.find(h => h.huNumber === huNo);
    if (hu) {
      hu.location = 'STG-P1-L2';
      saveWMSState(window.wms);
      this.playBeep('success');
      this.showToast(`Transfer Complete: ${huNo} staged at STG-P1-L2`, 'success', '🔄');
      this.showView('inventory');
    }
  }

  openExceptionModal(huNo) {
    const hu = window.wms.handlingUnits.find(h => h.huNumber === huNo);
    if (hu) {
      hu.status = 'QUALITY HOLD';
      hu.location = 'QC-HOLD-01';
      saveWMSState(window.wms);
      this.playBeep('error');
      this.showToast(`Quality Hold: ${huNo} moved to QC-HOLD-01`, 'error', '⚠️');
      this.showView('tasks');
    }
  }

  renderTaskList() {
    const container = document.getElementById('mob-task-list-container');
    if (!container) return;

    // Update pill counts
    const countInbound = document.getElementById('count-pill-inbound');
    const countPutaway = document.getElementById('count-pill-putaway');
    const countPicking = document.getElementById('count-pill-picking');
    if (countInbound) countInbound.textContent = window.wms.gateEntries.length.toString();
    if (countPutaway) countPutaway.textContent = window.wms.putawayTasks.filter(t => t.status === 'Open').length.toString();
    if (countPicking) countPicking.textContent = window.wms.pickLists.length.toString();

    // 1. INBOUND RECEIVING TASKS
    if (this.taskCategory === 'inbound') {
      const list = window.wms.gateEntries.slice(0, 2);
      if (!list.length) {
        container.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px;">No pending inbound receiving tasks.</div>`;
        return;
      }
      container.innerHTML = list.map(ge => `
        <div class="mob-task-card" style="border-left: 3px solid #2563eb;">
          <div class="mob-task-card-header">
            <span class="mob-task-id">🚚 ${ge.vehicleNo}</span>
            <span class="mob-task-badge" style="background:#1e3a8a; color:#93c5fd;">${ge.dock}</span>
          </div>
          <div class="mob-task-details">
            <span>Supplier: <strong>${ge.supplier}</strong></span>
            <span>PO: <strong>${ge.poNumber}</strong></span>
          </div>
          <div class="mob-task-locations">
            <span>Exp: ${ge.expectedHUs} HUs (${ge.expectedQty} EA)</span>
            <span>Status: <strong>${ge.status}</strong></span>
          </div>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button class="btn-mob-action primary" style="flex:2; padding:8px; font-size:11px;" onclick="mob.executeMobileInboundReceive('${ge.dock}', '${ge.gateEntryNo}')">
              📥 Receive & Print
            </button>
            <button class="btn-mob-action" style="flex:1; background:#dc2626; padding:8px; font-size:11px;" onclick="mob.openDiscrepancyModal('${ge.gateEntryNo}')">
              ⚠️ Short
            </button>
          </div>
        </div>
      `).join('');
      return;
    }

    // 2. PUTAWAY TASKS
    if (this.taskCategory === 'putaway') {
      const openPutaways = window.wms.putawayTasks.filter(t => t.status === 'Open').slice(0, 2);
      if (!openPutaways.length) {
        container.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px;">All putaway tasks completed!</div>`;
        return;
      }
      container.innerHTML = openPutaways.map(t => `
        <div class="mob-task-card" style="border-left: 3px solid #f59e0b;">
          <div class="mob-task-card-header">
            <span class="mob-task-id">📦 ${t.taskId}</span>
            <span class="mob-task-badge">${t.status}</span>
          </div>
          <div class="mob-task-details">
            <span>HU: <strong>${t.huNumber}</strong></span>
            <span>Qty: <strong>${t.quantity} ${t.uom}</strong></span>
          </div>
          <div class="mob-task-locations">
            <span>Area: <strong>RM-WH-01</strong></span>
            <span>➔</span>
            <span>Bin: <strong style="color:#38bdf8;">${t.suggestedLocation}</strong></span>
          </div>
          <button class="btn-mob-action primary" style="margin-top:6px; padding:8px; background:#f59e0b; font-size:12px; font-weight:700;" onclick="mob.startMobilePutaway('${t.huNumber}')">
            📦 Putaway Bin
          </button>
        </div>
      `).join('');
      return;
    }

    // 3. PICKING TASKS
    if (this.taskCategory === 'picking') {
      const pickList = window.wms.pickLists.slice(0, 2);
      container.innerHTML = pickList.map(pl => `
        <div class="mob-task-card" style="border-left: 3px solid #10b981;">
          <div class="mob-task-card-header">
            <span class="mob-task-id">🛒 ${pl.pickListNo}</span>
            <span class="mob-task-badge" style="background:#064e3b; color:#6ee7b7;">${pl.status}</span>
          </div>
          <div class="mob-task-details">
            <span>Line: <strong>${pl.line}</strong></span>
            <span>MR: <strong>${pl.mrNumber}</strong></span>
          </div>
          <div class="mob-task-locations">
            <span>Staging: <strong>${pl.stagingLocation}</strong></span>
          </div>
          <button class="btn-mob-action success" style="margin-top:6px; padding:8px; font-size:12px; font-weight:700;" onclick="mob.startMobilePicking('HU-HND-2026-009801')">
            🛒 Pick Part
          </button>
        </div>
      `).join('');
    }
  }

  renderMobileInventory() {
    const container = document.getElementById('mob-inventory-list-container');
    if (!container) return;

    // Check low stock materials
    const shortages = (window.wms.materials || []).filter(m => (m.availableStock || 0) < (m.minStock || 100)).slice(0, 2);

    let shortageHtml = '';
    if (shortages.length > 0) {
      shortageHtml = `
        <div style="background:#450a0a; border:1px solid #dc2626; border-radius:10px; padding:10px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:11px; font-weight:800; color:#fca5a5;">⚠️ STOCK SHORTAGE ALERTS</span>
            <span class="wms-badge badge-fifo-p1">${shortages.length} Low</span>
          </div>
          ${shortages.map(s => `
            <div style="background:#1e1b4b; border-radius:8px; padding:8px; margin-top:6px; border:1px solid #4338ca;">
              <div style="display:flex; justify-content:space-between;">
                <strong style="color:#fff; font-size:11px;">${s.materialCode}</strong>
                <span style="color:#ef4444; font-weight:700; font-size:11px;">${s.availableStock} / ${s.minStock} EA</span>
              </div>
              <div style="font-size:10px; color:#cbd5e1; margin:2px 0;">${s.description}</div>
              <button class="btn-mob-action primary" style="background:#dc2626; width:100%; margin-top:4px; padding:6px; font-size:11px; font-weight:700;" onclick="mob.requestReorderPO('${s.materialCode}', ${s.reorderQty || 500}, '${s.supplier || 'Keihin India Electronics Pvt Ltd'}')">
                📑 Reorder PO (${s.reorderQty || 500} EA)
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }

    container.innerHTML = shortageHtml + `
      <div style="font-size:11px; font-weight:700; color:#94a3b8; margin-bottom:8px; text-transform:uppercase;">PHYSICAL BINS & HANDLING UNITS</div>
    ` + window.wms.handlingUnits.slice(0, 2).map(hu => `
      <div class="mob-task-card">
        <div class="mob-task-card-header">
          <span class="mob-task-id">${hu.huNumber}</span>
          <span class="wms-badge badge-fifo-p${hu.fifoPriority || 3}">P${hu.fifoPriority || 3}</span>
        </div>
        <div class="mob-task-details">
          <span>${hu.materialCode}</span>
          <span><strong>${hu.quantity} ${hu.uom}</strong></span>
        </div>
        <div class="mob-task-locations">
          <span>Bin: <strong>${hu.location}</strong></span>
          <span>${hu.status}</span>
        </div>
      </div>
    `).join('');
  }

  requestReorderPO(matCode, suggestedQty = 500, supplier = 'Keihin India Electronics Pvt Ltd') {
    const matInput = document.getElementById('reorder-mat-input');
    const suppInput = document.getElementById('reorder-supp-input');
    const qtyInput = document.getElementById('reorder-qty-input');
    
    if (matInput) matInput.value = matCode;
    if (suppInput) suppInput.value = supplier;
    if (qtyInput) qtyInput.value = suggestedQty;

    const modal = document.getElementById('reorder-po-modal');
    if (modal) modal.classList.add('active');
  }

  closeReorderModal() {
    const modal = document.getElementById('reorder-po-modal');
    if (modal) modal.classList.remove('active');
  }

  submitReorderPO() {
    const matCode = document.getElementById('reorder-mat-input')?.value || 'HND-ECU-KEIHIN-01';
    const supplier = document.getElementById('reorder-supp-input')?.value || 'Keihin India Electronics Pvt Ltd';
    const orderedQty = parseInt(document.getElementById('reorder-qty-input')?.value || '500', 10);
    const newPONo = `PO-HND-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newPO = {
      poNumber: newPONo,
      supplier,
      plant: 'HMSI Narsapur Plant 1',
      materialCode: matCode,
      materialDescription: matCode.includes('ECU') ? 'Keihin Electronic Control Unit' : 'Honda OEM Part',
      orderedQuantity: orderedQty,
      receivedQuantity: 0,
      openQuantity: orderedQty,
      expectedReceiptDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: 'Open (Mobile Requested)',
      requestedBy: `${this.currentUser} (Mobile Zebra Terminal)`
    };

    if (!window.wms.purchaseOrders) window.wms.purchaseOrders = [];
    window.wms.purchaseOrders.unshift(newPO);

    // Also log in SAP Sync Logs
    if (!window.wms.sapSyncLogs) window.wms.sapSyncLogs = [];
    window.wms.sapSyncLogs.unshift({
      syncId: `SYNC-PO-${Date.now()}`,
      interfaceId: 'BAPI_PO_CREATE1',
      direction: 'OUTBOUND',
      sapDocNo: `SAP-PO-${Math.floor(4500000000 + Math.random() * 999999)}`,
      wmsRef: newPONo,
      payloadType: 'PURCHASE_ORDER_REORDER',
      status: 'POSTED_TO_SAP (201 Created)',
      timestamp: new Date().toLocaleTimeString()
    });

    saveWMSState(window.wms);
    this.playBeep('success');
    this.showToast(`PO ${newPONo} Created & Sent to SAP (${orderedQty} EA)`, 'success', '📑');
    this.closeReorderModal();
    this.renderMobileInventory();
    this.renderHome();
  }
}

// Attach global mob instance to window for inline onclick handlers
window.mob = new MobileWMSApp();

document.addEventListener('DOMContentLoaded', () => {
  if (window.mob && window.mob.activeRole) {
    window.mob.applyRoleUI(window.mob.activeRole);
  }
});
