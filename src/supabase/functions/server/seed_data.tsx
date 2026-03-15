// Comprehensive 1-Month Seed Data - Complete services_metadata for all quotations
import { db, splitForInsert } from "./db.ts";

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const dateOnly = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

let quoteCounter = 1;
const genQuoteNum = (daysBack: number) => {
  const date = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const num = String(quoteCounter++).padStart(2, '0');
  return `IQ${year}${month}${day}${num}`;
};

let projectCounter = 1;
const genProjectNum = () => `PROJ-2025-${String(projectCounter++).padStart(3, '0')}`;

export async function seedComprehensiveData() {
  console.log("🌱 Starting comprehensive 1-month seed...");
  
  let customerCount = 0;
  let contactCount = 0;
  let quotationCount = 0;
  let projectCount = 0;
  
  // ==================== CUSTOMERS ====================
  const customers = [
    { 
      id: "CUST-001", 
      name: "Pacific Electronics Manufacturing Corp.", 
      industry: "Electronics & Technology", 
      credit_terms: "Net 30",
      address: "Laguna Technopark, Biñan, Laguna", 
      phone: "+63 49 511 2345", 
      email: "procurement@pacificelec.ph", 
      created_at: daysAgo(30),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(30)
    },
    { 
      id: "CUST-002", 
      name: "Manila Fashion Distributors Inc.", 
      industry: "Textile & Apparel", 
      credit_terms: "Net 30",
      address: "Binondo, Manila", 
      phone: "+63 2 8242 5678", 
      email: "logistics@manilafashion.com", 
      created_at: daysAgo(28),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(28)
    },
    { 
      id: "CUST-003", 
      name: "Cebu Food Products Corporation", 
      industry: "Food & Beverage", 
      credit_terms: "Net 30",
      address: "Mandaue City, Cebu", 
      phone: "+63 32 345 6789", 
      email: "imports@cebufood.ph", 
      created_at: daysAgo(27),
      created_by: "user-bd-manager-001",
      updated_at: daysAgo(27)
    },
    { 
      id: "CUST-004", 
      name: "AutoParts Solutions Philippines", 
      industry: "Automotive", 
      credit_terms: "Net 45",
      address: "Valenzuela City", 
      phone: "+63 2 8292 3456", 
      email: "supply@autoparts.ph", 
      created_at: daysAgo(25),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(25)
    },
    { 
      id: "CUST-005", 
      name: "BuildRight Construction Supplies", 
      industry: "Construction", 
      credit_terms: "Net 30",
      address: "Pasig City", 
      phone: "+63 2 8631 4567", 
      email: "procurement@buildright.ph", 
      created_at: daysAgo(23),
      created_by: "user-bd-manager-001",
      updated_at: daysAgo(23)
    },
    { 
      id: "CUST-006", 
      name: "MedSupply Pharmaceuticals Inc.", 
      industry: "Healthcare & Pharma", 
      credit_terms: "Net 15",
      address: "Makati City", 
      phone: "+63 2 8845 6789", 
      email: "logistics@medsupply.ph", 
      created_at: daysAgo(22),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(22)
    },
    { 
      id: "CUST-007", 
      name: "TechGadget Retail Chain", 
      industry: "Electronics & Technology", 
      credit_terms: "Net 30",
      address: "Quezon City", 
      phone: "+63 2 8376 7890", 
      email: "import@techgadget.ph", 
      created_at: daysAgo(18),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(18)
    },
    { 
      id: "CUST-008", 
      name: "GreenEnergy Solutions Inc.", 
      industry: "Renewable Energy", 
      credit_terms: "Net 30",
      address: "Taguig City", 
      phone: "+63 2 8856 2345", 
      email: "projects@greenenergy.ph", 
      created_at: daysAgo(12),
      created_by: "user-bd-manager-001",
      updated_at: daysAgo(12)
    },
  ];
  
  for (const customer of customers) {
    await db.from("customers").upsert(customer, { onConflict: "id" });
    customerCount++;
  }
  
  // ==================== CONTACTS ====================
  const contacts = [
    { 
      id: "CONTACT-001", 
      customer_id: "CUST-001", 
      name: "Robert Chen", 
      title: "Procurement Manager", 
      email: "r.chen@pacificelec.ph", 
      phone: "+63 917 123 4567", 
      notes: "Primary contact for all electronic component imports",
      created_at: daysAgo(30),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(30)
    },
    { 
      id: "CONTACT-002", 
      customer_id: "CUST-001", 
      name: "Anna Lim", 
      title: "Logistics Coordinator", 
      email: "a.lim@pacificelec.ph", 
      phone: "+63 917 234 5678", 
      notes: "Handles day-to-day shipment coordination",
      created_at: daysAgo(30),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(30)
    },
    { 
      id: "CONTACT-003", 
      customer_id: "CUST-002", 
      name: "Isabel Garcia", 
      title: "Import Manager", 
      email: "i.garcia@manilafashion.com", 
      phone: "+63 918 456 7890", 
      notes: "Decision maker for all textile imports",
      created_at: daysAgo(28),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(28)
    },
    { 
      id: "CONTACT-004", 
      customer_id: "CUST-003", 
      name: "Maria Santos", 
      title: "Purchasing Head", 
      email: "m.santos@cebufood.ph", 
      phone: "+63 919 678 9012", 
      notes: "Primary contact for food product imports",
      created_at: daysAgo(27),
      created_by: "user-bd-manager-001",
      updated_at: daysAgo(27)
    },
    { 
      id: "CONTACT-005", 
      customer_id: "CUST-004", 
      name: "David Wong", 
      title: "Supply Chain Manager", 
      email: "d.wong@autoparts.ph", 
      phone: "+63 920 890 1234", 
      notes: "Manages all automotive parts procurement",
      created_at: daysAgo(25),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(25)
    },
    { 
      id: "CONTACT-006", 
      customer_id: "CUST-005", 
      name: "Jennifer Cruz", 
      title: "Procurement Officer", 
      email: "j.cruz@buildright.ph", 
      phone: "+63 921 901 2345", 
      notes: "Handles construction materials sourcing",
      created_at: daysAgo(23),
      created_by: "user-bd-manager-001",
      updated_at: daysAgo(23)
    },
    { 
      id: "CONTACT-007", 
      customer_id: "CUST-006", 
      name: "Dr. Patricia Reyes", 
      title: "Import Compliance Officer", 
      email: "p.reyes@medsupply.ph", 
      phone: "+63 922 123 4567", 
      notes: "Ensures FDA and BOC compliance for pharma imports",
      created_at: daysAgo(22),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(22)
    },
    { 
      id: "CONTACT-008", 
      customer_id: "CUST-007", 
      name: "Karen Lee", 
      title: "Inventory Manager", 
      email: "k.lee@techgadget.ph", 
      phone: "+63 924 456 7890", 
      notes: "Coordinates gadget inventory and logistics",
      created_at: daysAgo(18),
      created_by: "user-bd-rep-001",
      updated_at: daysAgo(18)
    },
    { 
      id: "CONTACT-009", 
      customer_id: "CUST-008", 
      name: "Thomas Hernandez", 
      title: "Project Coordinator", 
      email: "t.hernandez@greenenergy.ph", 
      phone: "+63 926 789 0123", 
      notes: "Manages solar panel and equipment imports",
      created_at: daysAgo(12),
      created_by: "user-bd-manager-001",
      updated_at: daysAgo(12)
    },
  ];
  
  for (const contact of contacts) {
    await db.from("contacts").upsert(contact, { onConflict: "id" });
    contactCount++;
  }
  
  console.log(`✅ Seeded ${customerCount} customers, ${contactCount} contacts`);
  
  // ==================== QUOTATIONS WITH COMPLETE services_metadata ====================
  
  const quotations = [
    // DRAFT (3)
    {
      id: "quo-001",
      quote_number: genQuoteNum(2),
      quotation_name: "Electronics Components - Shanghai Import",
      customer_id: "cust-001",
      customer_name: "Pacific Electronics Manufacturing Corp.",
      contact_person_id: "cont-001",
      contact_person_name: "Robert Chen",
      created_date: dateOnly(2),
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
      status: "Draft",
      services: ["Forwarding", "Brokerage"],
      services_metadata: [
        {
          service_type: "Forwarding",
          service_details: {
            mode: "Sea",
            incoterms: "FOB",
            cargoType: "General Cargo",
            commodityDescription: "Electronic components and PCBs",
            aolPol: "Shanghai, China",
            aodPod: "Manila, Philippines (MICT)",
            cargoNature: "Dry",
            lclGwt: "2,500 kg",
            lclDims: "15 CBM",
            carrierAirline: "COSCO",
            transitTime: "12",
            route: "Shanghai - Manila",
            stackable: "Yes",
            countryOfOrigin: "China",
            preferentialTreatment: "ACFTA"
          }
        },
        {
          service_type: "Brokerage",
          service_details: {
            brokerageType: "Formal Entry",
            typeOfEntry: "Consumption",
            consumption: "Yes",
            warehousing: "No",
            peza: "No",
            pod: "Manila (MICT)",
            mode: "Sea",
            cargoType: "General Cargo",
            commodityDescription: "Electronic components and PCBs",
            lclGwt: "2,500 kg",
            lclDims: "15 CBM",
            countryOfOrigin: "China",
            preferentialTreatment: "ACFTA"
          }
        }
      ],
      movement: "IMPORT",
      category: "SEA FREIGHT",
      shipment_freight: "LCL",
      commodity: "Electronic components and PCBs",
      pol_aol: "Shanghai, China",
      pod_aod: "Manila, Philippines (MICT)",
      incoterm: "FOB",
      carrier: "COSCO",
      transit_days: 12,
      credit_terms: "30 days",
      validity_period: "15 days",
      created_by: "user-bd-001",
      created_by_name: "John Reyes",
      created_by_department: "Business Development"
    },
    
    {
      id: "quo-002",
      quote_number: genQuoteNum(3),
      quotation_name: "Garment Shipment - Ningbo Import",
      customer_id: "cust-002",
      customer_name: "Manila Fashion Distributors Inc.",
      contact_person_id: "cont-003",
      contact_person_name: "Isabel Garcia",
      created_date: dateOnly(3),
      created_at: daysAgo(3),
      updated_at: daysAgo(3),
      status: "Draft",
      services: ["Forwarding", "Brokerage", "Trucking"],
      services_metadata: [
        {
          service_type: "Forwarding",
          service_details: {
            mode: "Sea",
            incoterms: "CIF",
            cargoType: "General Cargo",
            commodityDescription: "Ready-made garments and textiles",
            aolPol: "Ningbo, China",
            aodPod: "Manila, Philippines",
            cargoNature: "Dry",
            fcl40ft: "2",
            fclQty: 2,
            carrierAirline: "Maersk",
            transitTime: "10",
            route: "Ningbo - Manila",
            stackable: "Yes",
            countryOfOrigin: "China",
            preferentialTreatment: "ACFTA"
          }
        },
        {
          service_type: "Brokerage",
          service_details: {
            brokerageType: "Formal Entry",
            typeOfEntry: "Consumption",
            consumption: "Yes",
            warehousing: "No",
            peza: "No",
            pod: "Manila",
            mode: "Sea",
            cargoType: "General Cargo",
            commodityDescription: "Ready-made garments and textiles",
            fcl40ft: "2",
            fclQty: 2,
            countryOfOrigin: "China",
            preferentialTreatment: "ACFTA"
          }
        },
        {
          service_type: "Trucking",
          service_details: {
            pullOut: "Port of Manila",
            deliveryAddress: "123 Fashion St., Binondo, Manila",
            truckType: "20ft Chassis",
            qty: 2,
            deliveryInstructions: "Deliver to warehouse, contact guard before entry"
          }
        }
      ],
      movement: "IMPORT",
      category: "SEA FREIGHT",
      shipment_freight: "FCL",
      commodity: "Ready-made garments and textiles",
      pol_aol: "Ningbo, China",
      pod_aod: "Manila, Philippines",
      incoterm: "CIF",
      carrier: "Maersk",
      transit_days: 10,
      credit_terms: "45 days",
      validity_period: "20 days",
      created_by: "user-bd-002",
      created_by_name: "Maria Santos",
      created_by_department: "Business Development"
    },
    
    {
      id: "quo-003",
      quote_number: genQuoteNum(4),
      quotation_name: "Urgent Air Shipment - Medical Supplies",
      customer_id: "cust-006",
      customer_name: "MedSupply Pharmaceuticals Inc.",
      contact_person_id: "cont-007",
      contact_person_name: "Dr. Patricia Reyes",
      created_date: dateOnly(4),
      created_at: daysAgo(4),
      updated_at: daysAgo(4),
      status: "Draft",
      services: ["Forwarding", "Brokerage"],
      services_metadata: [
        {
          service_type: "Forwarding",
          service_details: {
            mode: "Air",
            incoterms: "DAP",
            cargoType: "General Cargo",
            commodityDescription: "Pharmaceutical products (temperature controlled)",
            aolPol: "Tokyo, Japan",
            aodPod: "Manila, Philippines (NAIA)",
            cargoNature: "Temperature Controlled",
            airGwt: "450 kg",
            airCwt: "520 kg",
            carrierAirline: "JAL Cargo",
            transitTime: "2",
            route: "Tokyo - Manila Direct",
            stackable: "No - Handle with care",
            countryOfOrigin: "Japan"
          }
        },
        {
          service_type: "Brokerage",
          service_details: {
            brokerageType: "Formal Entry",
            typeOfEntry: "Consumption",
            consumption: "Yes",
            warehousing: "No",
            peza: "No",
            pod: "Manila (NAIA)",
            mode: "Air",
            cargoType: "General Cargo",
            commodityDescription: "Pharmaceutical products",
            airGwt: "450 kg",
            airCwt: "520 kg",
            countryOfOrigin: "Japan"
          }
        }
      ],
      movement: "IMPORT",
      category: "AIR FREIGHT",
      shipment_freight: "Air",
      commodity: "Pharmaceutical products",
      pol_aol: "Tokyo, Japan",
      pod_aod: "Manila, Philippines (NAIA)",
      incoterm: "DAP",
      carrier: "JAL Cargo",
      transit_days: 2,
      credit_terms: "30 days",
      validity_period: "7 days",
      created_by: "user-bd-003",
      created_by_name: "Carlos Lopez",
      created_by_department: "Business Development"
    },
    
    // PENDING PRICING (2)
    {
      id: "quo-004",
      quote_number: genQuoteNum(5),
      quotation_name: "Automotive Parts - Yokohama Import",
      customer_id: "cust-004",
      customer_name: "AutoParts Solutions Philippines",
      contact_person_id: "cont-005",
      contact_person_name: "David Wong",
      created_date: dateOnly(5),
      created_at: daysAgo(5),
      updated_at: daysAgo(5),
      submitted_at: daysAgo(5),
      status: "Pending Pricing",
      services: ["Forwarding", "Brokerage"],
      services_metadata: [
        {
          service_type: "Forwarding",
          service_details: {
            mode: "Sea",
            incoterms: "FOB",
            cargoType: "General Cargo",
            commodityDescription: "Automotive spare parts and accessories",
            aolPol: "Yokohama, Japan",
            aodPod: "Manila, Philippines",
            cargoNature: "Dry",
            lclGwt: "3,200 kg",
            lclDims: "18 CBM",
            carrierAirline: "ONE",
            transitTime: "8",
            route: "Yokohama - Manila",
            stackable: "Yes",
            countryOfOrigin: "Japan"
          }
        },
        {
          service_type: "Brokerage",
          service_details: {
            brokerageType: "Formal Entry",
            typeOfEntry: "Consumption",
            consumption: "Yes",
            warehousing: "No",
            peza: "No",
            pod: "Manila",
            mode: "Sea",
            cargoType: "General Cargo",
            commodityDescription: "Automotive spare parts and accessories",
            lclGwt: "3,200 kg",
            lclDims: "18 CBM",
            countryOfOrigin: "Japan"
          }
        }
      ],
      movement: "IMPORT",
      category: "SEA FREIGHT",
      shipment_freight: "LCL",
      commodity: "Automotive spare parts and accessories",
      pol_aol: "Yokohama, Japan",
      pod_aod: "Manila, Philippines",
      incoterm: "FOB",
      carrier: "ONE",
      transit_days: 8,
      credit_terms: "30 days",
      validity_period: "15 days",
      created_by: "user-bd-001",
      created_by_name: "John Reyes",
      created_by_department: "Business Development"
    },
    
    {
      id: "quo-005",
      quote_number: genQuoteNum(6),
      quotation_name: "Construction Equipment - Shanghai",
      customer_id: "cust-005",
      customer_name: "BuildRight Construction Supplies",
      contact_person_id: "cont-006",
      contact_person_name: "Jennifer Cruz",
      created_date: dateOnly(6),
      created_at: daysAgo(6),
      updated_at: daysAgo(6),
      submitted_at: daysAgo(6),
      status: "Pending Pricing",
      services: ["Forwarding", "Brokerage", "Marine Insurance"],
      services_metadata: [
        {
          service_type: "Forwarding",
          service_details: {
            mode: "Sea",
            incoterms: "CFR",
            cargoType: "Heavy Machinery",
            commodityDescription: "Construction machinery and equipment",
            aolPol: "Shanghai, China",
            aodPod: "Manila, Philippines",
            cargoNature: "Heavy/Oversized",
            fcl40ft: "3",
            fclQty: 3,
            carrierAirline: "MSC",
            transitTime: "14",
            route: "Shanghai - Manila",
            stackable: "No - Heavy equipment",
            countryOfOrigin: "China"
          }
        },
        {
          service_type: "Brokerage",
          service_details: {
            brokerageType: "Formal Entry",
            typeOfEntry: "Consumption",
            consumption: "Yes",
            warehousing: "No",
            peza: "No",
            pod: "Manila",
            mode: "Sea",
            cargoType: "Heavy Machinery",
            commodityDescription: "Construction machinery and equipment",
            fcl40ft: "3",
            fclQty: 3,
            countryOfOrigin: "China"
          }
        },
        {
          service_type: "Marine Insurance",
          service_details: {
            commodityDescription: "Construction machinery and equipment",
            hsCode: "8429.52",
            aolPol: "Shanghai, China",
            aodPod: "Manila, Philippines",
            invoiceValue: 5800000
          }
        }
      ],
      movement: "IMPORT",
      category: "SEA FREIGHT",
      shipment_freight: "FCL",
      commodity: "Construction machinery and equipment",
      pol_aol: "Shanghai, China",
      pod_aod: "Manila, Philippines",
      incoterm: "CFR",
      carrier: "MSC",
      transit_days: 14,
      credit_terms: "60 days",
      validity_period: "20 days",
      created_by: "user-bd-002",
      created_by_name: "Maria Santos",
      created_by_department: "Business Development"
    },
    
    // PRiced (2) - has pricing filled in
    {
      id: "quo-006",
      quote_number: genQuoteNum(10),
      quotation_name: "Consumer Electronics - Shenzhen Import",
      customer_id: "cust-007",
      customer_name: "TechGadget Retail Chain",
      contact_person_id: "cont-008",
      contact_person_name: "Karen Lee",
      created_date: dateOnly(10),
      created_at: daysAgo(10),
      updated_at: daysAgo(8),
      submitted_at: daysAgo(10),
      priced_at: daysAgo(8),
      status: "Priced",
      services: ["Forwarding", "Brokerage"],
      services_metadata: [
        {
          service_type: "Forwarding",
          service_details: {
            mode: "Sea",
            incoterms: "FOB",
            cargoType: "General Cargo",
            commodityDescription: "Consumer electronics and gadgets",
            aolPol: "Shenzhen, China",
            aodPod: "Manila, Philippines",
            cargoNature: "Dry",
            lclGwt: "1,800 kg",
            lclDims: "12 CBM",
            carrierAirline: "COSCO",
            transitTime: "11",
            route: "Shenzhen - Manila",
            stackable: "Yes",
            countryOfOrigin: "China",
            preferentialTreatment: "ACFTA"
          }
        },
        {
          service_type: "Brokerage",
          service_details: {
            brokerageType: "Formal Entry",
            typeOfEntry: "Consumption",
            consumption: "Yes",
            warehousing: "No",
            peza: "No",
            pod: "Manila",
            mode: "Sea",
            cargoType: "General Cargo",
            commodityDescription: "Consumer electronics and gadgets",
            lclGwt: "1,800 kg",
            lclDims: "12 CBM",
            countryOfOrigin: "China",
            preferentialTreatment: "ACFTA"
          }
        }
      ],
      charge_categories: [
        { id: "cat-001", name: "Ocean Freight", line_items: [{ id: "item-001", description: "LCL Sea Freight (Shanghai-Manila)", qty: 12, unit: "CBM", unit_price: 1800, amount: 21600, vendor: "COSCO Shipping", remarks: "" }], subtotal: 21600 },
        { id: "cat-002", name: "Customs Brokerage", line_items: [{ id: "item-002", description: "Formal Entry Processing", qty: 1, unit: "Shipment", unit_price: 8500, amount: 8500, vendor: "In-house", remarks: "" }], subtotal: 8500 }
      ],
      currency: "PHP",
      financial_summary: { subtotal: 30100, discount: 0, total_before_tax: 30100, vat: 3612, grand_total: 33712 },
      movement: "IMPORT",
      category: "SEA FREIGHT",
      shipment_freight: "LCL",
      commodity: "Consumer electronics and gadgets",
      pol_aol: "Shenzhen, China",
      pod_aod: "Manila, Philippines",
      incoterm: "FOB",
      carrier: "COSCO",
      transit_days: 11,
      credit_terms: "30 days",
      validity_period: "15 days",
      created_by: "user-bd-001",
      created_by_name: "John Reyes",
      created_by_department: "Business Development"
    },
    
    {
      id: "quo-007",
      quote_number: genQuoteNum(12),
      quotation_name: "Solar Panels - Taiwan Import",
      customer_id: "cust-008",
      customer_name: "GreenEnergy Solutions Inc.",
      contact_person_id: "cont-009",
      contact_person_name: "Thomas Hernandez",
      created_date: dateOnly(12),
      created_at: daysAgo(12),
      updated_at: daysAgo(10),
      submitted_at: daysAgo(12),
      priced_at: daysAgo(10),
      status: "Priced",
      services: ["Forwarding", "Brokerage"],
      services_metadata: [
        {
          service_type: "Forwarding",
          service_details: {
            mode: "Sea",
            incoterms: "FOB",
            cargoType: "General Cargo",
            commodityDescription: "Solar panels and inverters",
            aolPol: "Kaohsiung, Taiwan",
            aodPod: "Manila, Philippines",
            cargoNature: "Fragile - Handle with care",
            fcl40ft: "1",
            fclQty: 1,
            carrierAirline: "Evergreen",
            transitTime: "5",
            route: "Kaohsiung - Manila Direct",
            stackable: "No - Fragile",
            countryOfOrigin: "Taiwan"
          }
        },
        {
          service_type: "Brokerage",
          service_details: {
            brokerageType: "Formal Entry",
            typeOfEntry: "Consumption",
            consumption: "Yes",
            warehousing: "No",
            peza: "No",
            pod: "Manila",
            mode: "Sea",
            cargoType: "General Cargo",
            commodityDescription: "Solar panels and inverters",
            fcl40ft: "1",
            fclQty: 1,
            countryOfOrigin: "Taiwan"
          }
        }
      ],
      charge_categories: [
        { id: "cat-001", name: "Ocean Freight", line_items: [{ id: "item-001", description: "FCL 40ft (Kaohsiung-Manila)", qty: 1, unit: "Container", unit_price: 95000, amount: 95000, vendor: "Evergreen Line", remarks: "" }], subtotal: 95000 },
        { id: "cat-002", name: "Customs Brokerage", line_items: [{ id: "item-002", description: "Formal Entry Processing", qty: 1, unit: "Shipment", unit_price: 12000, amount: 12000, vendor: "In-house", remarks: "" }], subtotal: 12000 }
      ],
      currency: "PHP",
      financial_summary: { subtotal: 107000, discount: 0, total_before_tax: 107000, vat: 12840, grand_total: 119840 },
      movement: "IMPORT",
      category: "SEA FREIGHT",
      shipment_freight: "FCL",
      commodity: "Solar panels and inverters",
      pol_aol: "Kaohsiung, Taiwan",
      pod_aod: "Manila, Philippines",
      incoterm: "FOB",
      carrier: "Evergreen",
      transit_days: 5,
      credit_terms: "30 days",
      validity_period: "20 days",
      created_by: "user-bd-003",
      created_by_name: "Carlos Lopez",
      created_by_department: "Business Development"
    },
    
    // ACCEPTED BY CLIENT (2) - Ready to become projects
    {
      id: "quo-008",
      quote_number: genQuoteNum(15),
      quotation_name: "PCB Shipment - Taipei Import",
      customer_id: "cust-001",
      customer_name: "Pacific Electronics Manufacturing Corp.",
      contact_person_id: "cont-001",
      contact_person_name: "Robert Chen",
      created_date: dateOnly(15),
      created_at: daysAgo(15),
      updated_at: daysAgo(8),
      submitted_at: daysAgo(15),
      priced_at: daysAgo(13),
      sent_to_client_at: daysAgo(12),
      client_accepted_at: daysAgo(8),
      status: "Accepted by Client",
      services: ["Forwarding", "Brokerage"],
      services_metadata: [
        {
          service_type: "Forwarding",
          service_details: {
            mode: "Air",
            incoterms: "EXW",
            cargoType: "General Cargo",
            commodityDescription: "Printed Circuit Boards (PCBs)",
            aolPol: "Taipei, Taiwan",
            aodPod: "Manila, Philippines (NAIA)",
            cargoNature: "Fragile",
            airGwt: "350 kg",
            airCwt: "420 kg",
            carrierAirline: "China Airlines Cargo",
            transitTime: "1",
            route: "Taipei - Manila Direct",
            stackable: "No - Fragile electronics",
            countryOfOrigin: "Taiwan"
          }
        },
        {
          service_type: "Brokerage",
          service_details: {
            brokerageType: "Formal Entry",
            typeOfEntry: "Consumption",
            consumption: "Yes",
            warehousing: "No",
            peza: "No",
            pod: "Manila (NAIA)",
            mode: "Air",
            cargoType: "General Cargo",
            commodityDescription: "Printed Circuit Boards (PCBs)",
            airGwt: "350 kg",
            airCwt: "420 kg",
            countryOfOrigin: "Taiwan"
          }
        }
      ],
      charge_categories: [
        { id: "cat-001", name: "Air Freight", line_items: [{ id: "item-001", description: "Air Freight (Taipei-Manila)", qty: 420, unit: "kg", unit_price: 185, amount: 77700, vendor: "China Airlines Cargo", remarks: "Chargeable weight" }], subtotal: 77700 },
        { id: "cat-002", name: "Customs Brokerage", line_items: [{ id: "item-002", description: "Formal Entry Processing", qty: 1, unit: "Shipment", unit_price: 7500, amount: 7500, vendor: "In-house", remarks: "" }], subtotal: 7500 }
      ],
      currency: "PHP",
      financial_summary: { subtotal: 85200, discount: 0, total_before_tax: 85200, vat: 10224, grand_total: 95424 },
      movement: "IMPORT",
      category: "AIR FREIGHT",
      shipment_freight: "Air",
      commodity: "Printed Circuit Boards (PCBs)",
      pol_aol: "Taipei, Taiwan",
      pod_aod: "Manila, Philippines (NAIA)",
      incoterm: "EXW",
      carrier: "China Airlines Cargo",
      transit_days: 1,
      credit_terms: "30 days",
      validity_period: "10 days",
      created_by: "user-bd-001",
      created_by_name: "John Reyes",
      created_by_department: "Business Development"
    },
    
    {
      id: "quo-009",
      quote_number: genQuoteNum(18),
      quotation_name: "Textile Shipment - Guangzhou Import",
      customer_id: "cust-002",
      customer_name: "Manila Fashion Distributors Inc.",
      contact_person_id: "cont-003",
      contact_person_name: "Isabel Garcia",
      created_date: dateOnly(18),
      created_at: daysAgo(18),
      updated_at: daysAgo(10),
      submitted_at: daysAgo(18),
      priced_at: daysAgo(16),
      sent_to_client_at: daysAgo(14),
      client_accepted_at: daysAgo(10),
      status: "Accepted by Client",
      services: ["Forwarding", "Brokerage", "Trucking"],
      services_metadata: [
        {
          service_type: "Forwarding",
          service_details: {
            mode: "Sea",
            incoterms: "FOB",
            cargoType: "General Cargo",
            commodityDescription: "Textiles and fabrics",
            aolPol: "Guangzhou, China",
            aodPod: "Manila, Philippines",
            cargoNature: "Dry",
            fcl20ft: "1",
            fcl40ft: "1",
            fclQty: 2,
            carrierAirline: "COSCO",
            transitTime: "11",
            route: "Guangzhou - Manila",
            stackable: "Yes",
            countryOfOrigin: "China",
            preferentialTreatment: "ACFTA"
          }
        },
        {
          service_type: "Brokerage",
          service_details: {
            brokerageType: "Formal Entry",
            typeOfEntry: "Consumption",
            consumption: "Yes",
            warehousing: "No",
            peza: "No",
            pod: "Manila",
            mode: "Sea",
            cargoType: "General Cargo",
            commodityDescription: "Textiles and fabrics",
            fcl20ft: "1",
            fcl40ft: "1",
            fclQty: 2,
            countryOfOrigin: "China",
            preferentialTreatment: "ACFTA"
          }
        },
        {
          service_type: "Trucking",
          service_details: {
            pullOut: "Port of Manila",
            deliveryAddress: "789 Textile Ave., Binondo, Manila",
            truckType: "20ft + 40ft Chassis",
            qty: 2,
            deliveryInstructions: "Call before delivery, gate hours 8AM-5PM"
          }
        }
      ],
      charge_categories: [
        { id: "cat-001", name: "Ocean Freight", line_items: [
          { id: "item-001", description: "FCL 20ft (Guangzhou-Manila)", qty: 1, unit: "Container", unit_price: 65000, amount: 65000, vendor: "COSCO", remarks: "" },
          { id: "item-002", description: "FCL 40ft (Guangzhou-Manila)", qty: 1, unit: "Container", unit_price: 95000, amount: 95000, vendor: "COSCO", remarks: "" }
        ], subtotal: 160000},
        { id: "cat-002", name: "Customs Brokerage", line_items: [{ id: "item-003", description: "Formal Entry Processing", qty: 1, unit: "Shipment", unit_price: 15000, amount: 15000, vendor: "In-house", remarks: "" }], subtotal: 15000 },
        { id: "cat-003", name: "Trucking", line_items: [
          { id: "item-004", description: "Container delivery - 20ft", qty: 1, unit: "Trip", unit_price: 4500, amount: 4500, vendor: "Metro Logistics", remarks: "" },
          { id: "item-005", description: "Container delivery - 40ft", qty: 1, unit: "Trip", unit_price: 6500, amount: 6500, vendor: "Metro Logistics", remarks: "" }
        ], subtotal: 11000}
      ],
      currency: "PHP",
      financial_summary: { subtotal: 186000, discount: 0, total_before_tax: 186000, vat: 22320, grand_total: 208320 },
      movement: "IMPORT",
      category: "SEA FREIGHT",
      shipment_freight: "FCL",
      commodity: "Textiles and fabrics",
      pol_aol: "Guangzhou, China",
      pod_aod: "Manila, Philippines",
      incoterm: "FOB",
      carrier: "COSCO",
      transit_days: 11,
      credit_terms: "45 days",
      validity_period: "20 days",
      created_by: "user-bd-002",
      created_by_name: "Maria Santos",
      created_by_department: "Business Development"
    }
  ];
  
  const QUOTATION_COLS = [
    "id", "quotation_number", "quotation_type", "customer_id", "customer_name",
    "contact_id", "contact_name", "consignee_id", "services", "services_metadata",
    "pricing", "vendors", "status", "validity_date", "created_by", "created_by_name",
    "assigned_to", "contract_status", "contract_start_date", "contract_end_date",
    "renewal_terms", "auto_renew", "contract_notes", "parent_contract_id",
    "total_selling", "total_buying", "currency", "notes", "internal_notes", "tags",
    "created_at", "updated_at", "details",
    "quote_number", "quotation_name", "contact_person_id", "submitted_at",
    "converted_at", "project_id", "quotation_date", "expiry_date"
  ];
  const PROJECT_COLS = [
    "id", "project_number", "quotation_id", "customer_id", "customer_name",
    "consignee_id", "status", "services", "service_type",
    "manager_id", "manager_name", "supervisor_id", "supervisor_name",
    "handler_id", "handler_name", "created_by", "created_by_name",
    "notes", "tags", "metadata",
    "created_at", "updated_at", "details"
  ];
  for (const quotation of quotations) {
    const qRow = splitForInsert(quotation, QUOTATION_COLS);
    await db.from("quotations").upsert(qRow, { onConflict: "id" });
    quotationCount++;
  }
  
  console.log(`✅ Seeded ${quotationCount} quotations with COMPLETE services_metadata`);
  
  // ==================== CREATE PROJECTS FROM ACCEPTED QUOTATIONS ====================
  // We'll create projects from the 2 "Accepted by Client" quotations
  
  const acceptedQuotations = quotations.filter(q => q.status === "Accepted by Client");
  
  for (const quotation of acceptedQuotations) {
    const projectNum = genProjectNum();
    const project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      project_number: projectNum,
      project_name: quotation.quotation_name,
      customer_id: quotation.customer_id,
      customer_name: quotation.customer_name,
      contact_person_id: quotation.contact_person_id,
      contact_person_name: quotation.contact_person_name,
      quotation_id: quotation.id,
      quotation_number: quotation.quote_number,
      services: quotation.services,
      services_metadata: quotation.services_metadata, // CRITICAL: Copy complete metadata
      movement: quotation.movement,
      category: quotation.category,
      shipment_freight: quotation.shipment_freight,
      commodity: quotation.commodity,
      pol_aol: quotation.pol_aol,
      pod_aod: quotation.pod_aod,
      incoterm: quotation.incoterm,
      carrier: quotation.carrier,
      transit_days: quotation.transit_days,
      charge_categories: quotation.charge_categories || [],
      currency: quotation.currency || "PHP",
      financial_summary: quotation.financial_summary || {},
      status: "Active",
      created_at: daysAgo(7),
      updated_at: daysAgo(7),
      bd_owner_user_id: quotation.created_by,
      bd_owner_user_name: quotation.created_by_name,
      bd_owner_user_department: quotation.created_by_department,
      ops_assigned_user_id: "user-ops-001",
      ops_assigned_user_name: "Sofia Reyes",
      ops_assigned_user_department: "Operations"
    };
    
    const pRow = splitForInsert(project, PROJECT_COLS);
    await db.from("projects").upsert(pRow, { onConflict: "id" });
    projectCount++;
    
    // Update quotation status to "Converted to Project"
    quotation.status = "Converted to Project";
    quotation.converted_at = daysAgo(7);
    quotation.project_id = project.id;
    quotation.project_number = projectNum;
    quotation.updated_at = daysAgo(7);
    const qUpdateRow = splitForInsert(quotation, QUOTATION_COLS);
    await db.from("quotations").upsert(qUpdateRow, { onConflict: "id" });
    
    console.log(`  ✓ Created project ${projectNum} from quotation ${quotation.quote_number}`);
    console.log(`    Services metadata: ${project.services_metadata.length} services with complete details`);
  }
  
  const summary = {
    customers: customerCount,
    contacts: contactCount,
    quotations: quotationCount,
    projects: projectCount
  };
  
  console.log("🎉 Comprehensive seed complete!");
  console.log(`   ${summary.customers} customers`);
  console.log(`   ${summary.contacts} contacts`);
  console.log(`   ${summary.quotations} quotations (all with COMPLETE services_metadata)`);
  console.log(`   ${summary.projects} projects (with inherited metadata)`);
  
  return { success: true, summary };
}