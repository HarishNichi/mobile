// HONDA MOTORCYCLE & SCOOTER INDIA (HMSI) - MANUFACTURING WMS
// Enterprise Data Model, FIFO Allocation Engine, CRUD & LocalStorage State Management
// Narsapur Two-Wheeler Manufacturing Plant 1 & Plant 2

const WMS_STORAGE_KEY = 'HONDA_HMSI_WMS_STATE_V3';

const WMS_DEFAULT_STATE = {
  activePlant: 'All',
  activeWarehouse: 'All Warehouses',
  systemDate: '23-Sep-2026',
  currentUser: {
    name: 'Rajesh Sharma',
    role: 'WMS Control Tower Manager',
    plant: 'HMSI Narsapur Plant 1',
    id: 'HND-EMP-7802'
  },
  
  // 1. Honda Manufacturing Plants & Assembly Lines
  plants: [
    {
      id: 'P1',
      name: 'HMSI Narsapur Plant 1 (Scooter & Commuter Division)',
      code: 'HMSI-NP-01',
      location: 'Plot 42, KIADB Industrial Area, Narsapur, Kolar, Karnataka',
      lines: [
        { id: 'P1-L1', name: 'Line 1 (Activa 6G Final Assembly)', materialAvailability: 96, activeWorkers: 28, status: 'Running (1,200 units/shift)', stagedHUs: 6, openReqs: 2 },
        { id: 'P1-L2', name: 'Line 2 (Shine 125 & SP125 Assembly)', materialAvailability: 88, activeWorkers: 32, status: 'Running (950 units/shift)', stagedHUs: 4, openReqs: 4 },
        { id: 'P1-L3', name: 'Line 3 (110cc/125cc PGM-FI Engine Sub-Assembly)', materialAvailability: 94, activeWorkers: 22, status: 'Running (2,200 engines/shift)', stagedHUs: 8, openReqs: 1 }
      ]
    },
    {
      id: 'P2',
      name: 'HMSI Narsapur Plant 2 (Premium Motorcycle Division)',
      code: 'HMSI-NP-02',
      location: 'Plot 55, KIADB Industrial Area, Narsapur, Kolar, Karnataka',
      lines: [
        { id: 'P2-L1', name: 'Line 1 (CB350 / H\'ness Final Assembly)', materialAvailability: 91, activeWorkers: 24, status: 'Running (400 units/shift)', stagedHUs: 5, openReqs: 3 },
        { id: 'P2-L2', name: 'Line 2 (Robotic Frame Welding & ED Paint Shop)', materialAvailability: 78, activeWorkers: 30, status: 'Warning (ECU Shortage)', stagedHUs: 2, openReqs: 6 }
      ]
    }
  ],

  // 2. Honda Warehouses, Receiving Docks & High-Density Bins
  warehouses: [
    { id: 'WH-01', plantId: 'P1', code: 'RM-WH-01', name: 'HMSI Raw Material Central Warehouse', type: 'Raw Material / Powertrain', capacityHUs: 3200, occupiedHUs: 2460, utilization: 77 },
    { id: 'WH-02', plantId: 'P1', code: 'FG-WH-01', name: 'Finished Two-Wheeler Logistics Yard', type: 'Finished Goods', capacityHUs: 1500, occupiedHUs: 1020, utilization: 68 },
    { id: 'WH-03', plantId: 'P2', code: 'P2-RM-01', name: 'Plant 2 Premium Parts & Frame Store', type: 'Raw Material', capacityHUs: 2000, occupiedHUs: 1640, utilization: 82 }
  ],

  docks: [
    { id: 'DOCK-01', name: 'Dock 01 (Powertrain Inbound)', plant: 'HMSI Narsapur Plant 1', vehicle: 'KA-07-M-1829', supplier: 'Keihin India Electronics Pvt Ltd', po: 'PO-HND-2026-00421', status: 'Receiving In Progress', type: 'Inbound' },
    { id: 'DOCK-02', name: 'Dock 02 (Electrical & ECU)', plant: 'HMSI Narsapur Plant 1', vehicle: 'KA-04-H-8821', supplier: 'Mitsuba Sical India Pvt Ltd', po: 'PO-HND-2026-00422', status: 'QC Inspection', type: 'Inbound' },
    { id: 'DOCK-03', name: 'Dock 03 (Tyres & Wheels)', plant: 'HMSI Narsapur Plant 1', vehicle: '—', supplier: '—', po: '—', status: 'Available', type: 'Inbound' },
    { id: 'DOCK-04', name: 'Dock 04 (Chassis & Brakes)', plant: 'HMSI Narsapur Plant 1', vehicle: 'KA-01-AB-4821', supplier: 'Keihin India Electronics Pvt Ltd', po: 'PO-HND-2026-00421', status: 'Dock Assigned', type: 'Inbound' },
    { id: 'DOCK-05', name: 'Dock 05 (Suspension & Exhaust)', plant: 'HMSI Narsapur Plant 2', vehicle: 'KA-53-Z-9912', supplier: 'Showa India Pvt Ltd', po: 'PO-HND-2026-00425', status: 'Receiving In Progress', type: 'Inbound' },
    { id: 'DOCK-06', name: 'Dock 06 (Fasteners & Consumables)', plant: 'HMSI Narsapur Plant 2', vehicle: '—', supplier: '—', po: '—', status: 'Available', type: 'Inbound' }
  ],

  locations: [
    { code: 'RM-A01-R01-S01-B01', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', area: 'Powertrain Zone', zone: 'Zone A', aisle: 'A01', rack: 'R01', shelf: 'S01', bin: 'B01', capacity: 120, occupied: 90, status: 'Normal', material: 'HND-THROT-KEIHIN' },
    { code: 'RM-A02-R02-S01-B02', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', area: 'Powertrain Zone', zone: 'Zone A', aisle: 'A02', rack: 'R02', shelf: 'S01', bin: 'B02', capacity: 80, occupied: 80, status: 'Full', material: 'HND-STR-MITSUBA' },
    { code: 'RM-B02-R01-S01-B01', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', area: 'Electronics Bay', zone: 'Zone B', aisle: 'B02', rack: 'R01', shelf: 'S01', bin: 'B01', capacity: 50, occupied: 10, status: 'Low Stock', material: 'HND-ECU-KEIHIN-01' },
    { code: 'RM-C01-R01-S01-B01', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', area: 'Chassis Zone', zone: 'Zone C', aisle: 'C01', rack: 'R01', shelf: 'S01', bin: 'B01', capacity: 100, occupied: 40, status: 'Normal', material: 'HND-SHK-SHOWA' },
    { code: 'RM-D01-R01-S01-B01', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', area: 'Tyres & Rubber', zone: 'Zone D', aisle: 'D01', rack: 'R01', shelf: 'S01', bin: 'B01', capacity: 150, occupied: 130, status: 'Normal', material: 'HND-TYR-MRF-90' },
  ],

  // 3. Honda OEM Materials Master
  materials: [
    {
      code: 'HND-THROT-KEIHIN',
      description: 'Keihin PGM-FI 26mm Throttle Body Assembly (Activa 6G / Dio)',
      category: 'Fuel Injection & Powertrain',
      plant: 'HMSI Narsapur Plant 1',
      uom: 'EA',
      storageClass: 'High-Precision Electronic Sub-Assembly',
      fifoRequired: true,
      shelfLifeDays: 730,
      minStock: 250,
      safetyStock: 120,
      reorderPoint: 400,
      suggestedReplenishment: 600,
      preferredStorageArea: 'Powertrain Zone A',
      availableStock: 380,
      allocatedStock: 80,
      reservedStock: 40,
      blockedStock: 0,
      quarantineStock: 0,
      unitPrice: 2450.00
    },
    {
      code: 'HND-ECU-KEIHIN-01',
      description: 'Keihin Master Engine Control Unit (ECU) with OBD2 & eSP Logic',
      category: 'Electronics & Sensors',
      plant: 'HMSI Narsapur Plant 2',
      uom: 'EA',
      storageClass: 'ESD Protected Sensitive Electronic',
      fifoRequired: true,
      shelfLifeDays: 1095,
      minStock: 180,
      safetyStock: 80,
      reorderPoint: 300,
      suggestedReplenishment: 450,
      preferredStorageArea: 'Electronics & ECU Bay B02',
      availableStock: 50,
      allocatedStock: 20,
      reservedStock: 10,
      blockedStock: 0,
      quarantineStock: 0,
      unitPrice: 4200.00
    },
    {
      code: 'HND-STR-MITSUBA',
      description: 'Mitsuba ACG Silent Starter & Generator Assembly 12V 0.8kW',
      category: 'Electrical Powertrain',
      plant: 'HMSI Narsapur Plant 1',
      uom: 'EA',
      storageClass: 'Precision Motor Assembly',
      fifoRequired: true,
      shelfLifeDays: 1095,
      minStock: 100,
      safetyStock: 50,
      reorderPoint: 180,
      suggestedReplenishment: 300,
      preferredStorageArea: 'Powertrain Zone A02',
      availableStock: 140,
      allocatedStock: 40,
      reservedStock: 20,
      blockedStock: 0,
      quarantineStock: 0,
      unitPrice: 1850.00
    },
    {
      code: 'HND-CVT-BELT-BND',
      description: 'Bando Double-Cog Reinforced V-Belt Drive (Activa 6G / Dio 125)',
      category: 'Transmission & Drive',
      plant: 'HMSI Narsapur Plant 1',
      uom: 'EA',
      storageClass: 'Polymer / Drive Transmission',
      fifoRequired: true,
      shelfLifeDays: 540,
      minStock: 300,
      safetyStock: 150,
      reorderPoint: 500,
      suggestedReplenishment: 800,
      preferredStorageArea: 'Transmission Zone A04',
      availableStock: 420,
      allocatedStock: 100,
      reservedStock: 50,
      blockedStock: 0,
      quarantineStock: 0,
      unitPrice: 620.00
    },
    {
      code: 'HND-BRK-NISSIN',
      description: 'Nissin Hydraulic Front Disc Brake Master Cylinder & Caliper',
      category: 'Chassis & Safety Braking',
      plant: 'HMSI Narsapur Plant 1',
      uom: 'EA',
      storageClass: 'Hydraulic Braking System',
      fifoRequired: true,
      shelfLifeDays: 1460,
      minStock: 150,
      safetyStock: 80,
      reorderPoint: 250,
      suggestedReplenishment: 400,
      preferredStorageArea: 'Chassis & Brakes Zone B01',
      availableStock: 210,
      allocatedStock: 50,
      reservedStock: 20,
      blockedStock: 0,
      quarantineStock: 0,
      unitPrice: 1480.00
    },
    {
      code: 'HND-SHK-SHOWA',
      description: 'Showa Telescopic Hydraulic Front Suspension Fork Set (Shine 125)',
      category: 'Suspension & Steering',
      plant: 'HMSI Narsapur Plant 1',
      uom: 'SET',
      storageClass: 'Suspension Component',
      fifoRequired: true,
      shelfLifeDays: 1460,
      minStock: 120,
      safetyStock: 60,
      reorderPoint: 200,
      suggestedReplenishment: 350,
      preferredStorageArea: 'Suspension Zone C01',
      availableStock: 190,
      allocatedStock: 40,
      reservedStock: 10,
      blockedStock: 0,
      quarantineStock: 0,
      unitPrice: 2890.00
    },
    {
      code: 'HND-TYR-MRF-90',
      description: 'MRF Nylogrip Zapper 90/90-12 54J Tubeless OEM Tyre (Activa 6G)',
      category: 'Tyres & Wheels',
      plant: 'HMSI Narsapur Plant 1',
      uom: 'EA',
      storageClass: 'Rubber & Tyres',
      fifoRequired: true,
      shelfLifeDays: 730,
      minStock: 400,
      safetyStock: 200,
      reorderPoint: 700,
      suggestedReplenishment: 1200,
      preferredStorageArea: 'Wheels & Tyres Zone D01',
      availableStock: 650,
      allocatedStock: 150,
      reservedStock: 50,
      blockedStock: 0,
      quarantineStock: 0,
      unitPrice: 1150.00
    },
    {
      code: 'HND-LED-STANLEY',
      description: 'Stanley High-Output Dual LED Headlamp Assembly with DRL',
      category: 'Lighting & Electrical',
      plant: 'HMSI Narsapur Plant 1',
      uom: 'EA',
      storageClass: 'Optical & Lighting Assembly',
      fifoRequired: true,
      shelfLifeDays: 1095,
      minStock: 140,
      safetyStock: 70,
      reorderPoint: 220,
      suggestedReplenishment: 350,
      preferredStorageArea: 'Electronics Zone B02',
      availableStock: 180,
      allocatedStock: 30,
      reservedStock: 15,
      blockedStock: 0,
      quarantineStock: 0,
      unitPrice: 1920.00
    }
  ],

  // 4. Inbound Gate Entries
  gateEntries: [
    {
      gateEntryNo: 'GE-HND-2026-009821',
      vehicleNo: 'KA-01-AB-4821',
      supplier: 'Keihin India Electronics Pvt Ltd',
      poNumber: 'PO-HND-2026-00421',
      asnNumber: 'ASN-HND-2026-00391',
      driverName: 'Manjunath Reddy',
      driverContact: '+91 98450 19284',
      arrivalTimestamp: '23-Sep-2026 08:30:14',
      plant: 'HMSI Narsapur Plant 1',
      gate: 'Security Gate 02 (North)',
      dock: 'Dock 04 (Chassis & Brakes)',
      expectedHUs: 5,
      expectedQty: 500,
      receivedHUs: 0,
      receivedQty: 0,
      status: 'Dock Assigned'
    },
    {
      gateEntryNo: 'GE-HND-2026-009822',
      vehicleNo: 'KA-04-H-8821',
      supplier: 'Mitsuba Sical India Pvt Ltd',
      poNumber: 'PO-HND-2026-00422',
      asnNumber: 'ASN-HND-2026-00392',
      driverName: 'Suresh Kumar',
      driverContact: '+91 97410 44821',
      arrivalTimestamp: '23-Sep-2026 09:15:22',
      plant: 'HMSI Narsapur Plant 1',
      gate: 'Security Gate 01 (Main)',
      dock: 'Dock 02 (Electrical & ECU)',
      expectedHUs: 4,
      expectedQty: 400,
      receivedHUs: 4,
      receivedQty: 400,
      status: 'QC Inspection'
    },
    {
      gateEntryNo: 'GE-HND-2026-009823',
      vehicleNo: 'KA-07-M-1829',
      supplier: 'Keihin India Electronics Pvt Ltd',
      poNumber: 'PO-HND-2026-00421',
      asnNumber: 'ASN-HND-2026-00393',
      driverName: 'Venkatesh Rao',
      driverContact: '+91 96112 55901',
      arrivalTimestamp: '23-Sep-2026 10:00:00',
      plant: 'HMSI Narsapur Plant 1',
      gate: 'Security Gate 02 (North)',
      dock: 'Dock 01 (Powertrain Inbound)',
      expectedHUs: 6,
      expectedQty: 600,
      receivedHUs: 3,
      receivedQty: 300,
      status: 'Receiving In Progress'
    },
    {
      gateEntryNo: 'GE-HND-2026-009824',
      vehicleNo: 'KA-53-Z-9912',
      supplier: 'Showa India Pvt Ltd',
      poNumber: 'PO-HND-2026-00425',
      asnNumber: 'ASN-HND-2026-00394',
      driverName: 'Anil Gowda',
      driverContact: '+91 99001 88412',
      arrivalTimestamp: '23-Sep-2026 11:20:45',
      plant: 'HMSI Narsapur Plant 2',
      gate: 'Security Gate 03 (Plant 2)',
      dock: 'Dock 05 (Suspension & Exhaust)',
      expectedHUs: 8,
      expectedQty: 400,
      receivedHUs: 0,
      receivedQty: 0,
      status: 'Arrived'
    }
  ],

  // 5. Handling Units (HU / LPN) Inventory Master
  handlingUnits: [
    {
      huNumber: 'HU-HND-2026-009801',
      lpn: 'LPN-HND-009801',
      materialCode: 'HND-THROT-KEIHIN',
      description: 'Keihin PGM-FI 26mm Throttle Body (Activa 6G)',
      quantity: 80,
      uom: 'EA',
      plant: 'HMSI Narsapur Plant 1',
      location: 'RM-A03-R04-S02-B05',
      batch: 'BAT-KEI-2026-09-18-01',
      receiptDate: '18-Sep-2026',
      fifoDate: '18-Sep-2026',
      fifoPriority: 1,
      status: 'AVAILABLE',
      supplier: 'Keihin India Electronics Pvt Ltd',
      poNumber: 'PO-HND-2026-00418',
      condition: 'Good',
      agingBucket: '8–15 Days'
    },
    {
      huNumber: 'HU-HND-2026-009802',
      lpn: 'LPN-HND-009802',
      materialCode: 'HND-THROT-KEIHIN',
      description: 'Keihin PGM-FI 26mm Throttle Body (Activa 6G)',
      quantity: 100,
      uom: 'EA',
      plant: 'HMSI Narsapur Plant 1',
      location: 'RM-A03-R05-S02-B02',
      batch: 'BAT-KEI-2026-09-20-02',
      receiptDate: '20-Sep-2026',
      fifoDate: '20-Sep-2026',
      fifoPriority: 2,
      status: 'AVAILABLE',
      supplier: 'Keihin India Electronics Pvt Ltd',
      poNumber: 'PO-HND-2026-00419',
      condition: 'Good',
      agingBucket: '0–7 Days'
    },
    {
      huNumber: 'HU-HND-2026-009803',
      lpn: 'LPN-HND-009803',
      materialCode: 'HND-THROT-KEIHIN',
      description: 'Keihin PGM-FI 26mm Throttle Body (Activa 6G)',
      quantity: 120,
      uom: 'EA',
      plant: 'HMSI Narsapur Plant 1',
      location: 'RM-A04-R01-S01-B03',
      batch: 'BAT-KEI-2026-09-23-01',
      receiptDate: '23-Sep-2026',
      fifoDate: '23-Sep-2026',
      fifoPriority: 3,
      status: 'AVAILABLE',
      supplier: 'Keihin India Electronics Pvt Ltd',
      poNumber: 'PO-HND-2026-00421',
      condition: 'Good',
      agingBucket: '0–7 Days'
    },
    {
      huNumber: 'HU-HND-2026-009804',
      lpn: 'LPN-HND-009804',
      materialCode: 'HND-STR-MITSUBA',
      description: 'Mitsuba ACG Silent Starter & Generator 12V',
      quantity: 40,
      uom: 'EA',
      plant: 'HMSI Narsapur Plant 1',
      location: 'RM-A02-R02-S01-B02',
      batch: 'BAT-MIT-2026-09-10-01',
      receiptDate: '10-Sep-2026',
      fifoDate: '10-Sep-2026',
      fifoPriority: 1,
      status: 'AVAILABLE',
      supplier: 'Mitsuba Sical India Pvt Ltd',
      poNumber: 'PO-HND-2026-00412',
      condition: 'Good',
      agingBucket: '8–15 Days'
    },
    {
      huNumber: 'HU-HND-2026-009805',
      lpn: 'LPN-HND-009805',
      materialCode: 'HND-ECU-KEIHIN-01',
      description: 'Keihin Master Engine Control Unit (ECU)',
      quantity: 50,
      uom: 'EA',
      plant: 'HMSI Narsapur Plant 2',
      location: 'RM-B02-R03-S01-B04',
      batch: 'BAT-KEI-2026-08-25-01',
      receiptDate: '25-Aug-2026',
      fifoDate: '25-Aug-2026',
      fifoPriority: 1,
      status: 'AVAILABLE',
      supplier: 'Keihin India Electronics Pvt Ltd',
      poNumber: 'PO-HND-2026-00388',
      condition: 'Good',
      agingBucket: '16–30 Days'
    },
    {
      huNumber: 'HU-HND-2026-009806',
      lpn: 'LPN-HND-009806',
      materialCode: 'HND-BRK-NISSIN',
      description: 'Nissin Hydraulic Front Disc Brake Master Cylinder',
      quantity: 60,
      uom: 'EA',
      plant: 'HMSI Narsapur Plant 1',
      location: 'RM-B01-R02-S01-B01',
      batch: 'BAT-NIS-2026-09-15-02',
      receiptDate: '15-Sep-2026',
      fifoDate: '15-Sep-2026',
      fifoPriority: 1,
      status: 'AVAILABLE',
      supplier: 'Nissin Brakes India Pvt Ltd',
      poNumber: 'PO-HND-2026-00415',
      condition: 'Good',
      agingBucket: '8–15 Days'
    },
    {
      huNumber: 'HU-HND-2026-009807',
      lpn: 'LPN-HND-009807',
      materialCode: 'HND-CVT-BELT-BND',
      description: 'Bando Double-Cog Reinforced V-Belt Drive',
      quantity: 140,
      uom: 'EA',
      plant: 'HMSI Narsapur Plant 1',
      location: 'RM-A04-R01-S01-B03',
      batch: 'BAT-BND-2026-09-12-01',
      receiptDate: '12-Sep-2026',
      fifoDate: '12-Sep-2026',
      fifoPriority: 1,
      status: 'AVAILABLE',
      supplier: 'Bando India Pvt Ltd',
      poNumber: 'PO-HND-2026-00414',
      condition: 'Good',
      agingBucket: '8–15 Days'
    },
    {
      huNumber: 'HU-HND-2026-009808',
      lpn: 'LPN-HND-009808',
      materialCode: 'HND-SHK-SHOWA',
      description: 'Showa Telescopic Hydraulic Front Suspension Fork Set',
      quantity: 40,
      uom: 'SET',
      plant: 'HMSI Narsapur Plant 1',
      location: 'RM-C01-R01-S01-B01',
      batch: 'BAT-SHW-2026-09-14-01',
      receiptDate: '14-Sep-2026',
      fifoDate: '14-Sep-2026',
      fifoPriority: 1,
      status: 'AVAILABLE',
      supplier: 'Showa India Pvt Ltd',
      poNumber: 'PO-HND-2026-00416',
      condition: 'Good',
      agingBucket: '8–15 Days'
    },
    {
      huNumber: 'HU-HND-2026-009809',
      lpn: 'LPN-HND-009809',
      materialCode: 'HND-TYR-MRF-90',
      description: 'MRF Nylogrip Zapper 90/90-12 54J Tubeless Tyre',
      quantity: 130,
      uom: 'EA',
      plant: 'HMSI Narsapur Plant 1',
      location: 'RM-D01-R01-S01-B01',
      batch: 'BAT-MRF-2026-09-19-01',
      receiptDate: '19-Sep-2026',
      fifoDate: '19-Sep-2026',
      fifoPriority: 1,
      status: 'AVAILABLE',
      supplier: 'MRF Limited OEM Division',
      poNumber: 'PO-HND-2026-00420',
      condition: 'Good',
      agingBucket: '0–7 Days'
    }
  ],

  // 6. Production Material Requisitions
  materialRequisitions: [
    {
      mrNumber: 'MR-HND-2026-00129',
      plant: 'HMSI Narsapur Plant 1',
      productionLine: 'Line 1 (Activa 6G Final Assembly)',
      materialCode: 'HND-THROT-KEIHIN',
      materialDescription: 'Keihin PGM-FI 26mm Throttle Body (Activa 6G)',
      requiredQuantity: 80,
      uom: 'EA',
      requiredDate: '23-Sep-2026 14:00',
      priority: 'Urgent',
      requestedBy: 'Lokesh Gowda (Activa Assembly Supervisor)',
      reason: 'Shift 2 Production Schedule - 80 Units Required',
      status: 'Submitted',
      allocations: []
    },
    {
      mrNumber: 'MR-HND-2026-00130',
      plant: 'HMSI Narsapur Plant 1',
      productionLine: 'Line 2 (Shine 125 & SP125 Assembly)',
      materialCode: 'HND-SHK-SHOWA',
      materialDescription: 'Showa Telescopic Front Fork Set',
      requiredQuantity: 40,
      uom: 'SET',
      requiredDate: '23-Sep-2026 15:30',
      priority: 'Standard',
      requestedBy: 'Harish Babu (Shine Line Supervisor)',
      reason: 'Shine 125 Front Suspension Assembly Batch',
      status: 'Submitted',
      allocations: []
    },
    {
      mrNumber: 'MR-HND-2026-00131',
      plant: 'HMSI Narsapur Plant 1',
      productionLine: 'Line 3 (110cc/125cc PGM-FI Engine Sub-Assembly)',
      materialCode: 'HND-STR-MITSUBA',
      materialDescription: 'Mitsuba ACG Silent Starter & Generator',
      requiredQuantity: 40,
      uom: 'EA',
      requiredDate: '23-Sep-2026 16:00',
      priority: 'Standard',
      requestedBy: 'Raghavendra K (Engine Assembly Lead)',
      reason: 'Engine Powertrain Stator Build',
      status: 'Submitted',
      allocations: []
    }
  ],

  // 7. Purchase Orders
  purchaseOrders: [
    {
      poNumber: 'PO-HND-2026-00421',
      supplier: 'Keihin India Electronics Pvt Ltd',
      plant: 'HMSI Narsapur Plant 1',
      orderDate: '20-Sep-2026',
      expectedReceiptDate: '23-Sep-2026',
      status: 'Approved',
      materialCode: 'HND-THROT-KEIHIN',
      materialDescription: 'Keihin PGM-FI 26mm Throttle Body (Activa 6G / Dio)',
      orderedQty: 500,
      receivedQty: 0,
      openQty: 500,
      uom: 'EA',
      unitPrice: 2450.00
    },
    {
      poNumber: 'PO-HND-2026-00422',
      supplier: 'Mitsuba Sical India Pvt Ltd',
      plant: 'HMSI Narsapur Plant 1',
      orderDate: '19-Sep-2026',
      expectedReceiptDate: '23-Sep-2026',
      status: 'In Receiving',
      materialCode: 'HND-STR-MITSUBA',
      materialDescription: 'Mitsuba ACG Silent Starter & Generator 12V',
      orderedQty: 400,
      receivedQty: 400,
      openQty: 0,
      uom: 'EA',
      unitPrice: 1850.00
    },
    {
      poNumber: 'PO-HND-2026-00425',
      supplier: 'Showa India Pvt Ltd',
      plant: 'HMSI Narsapur Plant 2',
      orderDate: '21-Sep-2026',
      expectedReceiptDate: '23-Sep-2026',
      status: 'Approved',
      materialCode: 'HND-SHK-SHOWA',
      materialDescription: 'Showa Telescopic Front Fork Set (Shine 125)',
      orderedQty: 400,
      receivedQty: 0,
      openQty: 400,
      uom: 'SET',
      unitPrice: 2890.00
    },
    {
      poNumber: 'PO-HND-2026-00428',
      supplier: 'MRF Limited OEM Division',
      plant: 'HMSI Narsapur Plant 1',
      orderDate: '18-Sep-2026',
      expectedReceiptDate: '24-Sep-2026',
      status: 'Approved',
      materialCode: 'HND-TYR-MRF-90',
      materialDescription: 'MRF Nylogrip Zapper 90/90-12 Tubeless Tyre',
      orderedQty: 1200,
      receivedQty: 0,
      openQty: 1200,
      uom: 'EA',
      unitPrice: 1150.00
    }
  ],

  // 8. Putaway Task Queue
  putawayTasks: [
    { taskId: 'PUT-HND-001', huNumber: 'HU-HND-2026-009803', materialCode: 'HND-THROT-KEIHIN', quantity: 120, uom: 'EA', sourceLocation: 'Dock 04', suggestedLocation: 'RM-A04-R01-S01-B03', status: 'Completed', timestamp: '23-Sep-2026 10:45' },
    { taskId: 'PUT-HND-002', huNumber: 'HU-HND-2026-009804', materialCode: 'HND-STR-MITSUBA', quantity: 40, uom: 'EA', sourceLocation: 'Dock 02', suggestedLocation: 'RM-A02-R02-S01-B02', status: 'Completed', timestamp: '23-Sep-2026 11:10' },
    { taskId: 'PUT-HND-003', huNumber: 'HU-HND-2026-009809', materialCode: 'HND-TYR-MRF-90', quantity: 130, uom: 'EA', sourceLocation: 'Dock 03', suggestedLocation: 'RM-D01-R01-S01-B01', status: 'Open', timestamp: '23-Sep-2026 11:40' }
  ],

  // 9. Pick Lists
  pickLists: [
    { pickListNo: 'PL-HND-2026-00129', mrNumber: 'MR-HND-2026-00129', plant: 'HMSI Narsapur Plant 1', line: 'Line 1 (Activa 6G)', picker: 'Sanjay Verma (Op 01)', stagingLocation: 'STG-P1-L1', status: 'In Picking', createdDate: '23-Sep-2026 11:30' }
  ],

  // 10. Line Supply Requests
  lineSupplyRequests: [
    { lsrNumber: 'LSR-HND-2026-00129', plant: 'HMSI Narsapur Plant 1', productionLine: 'Line 1 (Activa 6G Final Assembly)', materialCode: 'HND-THROT-KEIHIN', quantity: 80, stagingLocation: 'STG-P1-L1', status: 'Dispatched', dispatchedTime: '23-Sep-2026 12:15' }
  ],

  // 11. Stock Transfers
  stockTransfers: [
    { transferOrderNo: 'STO-HND-2026-00129', sourcePlant: 'HMSI Narsapur Plant 1', sourceLocation: 'RM-WH-01 (Zone A)', destinationPlant: 'HMSI Narsapur Plant 2', destinationLocation: 'P2-RM-01 (Zone B)', materialCode: 'HND-ECU-KEIHIN-01', quantity: 20, uom: 'EA', status: 'In-Transit (Truck KA-07-TR-102)', approvedBy: 'Rajesh Sharma' }
  ],

  // 12. Goods Receipt Notes
  goodsReceiptNotes: [
    { grnNumber: 'GRN-HND-2026-00481', poNumber: 'PO-HND-2026-00418', supplier: 'Keihin India Electronics Pvt Ltd', receivedHUs: 5, acceptedQuantity: 500, uom: 'EA', status: 'Posted to SAP ERP', receiptTimestamp: '18-Sep-2026 14:22:10', inspector: 'Suresh Quality Lead' }
  ],

  // 13. Cycle Counts
  cycleCounts: [
    { countId: 'CC-HND-2026-0923-01', binLocation: 'RM-A03-R04-S02-B05', material: 'HND-THROT-KEIHIN', systemQty: 80, physicalQty: 80, variance: 0, counter: 'Operator Prakash (Op 03)', status: 'Verified Zero Variance' }
  ],

  // 14. Audit Trail
  auditTrail: [
    { timestamp: '23-Sep-2026 11:30:15', user: 'Rajesh Sharma', role: 'Warehouse Manager', transaction: 'FIFO Allocation', entity: 'MR-HND-2026-00129', reference: 'HU-HND-2026-009801', change: 'Status: Submitted → FIFO Allocated (P1)', device: 'PC Console (WH-MGR-01)' },
    { timestamp: '23-Sep-2026 10:45:00', user: 'Sanjay Verma', role: 'Forklift Operator', transaction: 'Putaway Confirm', entity: 'PUT-HND-001', reference: 'HU-HND-2026-009803', change: 'Location: Dock 04 → RM-A04-R01-S01-B03', device: 'Zebra TC57 (Scanner #04)' }
  ],

  // 15. Area & Storage Bin Master Data
  areaMaster: [
    { zoneCode: 'ZONE-A-PWR', zoneName: 'Powertrain Zone A', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', binCount: 120, occupiedBins: 84, utilization: '70%', velocityClass: 'Class A (Fast Mover)', category: 'Throttle Bodies & Fuel Injection' },
    { zoneCode: 'ZONE-B-ELE', zoneName: 'Electronics & Sensors Bay B', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', binCount: 80, occupiedBins: 58, utilization: '72%', velocityClass: 'Class A (Fast Mover)', category: 'ECUs, Starters & Relays' },
    { zoneCode: 'ZONE-C-SUS', zoneName: 'Chassis & Suspension Zone C', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', binCount: 90, occupiedBins: 45, utilization: '50%', velocityClass: 'Class B (Medium Mover)', category: 'Shocks, Forks & Calipers' },
    { zoneCode: 'ZONE-D-TYR', zoneName: 'Tyres & Rubber Bay D', plant: 'HMSI Narsapur Plant 1', warehouse: 'RM-WH-01', binCount: 60, occupiedBins: 52, utilization: '86%', velocityClass: 'Class A (Fast Mover)', category: 'MRF OEM Tyres & Bando Belts' },
    { zoneCode: 'ZONE-P2-MC', zoneName: 'Plant 2 Motorcycle Powertrain', plant: 'HMSI Narsapur Plant 2', warehouse: 'RM-WH-02', binCount: 150, occupiedBins: 95, utilization: '63%', velocityClass: 'Class A (Fast Mover)', category: 'CB350 Engine Sub-Assemblies' }
  ],

  binMaster: [
    { binCode: 'RM-A03-R04-S02-B05', zone: 'Zone A - Powertrain & Electronics', binType: 'High-Bay Heavy Rack', maxCapacity: 1000, currentQty: 650, storedMaterial: 'HND-THROT-KEIHIN (Throttle Body)', status: 'Occupied' },
    { binCode: 'RM-A02-R02-S01-B02', zone: 'Zone A - Powertrain & Electronics', binType: 'High-Bay Heavy Rack', maxCapacity: 800, currentQty: 400, storedMaterial: 'HND-STR-MITSUBA (ACG Starter)', status: 'Occupied' },
    { binCode: 'RM-B02-R01-S01-B01', zone: 'Zone B - Chassis & Braking', binType: 'Small Parts Shelf', maxCapacity: 500, currentQty: 50, storedMaterial: 'HND-ECU-KEIHIN-01 (Master ECU)', status: 'Occupied' },
    { binCode: 'RM-C01-R01-S01-B01', zone: 'Zone C - Electrical & Lighting', binType: 'High-Bay Heavy Rack', maxCapacity: 1200, currentQty: 480, storedMaterial: 'HND-SHK-SHOWA (Fork Set)', status: 'Occupied' },
    { binCode: 'RM-D01-R01-S01-B01', zone: 'Zone D - Tyres & Rubber Parts', binType: 'Floor Staging Pallet', maxCapacity: 1500, currentQty: 950, storedMaterial: 'HND-TYR-MRF-90 (MRF Tyres)', status: 'Occupied' },
    { binCode: 'RM-A01-R01-S01-B01', zone: 'Zone A - Powertrain & Electronics', binType: 'High-Bay Heavy Rack', maxCapacity: 1000, currentQty: 0, storedMaterial: 'Empty / Available', status: 'Empty' },
    { binCode: 'P2-RM-A01-B01', zone: 'High-Bay VNA Racks', binType: 'High-Bay Heavy Rack', maxCapacity: 800, currentQty: 520, storedMaterial: 'HND-BRK-NISSIN (Front Disc Brake)', status: 'Occupied' }
  ],

  // 16. Users & Roles Security Master
  userMaster: [
    { userId: 'HND-USR-1001', name: 'Rajesh Sharma', role: 'WMS_ADMIN', plant: 'Both Plants (Enterprise)', shift: 'General (08:00 - 17:00)', status: 'ACTIVE', assignedDevice: 'PC Console (WH-MGR-01)' },
    { userId: 'HND-USR-1002', name: 'Sanjay Verma', role: 'WAREHOUSE_OP', plant: 'HMSI Plant 1 (Scooter)', shift: 'Shift A (06:00 - 14:30)', status: 'ACTIVE', assignedDevice: 'Zebra TC57 Handheld (#04)' },
    { userId: 'HND-USR-1003', name: 'Ramesh Gowda', role: 'SECURITY_OFFICER', plant: 'HMSI Plant 1 (Scooter)', shift: 'Shift A (06:00 - 14:30)', status: 'ACTIVE', assignedDevice: 'Zebra TC26 Handheld (#01)' },
    { userId: 'HND-USR-1004', name: 'Anand Murthy', role: 'LINE_SUPERVISOR', plant: 'HMSI Plant 1 (Scooter)', shift: 'Shift A (06:00 - 14:30)', status: 'ACTIVE', assignedDevice: 'Shopfloor Line Tablet (#L1)' },
    { userId: 'HND-USR-1005', name: 'Vikram Patil', role: 'FORKLIFT_DRIVER', plant: 'HMSI Plant 1 (Scooter)', shift: 'Shift B (14:30 - 23:00)', status: 'ACTIVE', assignedDevice: 'Forklift Vehicle Mount (#03)' },
    { userId: 'HND-USR-1006', name: 'Praveen Kumar', role: 'WAREHOUSE_OP', plant: 'HMSI Plant 2 (Motorcycle)', shift: 'Shift A (06:00 - 14:30)', status: 'ACTIVE', assignedDevice: 'Zebra TC57 Handheld (#08)' }
  ],

  // 17. SAP S/4HANA Sync Hub Logs
  sapSyncLogs: [
    { syncId: 'SAP-SYNC-8821', interfaceId: 'BAPI_GOODSMVT_CREATE', direction: 'OUTBOUND', sapDocNo: 'SAP-DOC-5001928491', wmsRef: 'GRN-HND-2026-00481', payloadType: 'Movement 101 (GRN)', status: 'SUCCESS (200 OK)', timestamp: '23-Sep-2026 14:25:10' },
    { syncId: 'SAP-SYNC-8820', interfaceId: 'ODATA_KANBAN_CONSUME', direction: 'OUTBOUND', sapDocNo: 'SAP-MAT-80019482', wmsRef: 'MR-HND-2026-00129', payloadType: 'Movement 261 (GI to Line)', status: 'SUCCESS (200 OK)', timestamp: '23-Sep-2026 12:45:00' },
    { syncId: 'SAP-SYNC-8819', interfaceId: 'BAPI_PO_GETDETAIL1', direction: 'INBOUND', sapDocNo: 'SAP-PO-4500198421', wmsRef: 'PO-HND-2026-00421', payloadType: 'Purchase Order Schedule', status: 'SUCCESS (200 OK)', timestamp: '23-Sep-2026 08:00:15' },
    { syncId: 'SAP-SYNC-8818', interfaceId: 'BAPI_PO_CREATE (STO)', direction: 'OUTBOUND', sapDocNo: 'SAP-STO-4500199100', wmsRef: 'STO-HND-2026-00129', payloadType: 'Movement 301 (P1 ➔ P2)', status: 'SUCCESS (200 OK)', timestamp: '23-Sep-2026 11:15:30' }
  ],

  // 18. Inbound Discrepancies & Truck Shortage Log
  discrepancies: [
    {
      issueId: 'DISC-HND-2026-9041',
      vehicleNo: 'KA-01-AB-4821',
      poNumber: 'PO-HND-2026-00421',
      asnNumber: 'ASN-HND-2026-00391',
      supplier: 'Keihin India Electronics Pvt Ltd',
      materialCode: 'HND-THROT-KEIHIN',
      materialDescription: 'Keihin PGM-FI 26mm Throttle Body',
      expectedQty: 500,
      receivedGoodQty: 480,
      shortageDamagedQty: 20,
      uom: 'EA',
      discrepancyType: 'Truck Unload Shortage (1 Box Missing)',
      quarantineBin: 'QC-REJECT-ZONE-01',
      status: 'Debit Note Issued & Supplier Notified',
      reportedBy: 'Sanjay Verma (Dock 04)',
      timestamp: '23-Sep-2026 09:12:44',
      sapDebitNote: 'SAP-DN-9002198'
    },
    {
      issueId: 'DISC-HND-2026-9042',
      vehicleNo: 'KA-53-Z-9912',
      poNumber: 'PO-HND-2026-00425',
      asnNumber: 'ASN-HND-2026-00394',
      supplier: 'Showa India Pvt Ltd',
      materialCode: 'HND-SHK-SHOWA',
      materialDescription: 'Showa Telescopic Hydraulic Front Suspension',
      expectedQty: 400,
      receivedGoodQty: 385,
      shortageDamagedQty: 15,
      uom: 'SET',
      discrepancyType: 'Damaged in Transit (Broken Crate)',
      quarantineBin: 'QC-REJECT-ZONE-02',
      status: 'Return to Vendor (RTV) Pending',
      reportedBy: 'Praveen Kumar (Dock 05)',
      timestamp: '23-Sep-2026 11:45:10',
      sapDebitNote: 'SAP-DN-9002204'
    },
    {
      issueId: 'DISC-HND-2026-9043',
      vehicleNo: 'KA-04-H-8821',
      poNumber: 'PO-HND-2026-00422',
      asnNumber: 'ASN-HND-2026-00392',
      supplier: 'Mitsuba Sical India Pvt Ltd',
      materialCode: 'HND-STR-MITSUBA',
      materialDescription: 'Mitsuba ACG Silent Starter 12V',
      expectedQty: 400,
      receivedGoodQty: 395,
      shortageDamagedQty: 5,
      uom: 'EA',
      discrepancyType: 'Vendor Pack Count Mismatch',
      quarantineBin: 'QC-REJECT-ZONE-01',
      status: 'Commercial Credit Approved',
      reportedBy: 'Sanjay Verma (Dock 02)',
      timestamp: '23-Sep-2026 10:15:20',
      sapDebitNote: 'SAP-DN-9002189'
    }
  ]
};

// LocalStorage Load & Save Engine
function loadWMSState() {
  try {
    const saved = localStorage.getItem(WMS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.materials && parsed.handlingUnits) {
        if (!parsed.binMaster || !parsed.binMaster.length) parsed.binMaster = WMS_DEFAULT_STATE.binMaster;
        if (!parsed.userMaster || !parsed.userMaster.length) parsed.userMaster = WMS_DEFAULT_STATE.userMaster;
        if (!parsed.sapSyncLogs || !parsed.sapSyncLogs.length) parsed.sapSyncLogs = WMS_DEFAULT_STATE.sapSyncLogs;
        if (!parsed.areaMaster || !parsed.areaMaster.length) parsed.areaMaster = WMS_DEFAULT_STATE.areaMaster;
        if (!parsed.discrepancies || !parsed.discrepancies.length) parsed.discrepancies = WMS_DEFAULT_STATE.discrepancies;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('WMS: Failed to parse localStorage state. Resetting to Honda default.');
  }
  saveWMSState(WMS_DEFAULT_STATE);
  return JSON.parse(JSON.stringify(WMS_DEFAULT_STATE));
}

function saveWMSState(state) {
  try {
    localStorage.setItem(WMS_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('WMS: Failed to persist state into localStorage.', e);
  }
}

function resetWMSData() {
  localStorage.removeItem(WMS_STORAGE_KEY);
  window.wms = JSON.parse(JSON.stringify(WMS_DEFAULT_STATE));
  saveWMSState(window.wms);
}

// Universal CSV Export Function
function exportTableToCSV(dataArray, filename = 'Honda_WMS_Export.csv') {
  if (!dataArray || !dataArray.length) {
    alert('No data available to export.');
    return;
  }
  
  const headers = Object.keys(dataArray[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of dataArray) {
    const values = headers.map(header => {
      let val = row[header];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val).replace(/"/g, '""');
      } else {
        val = ('' + (val ?? '')).replace(/"/g, '""');
      }
      return `"${val}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
