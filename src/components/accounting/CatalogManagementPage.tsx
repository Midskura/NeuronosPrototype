// CatalogManagementPage — Admin page for managing the Expense & Charge Catalog (Item Master)
// Lives under Accounting → Auditing → Item Catalog tab
//
// Tab structure:
//   [Charges]  [Expenses]  |  [Categories]  [Usage & Quality]
//    teal        amber          shared utility tabs

import { useState, useEffect, useCallback, useRef, useMemo, Fragment } from "react";
import { createPortal } from "react-dom";
import {
  Search, Plus, Pencil, X, Check, RotateCcw, AlertTriangle,
  Tag, Info, TrendingUp, TrendingDown, Grid3X3, ChevronDown, MoreHorizontal,
  Container, Palette, Truck, Ship, FileText,
} from "lucide-react";
import { supabase } from "../../utils/supabase/client";
import { toast } from "../ui/toast-utils";
import { ChargeExpenseMatrix } from "./ChargeExpenseMatrix";
import { CustomDropdown } from "../bd/CustomDropdown";

// ==================== TYPES ====================

interface CatalogItem {
  id: string;
  name: string;
  type: "charge" | "expense" | "both" | null;
  category_id: string | null;
  category_name?: string;
  description: string | null;
  default_price: number | null;
  currency: string;
  unit_type: string | null;
  tax_code: string | null;
  charge_type_code: string | null;
  is_active: boolean;
  service_types: string[];
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

interface CatalogCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_default: boolean;
  item_count?: number;
}

// "charges" and "expenses" are type-filtered item views
// "matrix" is the rate pivot table
// Categories are managed inline via the category filter dropdown
// Usage is shown as a column inside the Charges/Expenses tables
type Tab = "charges" | "expenses" | "matrix";

// ==================== SEMANTIC COLORS ====================

const CHARGE_COLOR = "#0F766E";  // teal — revenue side
const EXPENSE_COLOR = "#D97706"; // amber — cost side

// Service type icons matching the sidebar module icons
const SERVICE_ICONS: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  "Forwarding": Container,
  "Brokerage": Palette,
  "Trucking": Truck,
  "Marine Insurance": Ship,
  "Others": FileText,
};

// ==================== HELPERS ====================

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function uniqueSlug(base: string, existingCodes: (string | null)[]): string {
  const codes = new Set(existingCodes.filter(Boolean));
  if (!codes.has(base)) return base;
  let i = 2;
  while (codes.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

// Returns the teal/amber color for a tab
function tabColor(key: Tab): string {
  if (key === "charges") return CHARGE_COLOR;
  if (key === "expenses") return EXPENSE_COLOR;
  return CHARGE_COLOR;
}

// ==================== MAIN COMPONENT ====================

export function CatalogManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("charges");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [stats, setStats] = useState({
    chargeItems: 0,
    expenseItems: 0,
    inactiveItems: 0,
    categories: 0,
    linkedPct: null as number | null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [
        { count: chargeCount },
        { count: expenseCount },
        { count: inactiveCount },
        { count: catCount },
        { count: totalBilling },
        { count: linkedBilling },
      ] = await Promise.all([
        // charge items: type is "charge", "both", or null (legacy items without type)
        supabase.from("catalog_items").select("id", { count: "exact", head: true })
          .eq("is_active", true).or("type.eq.charge,type.eq.both,type.is.null"),
        // expense items: type is "expense" or "both"
        supabase.from("catalog_items").select("id", { count: "exact", head: true })
          .eq("is_active", true).or("type.eq.expense,type.eq.both"),
        supabase.from("catalog_items").select("id", { count: "exact", head: true }).eq("is_active", false),
        supabase.from("catalog_categories").select("id", { count: "exact", head: true }),
        supabase.from("billing_line_items").select("id", { count: "exact", head: true }),
        supabase.from("billing_line_items").select("id", { count: "exact", head: true })
          .not("catalog_item_id", "is", null),
      ]);
      setStats({
        chargeItems: chargeCount ?? 0,
        expenseItems: expenseCount ?? 0,
        inactiveItems: inactiveCount ?? 0,
        categories: catCount ?? 0,
        linkedPct: (totalBilling ?? 0) > 0
          ? Math.round(((linkedBilling ?? 0) / (totalBilling ?? 0)) * 100)
          : null,
      });
    } catch (err) {
      console.error("Error fetching catalog stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const { linkedPct } = stats;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
      <div style={{ padding: "32px 48px", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: "24px", flexShrink: 0 }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#12332B", marginBottom: "4px", letterSpacing: "-1.2px" }}>
            Catalog
          </h1>
          <p style={{ fontSize: "14px", color: "#667085" }}>
            Define charges and expenses, then analyze how they appear across bookings.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: activeTab === "matrix" ? "hidden" : "visible" }}>

      {/* ── Stats Bar ── */}
      {statsLoading ? (
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
          <div style={{ height: "13px", width: "72px", backgroundColor: "#F0F0F0", borderRadius: "4px" }} />
          <div style={{ height: "13px", width: "72px", backgroundColor: "#F0F0F0", borderRadius: "4px" }} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", fontSize: "13px", color: "#667085" }}>
          <span><strong style={{ color: CHARGE_COLOR, fontWeight: 600 }}>{stats.chargeItems}</strong> charges</span>
          <span style={{ color: "#D1D5DB" }}>·</span>
          <span><strong style={{ color: EXPENSE_COLOR, fontWeight: 600 }}>{stats.expenseItems}</strong> expenses</span>
          <span style={{ color: "#D1D5DB" }}>·</span>
          <span><strong style={{ color: "#12332B", fontWeight: 600 }}>{stats.categories}</strong> categories</span>
          {linkedPct !== null && (
            <>
              <span style={{ color: "#D1D5DB" }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <strong style={{
                  fontWeight: 600,
                  color: linkedPct >= 90 ? "#059669" : linkedPct >= 50 ? "#D97706" : "#DC2626",
                }}>{linkedPct}%</strong>
                linked
                <span
                  title="% of billing lines linked to a catalog item. Low rates mean freetext entries are bypassing the catalog."
                  style={{ cursor: "help", color: "#C0C7CC", display: "flex", alignItems: "center" }}
                >
                  <Info size={11} />
                </span>
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #E0E6E4", marginBottom: "20px" }}>
        {/* Type tabs — left group */}
        {(["charges", "expenses"] as Tab[]).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? tabColor(key) : "#667085",
              background: "none",
              border: "none",
              borderBottom: activeTab === key ? `2px solid ${tabColor(key)}` : "2px solid transparent",
              cursor: "pointer",
              marginBottom: "-1px",
              textTransform: "capitalize",
            }}
          >
            {key === "charges"
              ? <TrendingUp size={14} />
              : <TrendingDown size={14} />}
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}

        {/* Separator */}
        <div style={{ width: 1, height: 20, backgroundColor: "#E0E6E4", margin: "0 8px" }} />

        {/* Rate Matrix tab */}
        <button
          onClick={() => setActiveTab("matrix")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: activeTab === "matrix" ? 600 : 400,
            color: activeTab === "matrix" ? CHARGE_COLOR : "#667085",
            background: "none",
            border: "none",
            borderBottom: activeTab === "matrix" ? `2px solid ${CHARGE_COLOR}` : "2px solid transparent",
            cursor: "pointer",
            marginBottom: "-1px",
          }}
        >
          <Grid3X3 size={14} />
          Rate Matrix
        </button>
      </div>

      {/* ── Tab Content ── */}
      {(activeTab === "charges" || activeTab === "expenses") && (
        <ItemsTab
          typeFilter={activeTab === "charges" ? "charge" : "expense"}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          onMutate={fetchStats}
        />
      )}
      {activeTab === "matrix" && (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <ChargeExpenseMatrix />
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

// ==================== ITEMS TAB ====================

// Column order: Name | Type | Services | Unit·Tax·Curr | Status | Usage | Actions

function ItemsTab({
  typeFilter,
  filterCategory,
  setFilterCategory,
  onMutate,
}: {
  typeFilter: "charge" | "expense";
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  onMutate: () => void;
}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterServiceType, setFilterServiceType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CatalogItem>>({});
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // ── Category grouping ──
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");


  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Partial<CatalogItem>>({
    name: "",
    charge_type_code: "",
    type: typeFilter,
    category_id: null,
    currency: "PHP",
    unit_type: null,
    tax_code: "VAT",
    is_active: true,
    service_types: [],
  });

  const [impactItem, setImpactItem] = useState<CatalogItem | null>(null);
  const [impactCounts, setImpactCounts] = useState<{ billing: number; expenses: number } | null>(null);
  const [relinkTarget, setRelinkTarget] = useState<string>("");
  const [impactLoading, setImpactLoading] = useState(false);

  const allServiceTypes = ["Brokerage", "Trucking", "Forwarding", "Marine Insurance", "Others"];
  const allUnits = ["per_entry", "per_bl", "per_container", "per_shipment", "flat_fee"];
  const allTaxCodes = ["VAT", "NVAT", "ZR", "EX"];

  // Reset addForm.type when typeFilter changes (user switches Charges ↔ Expenses tab)
  useEffect(() => {
    setAddForm(f => ({ ...f, type: typeFilter }));
  }, [typeFilter]);

  // ── Data Fetching ──

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data: itemData }, { data: catData }, { data: catCountData }, { data: usageData }] = await Promise.all([
        supabase
          .from("catalog_items")
          .select("*, catalog_categories(name)")
          .order("sort_order", { ascending: true, nullsFirst: false })
          .order("name"),
        supabase.from("catalog_categories").select("*").order("sort_order"),
        supabase.from("catalog_items").select("category_id").eq("is_active", true),
        supabase.from("billing_line_items").select("catalog_item_id").not("catalog_item_id", "is", null),
      ]);
      if (itemData) {
        setItems(itemData.map((i: any) => ({
          ...i,
          category_name: i.catalog_categories?.name ?? null,
        })));
      }
      if (catData) {
        const countMap: Record<string, number> = {};
        for (const row of catCountData ?? []) {
          if (row.category_id) countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
        }
        setCategories(catData.map((c: any) => ({ ...c, item_count: countMap[c.id] ?? 0 })));
      }
      if (usageData) {
        const uMap: Record<string, number> = {};
        for (const row of usageData) {
          if (row.catalog_item_id) uMap[row.catalog_item_id] = (uMap[row.catalog_item_id] ?? 0) + 1;
        }
        setUsageCounts(uMap);
      }
    } catch (err) {
      console.error("Error fetching catalog:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ──

  const handleSave = async (id: string) => {
    const { catalog_categories: _cc, category_name: _cn, charge_type_code: _ctc, ...updates } = editForm as any;
    const { error } = await supabase.from("catalog_items").update(updates).eq("id", id);
    if (!error) {
      toast.success("Item updated");
      setEditingId(null);
      fetchAll();
      onMutate();
    } else {
      toast.error(error.message || "Error updating item");
    }
  };

  const handleAdd = async () => {
    if (!addForm.name?.trim()) { toast.error("Name is required"); return; }
    const payload = { ...addForm, id: `ci-${Date.now()}`, is_active: true };
    const { error } = await supabase.from("catalog_items").insert(payload);
    if (!error) {
      toast.success(`Created "${addForm.name}"`);
      setShowAddForm(false);
      setAddForm({ name: "", charge_type_code: "", type: typeFilter, category_id: null, currency: "PHP", unit_type: null, tax_code: "VAT", is_active: true, service_types: [] });
      fetchAll();
      onMutate();
    } else {
      toast.error(error.message || "Error creating item");
    }
  };

  const openDeactivateModal = async (item: CatalogItem) => {
    setImpactItem(item);
    setImpactCounts(null);
    setRelinkTarget("");
    setImpactLoading(true);
    try {
      const [{ count: billing }, { count: expenses }] = await Promise.all([
        supabase.from("billing_line_items").select("id", { count: "exact", head: true }).eq("catalog_item_id", item.id),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("catalog_item_id", item.id),
      ]);
      setImpactCounts({ billing: billing ?? 0, expenses: expenses ?? 0 });
    } catch {
      setImpactCounts({ billing: 0, expenses: 0 });
    } finally {
      setImpactLoading(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!impactItem) return;
    if (relinkTarget) {
      await Promise.all([
        supabase.from("billing_line_items").update({ catalog_item_id: relinkTarget }).eq("catalog_item_id", impactItem.id),
        supabase.from("expenses").update({ catalog_item_id: relinkTarget }).eq("catalog_item_id", impactItem.id),
      ]);
    }
    const { error } = await supabase.from("catalog_items").update({ is_active: false }).eq("id", impactItem.id);
    if (!error) {
      toast.success(`"${impactItem.name}" deactivated`);
      setImpactItem(null);
      fetchAll();
      onMutate();
    } else {
      toast.error(error.message || "Error deactivating item");
    }
  };

  const handleReactivate = async (id: string) => {
    const { error } = await supabase.from("catalog_items").update({ is_active: true }).eq("id", id);
    if (!error) { toast.success("Item reactivated"); fetchAll(); onMutate(); }
    else toast.error(error.message || "Error reactivating item");
  };

  // ── Filtering ──

  const filtered = items.filter(item => {
    // Type filter: show items matching the current segment (charges/expenses) or type "both", or null (legacy)
    const t = item.type;
    if (typeFilter === "charge" && t !== null && t !== "charge" && t !== "both") return false;
    if (typeFilter === "expense" && t !== "expense" && t !== "both") return false;
    // Status
    if (filterStatus === "active" && !item.is_active) return false;
    if (filterStatus === "inactive" && item.is_active) return false;
    // Category
    if (filterCategory !== "all" && item.category_id !== filterCategory) return false;
    // Service type
    if (filterServiceType !== "all" && !item.service_types?.includes(filterServiceType)) return false;
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) ||
        (item.category_name ?? "").toLowerCase().includes(q) ||
        (item.charge_type_code ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  // Group filtered items by category when no category filter is active
  const grouped = useMemo(() => {
    if (filterCategory !== "all") return null;
    const map = new Map<string, CatalogItem[]>();
    for (const item of filtered) {
      const key = item.category_id || "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    const result: { key: string; category: CatalogCategory | null; items: CatalogItem[] }[] = [];
    for (const cat of categories) {
      if (map.has(cat.id)) result.push({ key: cat.id, category: cat, items: map.get(cat.id)! });
    }
    if (map.has("__none__")) result.push({ key: "__none__", category: null, items: map.get("__none__")! });
    return result;
  }, [filtered, categories, filterCategory]);

  const allCollapsed = !!grouped && grouped.length > 0 && collapsedGroups.size === grouped.length;
  const collapseAll = () => setCollapsedGroups(new Set(grouped?.map(g => g.key) ?? []));
  const expandAll = () => setCollapsedGroups(new Set());

  const handleCategoryRename = async (id: string) => {
    if (!renamingValue.trim()) return;
    const { error } = await supabase.from("catalog_categories").update({ name: renamingValue.trim() }).eq("id", id);
    if (!error) { toast.success("Category renamed"); setRenamingCatId(null); fetchAll(); onMutate(); }
    else toast.error(error.message || "Error renaming");
  };

  const handleCategoryDelete = async (cat: CatalogCategory) => {
    if ((cat.item_count ?? 0) > 0) {
      toast.error(`${cat.item_count} item${cat.item_count !== 1 ? "s" : ""} in this category — reassign them first`);
      return;
    }
    const { error } = await supabase.from("catalog_categories").delete().eq("id", cat.id);
    if (!error) {
      if (filterCategory === cat.id) setFilterCategory("all");
      toast.success(`"${cat.name}" deleted`);
      fetchAll();
      onMutate();
    } else toast.error(error.message || "Error deleting");
  };

  const otherActiveItems = items.filter(i => i.is_active && i.id !== impactItem?.id);
  const typeLabel = typeFilter === "charge" ? "Charge" : "Expense";
  const typeAccent = typeFilter === "charge" ? CHARGE_COLOR : EXPENSE_COLOR;

  // ── Render ──

  return (
    <>
      {/* Deactivation Impact Modal */}
      {impactItem && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "12px",
            width: "480px", padding: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <AlertTriangle size={20} style={{ color: "#D97706", flexShrink: 0 }} />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#12332B" }}>
                Deactivate "{impactItem.name}"?
              </h2>
            </div>
            {impactLoading ? (
              <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "20px" }}>Checking references...</p>
            ) : impactCounts && (impactCounts.billing > 0 || impactCounts.expenses > 0) ? (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: "#667085", marginBottom: "12px" }}>This item is referenced by:</p>
                <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                  {impactCounts.billing > 0 && (
                    <span style={impactChipStyle}>{impactCounts.billing} billing line{impactCounts.billing !== 1 ? "s" : ""}</span>
                  )}
                  {impactCounts.expenses > 0 && (
                    <span style={impactChipStyle}>{impactCounts.expenses} expense{impactCounts.expenses !== 1 ? "s" : ""}</span>
                  )}
                </div>
                <label style={{ fontSize: "12px", color: "#667085", display: "block", marginBottom: "6px" }}>
                  Re-link existing records to another item (optional):
                </label>
                <select
                  value={relinkTarget}
                  onChange={e => setRelinkTarget(e.target.value)}
                  style={{ ...inputStyle, fontSize: "12px" }}
                >
                  <option value="">— Keep as-is (records stay linked to this item) —</option>
                  {otherActiveItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "#667085", marginBottom: "20px" }}>
                No billing lines or expenses reference this item. Safe to deactivate.
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setImpactItem(null)} style={cancelBtnStyle}>Cancel</button>
              <button
                onClick={confirmDeactivate}
                disabled={impactLoading}
                style={{ ...saveBtnStyle, backgroundColor: "#DC2626" }}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "280px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${typeLabel.toLowerCase()} items...`}
            style={{ ...inputStyle, paddingLeft: "30px" }}
          />
        </div>

        <CategoryFilterPopover
          filterValue={filterCategory}
          onFilterChange={setFilterCategory}
          categories={categories}
          onMutate={() => { fetchAll(); onMutate(); }}
        />

        <FilterSelect value={filterServiceType} onChange={setFilterServiceType} options={[
          { value: "all", label: "All Services" },
          ...["Brokerage", "Trucking", "Forwarding", "Marine Insurance", "Others"].map(s => ({ value: s, label: s })),
        ]} />

        <FilterSelect value={filterStatus} onChange={setFilterStatus} options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "all", label: "All" },
        ]} />

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <AddCategoryButton
            categories={categories}
            onMutate={() => { fetchAll(); onMutate(); }}
          />

          <button
            onClick={() => setShowAddForm(true)}
            style={{
              ...saveBtnStyle,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: typeAccent,
            }}
          >
            <Plus size={14} />
            Add {typeLabel}
          </button>
        </div>

      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: "white",
          border: `1px solid ${typeAccent}`,
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "12px",
        }}>
          {/* Group 1: Identity */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-start", marginBottom: "12px" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={addForm.name || ""}
                onChange={e => {
                  const name = e.target.value;
                  const code = uniqueSlug(slugify(name), items.map(i => i.charge_type_code));
                  setAddForm({ ...addForm, name, charge_type_code: code });
                }}
                autoFocus
                style={inputStyle}
              />
              {addForm.charge_type_code && (
                <span style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: "monospace", marginTop: "3px", display: "block" }}>
                  code: {addForm.charge_type_code}
                </span>
              )}
            </div>
            <div style={{ flex: "0 0 120px" }}>
              <label style={labelStyle}>Type</label>
              <CustomDropdown
                value={addForm.type || typeFilter}
                options={[
                  { value: "charge", label: "Charge" },
                  { value: "expense", label: "Expense" },
                  { value: "both", label: "Both" },
                ]}
                onChange={val => setAddForm({ ...addForm, type: val as any })}
                size="sm"
              />
            </div>
            <div style={{ flex: "0 0 150px" }}>
              <label style={labelStyle}>Category</label>
              <CustomDropdown
                value={addForm.category_id || ""}
                options={[
                  { value: "", label: "— None —" },
                  ...categories.map(c => ({ value: c.id, label: c.name })),
                ]}
                onChange={val => setAddForm({ ...addForm, category_id: val || null })}
                placeholder="— None —"
                size="sm"
              />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelStyle}>Service Types</label>
              <CustomDropdown
                multiSelect
                value=""
                onChange={() => {}}
                multiValue={addForm.service_types || []}
                options={allServiceTypes.map(s => ({ value: s, label: s }))}
                onMultiChange={vals => setAddForm({ ...addForm, service_types: vals })}
                placeholder="Select services..."
                size="sm"
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px dashed #E0E6E4", marginBottom: "12px" }} />

          {/* Group 2: Billing metadata + actions */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "0 0 130px" }}>
              <label style={labelStyle}>Unit Type</label>
              <CustomDropdown
                value={addForm.unit_type || ""}
                options={[
                  { value: "", label: "—" },
                  ...allUnits.map(u => ({ value: u, label: u })),
                ]}
                onChange={val => setAddForm({ ...addForm, unit_type: val || null })}
                placeholder="—"
                size="sm"
              />
            </div>
            <div style={{ flex: "0 0 90px" }}>
              <label style={labelStyle}>Currency</label>
              <CustomDropdown
                value={addForm.currency || "PHP"}
                options={[
                  { value: "PHP", label: "PHP" },
                  { value: "USD", label: "USD" },
                  { value: "EUR", label: "EUR" },
                ]}
                onChange={val => setAddForm({ ...addForm, currency: val })}
                size="sm"
              />
            </div>
            <div style={{ flex: "0 0 90px" }}>
              <label style={labelStyle}>Tax Code</label>
              <CustomDropdown
                value={addForm.tax_code || ""}
                options={[
                  { value: "", label: "—" },
                  ...allTaxCodes.map(t => ({ value: t, label: t })),
                ]}
                onChange={val => setAddForm({ ...addForm, tax_code: val || null })}
                placeholder="—"
                size="sm"
              />
            </div>
            <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
              <button onClick={() => setShowAddForm(false)} style={cancelBtnStyle}>Cancel</button>
              <button onClick={handleAdd} style={{ ...saveBtnStyle, backgroundColor: typeAccent }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Table — single scrollable table with sticky thead */}
      <div style={{
        backgroundColor: "white",
        border: "1px solid #E5E9F0",
        borderRadius: "10px",
        overflow: "hidden",
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
      }}>
        {isLoading ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#667085", fontSize: "13px" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#667085", fontSize: "13px" }}>
            {items.filter(i => {
              const t = i.type;
              return typeFilter === "charge"
                ? (t === null || t === "charge" || t === "both")
                : (t === "expense" || t === "both");
            }).length === 0
              ? (
                <span>
                  No {typeLabel.toLowerCase()} items yet.{" "}
                  <button onClick={() => setShowAddForm(true)} style={{ color: typeAccent, background: "none", border: "none", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}>
                    Add the first one
                  </button>
                </span>
              )
              : filterCategory !== "all"
              ? (
                <span>
                  No {typeLabel.toLowerCase()} items in this category.{" "}
                  <button onClick={() => setShowAddForm(true)} style={{ color: typeAccent, background: "none", border: "none", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}>
                    Add one
                  </button>
                </span>
              )
              : `No ${typeLabel.toLowerCase()} items match your filters.`
            }
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col />
              <col style={{ width: "200px" }} />
              <col style={{ width: "70px" }} />
              <col style={{ width: "56px" }} />
              <col style={{ width: "44px" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thStyle, position: "sticky", top: 0, backgroundColor: "#F7FAF8", zIndex: 2, boxShadow: "0 1px 0 #E5E9F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {grouped && grouped.length > 0 && (
                      <button
                        onClick={allCollapsed ? expandAll : collapseAll}
                        title={allCollapsed ? "Expand all" : "Collapse all"}
                        style={{ padding: 0, border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", lineHeight: 1 }}
                      >
                        <ChevronDown size={13} style={{ transform: allCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
                      </button>
                    )}
                    Name
                  </div>
                </th>
                <th style={{ ...thStyle, position: "sticky", top: 0, backgroundColor: "#F7FAF8", zIndex: 2, boxShadow: "0 1px 0 #E5E9F0", width: "200px" }}>Unit · Tax · Curr</th>
                <th style={{ ...thStyle, position: "sticky", top: 0, backgroundColor: "#F7FAF8", zIndex: 2, boxShadow: "0 1px 0 #E5E9F0", width: "70px", textAlign: "center" }}>Status</th>
                <th style={{ ...thStyle, position: "sticky", top: 0, backgroundColor: "#F7FAF8", zIndex: 2, boxShadow: "0 1px 0 #E5E9F0", width: "56px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                    Usage
                    <span title="Number of billing lines referencing this item" style={{ cursor: "help", color: "#9CA3AF", display: "flex" }}>
                      <Info size={11} />
                    </span>
                  </div>
                </th>
                <th style={{ ...thStyle, position: "sticky", top: 0, backgroundColor: "#F7FAF8", zIndex: 2, boxShadow: "0 1px 0 #E5E9F0", width: "44px" }} />
              </tr>
            </thead>
            <tbody>
                {grouped ? (
                  // ── Grouped by category ──
                  grouped.map(group => (
                    <Fragment key={group.key}>
                      {/* Category header row */}
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            position: "sticky",
                            top: "43px",
                            zIndex: 1,
                            backgroundColor: "#F0F4F2",
                            padding: "6px 16px",
                            borderBottom: "1px solid #E5E9F0",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              onClick={() => toggleGroup(group.key)}
                              style={{ padding: 0, border: "none", background: "none", cursor: "pointer", color: "#667085", display: "flex", lineHeight: 1 }}
                            >
                              <ChevronDown size={13} style={{ transform: collapsedGroups.has(group.key) ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
                            </button>

                            {renamingCatId === group.key && group.category ? (
                              <>
                                <input
                                  autoFocus
                                  value={renamingValue}
                                  onChange={e => setRenamingValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") handleCategoryRename(group.category!.id);
                                    if (e.key === "Escape") setRenamingCatId(null);
                                  }}
                                  style={{ fontSize: "11px", fontWeight: 600, padding: "2px 6px", border: `1px solid ${CHARGE_COLOR}`, borderRadius: "4px", outline: "none", letterSpacing: "0.04em", textTransform: "uppercase" }}
                                />
                                <button onClick={() => handleCategoryRename(group.category!.id)} style={{ ...iconBtnStyle, color: CHARGE_COLOR }} title="Save"><Check size={12} /></button>
                                <button onClick={() => setRenamingCatId(null)} style={{ ...iconBtnStyle, color: "#9CA3AF" }} title="Cancel"><X size={12} /></button>
                              </>
                            ) : (
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {group.category?.name ?? "Uncategorized"}
                              </span>
                            )}

                            <span style={{ fontSize: "10px", color: "#9CA3AF", backgroundColor: "#E5E9F0", padding: "1px 7px", borderRadius: "8px", fontWeight: 500 }}>
                              {group.items.length}
                            </span>

                            <div style={{ flex: 1 }} />

                            {group.category && !renamingCatId && (
                              <CategoryGroupMenu
                                category={group.category}
                                onRename={() => { setRenamingCatId(group.key); setRenamingValue(group.category!.name); }}
                                onDelete={() => handleCategoryDelete(group.category!)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Item rows */}
                      {!collapsedGroups.has(group.key) && group.items.map(item => (
                        editingId === item.id ? (
                          <ItemEditRow
                            key={item.id}
                            item={item}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            categories={categories}
                            allServiceTypes={allServiceTypes}
                            allUnits={allUnits}
                            allTaxCodes={allTaxCodes}
                            typeAccent={typeAccent}
                            onSave={() => handleSave(item.id)}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: "1px solid #E5E9F0",
                              opacity: item.is_active ? 1 : 0.5,
                              backgroundColor: hoveredRow === item.id ? "#F1F6F4" : "transparent",
                              transition: "background-color 150ms",
                            }}
                            onMouseEnter={() => setHoveredRow(item.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            <td style={{ ...tdStyle, overflow: "hidden", maxWidth: 0, paddingLeft: "36px" }}>
                              <div style={{ fontWeight: 500, color: "#2C3E38", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                title={item.name + (item.charge_type_code ? ` · ${item.charge_type_code}` : "")}>
                                {item.name}
                              </div>
                            </td>
                            <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "11px", color: "#667085", whiteSpace: "nowrap" }}>
                              {[item.unit_type, item.tax_code, item.currency].filter(Boolean).join(" · ") || "—"}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 6px", borderRadius: "4px", backgroundColor: item.is_active ? "#ECFDF5" : "#FEF2F2", color: item.is_active ? "#065F46" : "#991B1B" }}>
                                {item.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              {(usageCounts[item.id] ?? 0) > 0
                                ? <span style={{ fontSize: "12px", fontWeight: 600, color: typeAccent }}>{usageCounts[item.id]}</span>
                                : <span style={{ fontSize: "12px", color: "#D1D5DB" }}>—</span>}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center", padding: "12px 8px" }}>
                              <RowActionsMenu
                                onEdit={() => { setEditingId(item.id); setEditForm({ ...item }); }}
                                onDeactivate={item.is_active ? () => openDeactivateModal(item) : undefined}
                                onReactivate={!item.is_active ? () => handleReactivate(item.id) : undefined}
                              />
                            </td>
                          </tr>
                        )
                      ))}
                    </Fragment>
                  ))
                ) : (
                  // ── Flat view (category filter active) ──
                  filtered.map(item => (
                    editingId === item.id ? (
                      <ItemEditRow
                        key={item.id}
                        item={item}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        categories={categories}
                        allServiceTypes={allServiceTypes}
                        allUnits={allUnits}
                        allTaxCodes={allTaxCodes}
                        typeAccent={typeAccent}
                        onSave={() => handleSave(item.id)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #E5E9F0",
                          opacity: item.is_active ? 1 : 0.5,
                          backgroundColor: hoveredRow === item.id ? "#F1F6F4" : "transparent",
                          transition: "background-color 150ms",
                        }}
                        onMouseEnter={() => setHoveredRow(item.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={{ ...tdStyle, overflow: "hidden", maxWidth: 0 }}>
                          <div style={{ fontWeight: 500, color: "#2C3E38", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            title={item.name + (item.charge_type_code ? ` · ${item.charge_type_code}` : "")}>
                            {item.name}
                          </div>
                          {item.category_name && (
                            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.category_name}</div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "11px", color: "#667085", whiteSpace: "nowrap" }}>
                          {[item.unit_type, item.tax_code, item.currency].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 6px", borderRadius: "4px", backgroundColor: item.is_active ? "#ECFDF5" : "#FEF2F2", color: item.is_active ? "#065F46" : "#991B1B" }}>
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          {(usageCounts[item.id] ?? 0) > 0
                            ? <span style={{ fontSize: "12px", fontWeight: 600, color: typeAccent }}>{usageCounts[item.id]}</span>
                            : <span style={{ fontSize: "12px", color: "#D1D5DB" }}>—</span>}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", padding: "12px 8px" }}>
                          <RowActionsMenu
                            onEdit={() => { setEditingId(item.id); setEditForm({ ...item }); }}
                            onDeactivate={item.is_active ? () => openDeactivateModal(item) : undefined}
                            onReactivate={!item.is_active ? () => handleReactivate(item.id) : undefined}
                          />
                        </td>
                      </tr>
                    )
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
    </>
  );
}

// ==================== ROW ACTIONS MENU ====================

function RowActionsMenu({
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  onEdit: () => void;
  onDeactivate?: () => void;
  onReactivate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 148 });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const menuItem = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    color = "#12332B",
  ) => (
    <button
      onClick={() => { onClick(); setOpen(false); }}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        width: "100%", padding: "8px 12px",
        fontSize: "13px", color,
        background: "none", border: "none", cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F7FAF8")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={open ? () => setOpen(false) : openMenu}
        style={{
          padding: "4px 6px", border: "none", background: "none",
          cursor: "pointer", color: "#9CA3AF", borderRadius: "6px",
          display: "flex", alignItems: "center",
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F1F6F4"; e.currentTarget.style.color = "#667085"; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
      >
        <MoreHorizontal size={15} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed", top: pos.top, left: pos.left,
            width: 148,
            background: "#FFFFFF",
            border: "1px solid #E5E9F0",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(18,51,43,0.10)",
            zIndex: 9999,
            overflow: "hidden",
            padding: "4px 0",
          }}
        >
          {menuItem("Edit", <Pencil size={13} />, onEdit, "#12332B")}
          <div style={{ height: "1px", backgroundColor: "#F3F4F6", margin: "2px 0" }} />
          {onDeactivate && menuItem("Deactivate", <X size={13} />, onDeactivate, "#DC2626")}
          {onReactivate && menuItem("Reactivate", <RotateCcw size={13} />, onReactivate, CHARGE_COLOR)}
        </div>,
        document.body
      )}
    </>
  );
}

// ==================== CATEGORY GROUP MENU ====================

function CategoryGroupMenu({
  category,
  onRename,
  onDelete,
}: {
  category: CatalogCategory;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 140 });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={open ? () => setOpen(false) : openMenu}
        style={{ padding: "2px 4px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", borderRadius: "4px", display: "flex", alignItems: "center" }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#E5E9F0"; e.currentTarget.style.color = "#667085"; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
      >
        <MoreHorizontal size={13} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed", top: pos.top, left: pos.left,
            width: 140,
            background: "#FFFFFF",
            border: "1px solid #E5E9F0",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(18,51,43,0.10)",
            zIndex: 9999,
            overflow: "hidden",
            padding: "4px 0",
          }}
        >
          <button
            onClick={() => { onRename(); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", fontSize: "12px", color: "#12332B", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F7FAF8")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Pencil size={12} /> Rename
          </button>
          <div style={{ height: "1px", backgroundColor: "#F3F4F6" }} />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", fontSize: "12px", color: "#DC2626", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#FFF5F5")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X size={12} /> Delete category
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

// ==================== ADD CATEGORY BUTTON ====================

function AddCategoryButton({
  categories,
  onMutate,
}: {
  categories: CatalogCategory[];
  onMutate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPop = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 220 });
    }
    setOpen(true);
    setName("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) { setOpen(false); setName(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const maxOrder = Math.max(0, ...categories.map(c => c.sort_order ?? 0));
    const { error } = await supabase.from("catalog_categories").insert({
      id: `cat-${Date.now()}`,
      name: name.trim(),
      sort_order: maxOrder + 1,
      is_default: false,
    });
    if (!error) {
      toast.success(`Category "${name.trim()}" created`);
      setOpen(false);
      setName("");
      onMutate();
    } else toast.error(error.message || "Error creating category");
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={open ? () => { setOpen(false); setName(""); } : openPop}
        style={{
          ...cancelBtnStyle,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Plus size={14} />
        Add Category
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: 220,
            background: "#FFFFFF",
            border: "1px solid #E5E9F0",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(18,51,43,0.12)",
            zIndex: 9999,
            padding: "12px",
          }}
        >
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            New Category
          </p>
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setOpen(false); setName(""); }
            }}
            placeholder="Category name..."
            style={{ ...inputStyle, marginBottom: "8px" }}
          />
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button onClick={() => { setOpen(false); setName(""); }} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleCreate} style={saveBtnStyle}>Create</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ==================== CATEGORY FILTER POPOVER ====================
// Smart dropdown that doubles as a category manager.
// Filter + Create / Rename / Delete — all in one place, no separate tab needed.

function CategoryFilterPopover({
  filterValue,
  onFilterChange,
  categories,
  onMutate,
}: {
  filterValue: string;
  onFilterChange: (v: string) => void;
  categories: CatalogCategory[];
  onMutate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");

  const selectedLabel = filterValue === "all"
    ? "All Categories"
    : categories.find(c => c.id === filterValue)?.name ?? "All Categories";

  const openPopover = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 230) });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setRenamingId(null);
        setAddingNew(false);
        setNewName("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    const { error } = await supabase.from("catalog_categories").update({ name: renameValue.trim() }).eq("id", id);
    if (!error) { toast.success("Category renamed"); setRenamingId(null); onMutate(); }
    else toast.error(error.message || "Error renaming");
  };

  const handleDelete = async (cat: CatalogCategory) => {
    if ((cat.item_count ?? 0) > 0) {
      toast.error(`${cat.item_count} item${cat.item_count !== 1 ? "s" : ""} use this category — reassign them first`);
      return;
    }
    const { error } = await supabase.from("catalog_categories").delete().eq("id", cat.id);
    if (!error) {
      if (filterValue === cat.id) onFilterChange("all");
      toast.success(`"${cat.name}" deleted`);
      onMutate();
    } else toast.error(error.message || "Error deleting");
  };

  const handleAddNew = async () => {
    if (!newName.trim()) return;
    const maxOrder = Math.max(0, ...categories.map(c => c.sort_order ?? 0));
    const { error } = await supabase.from("catalog_categories").insert({
      id: `cat-${Date.now()}`,
      name: newName.trim(),
      sort_order: maxOrder + 1,
      is_default: false,
    });
    if (!error) {
      toast.success(`Category "${newName}" created`);
      setNewName("");
      setAddingNew(false);
      onMutate();
    } else toast.error(error.message || "Error creating category");
  };

  const isFiltered = filterValue !== "all";

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={open ? () => setOpen(false) : openPopover}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "7px 10px",
          fontSize: "12px",
          border: `1px solid ${isFiltered ? CHARGE_COLOR : "#E0E6E4"}`,
          borderRadius: "8px",
          color: isFiltered ? CHARGE_COLOR : "#2C3E38",
          backgroundColor: isFiltered ? "#F0FDF9" : "white",
          cursor: "pointer",
          outline: "none",
          whiteSpace: "nowrap",
          fontWeight: isFiltered ? 600 : 400,
        }}
      >
        <Tag size={12} style={{ flexShrink: 0 }} />
        {selectedLabel}
        {isFiltered && (
          <span
            onMouseDown={e => { e.stopPropagation(); onFilterChange("all"); }}
            style={{ display: "flex", alignItems: "center", color: "#9CA3AF", marginLeft: "1px", cursor: "pointer" }}
          >
            <X size={11} />
          </span>
        )}
        <ChevronDown size={11} style={{ color: "#9CA3AF", marginLeft: "2px", flexShrink: 0 }} />
      </button>

      {/* Popover — portal to body so it's never clipped */}
      {open && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            minWidth: 230,
            background: "#FFFFFF",
            border: "1px solid #E0E6E4",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(18,51,43,0.12)",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "8px 12px 7px",
            borderBottom: "1px solid #F3F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Categories
            </span>
            <span style={{ fontSize: "10px", color: "#C0C7CC" }}>{categories.length} total</span>
          </div>

          {/* "All" row */}
          <div
            onClick={() => { onFilterChange("all"); setOpen(false); }}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              backgroundColor: filterValue === "all" ? "#F0FDF9" : "transparent",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{
              flex: 1, fontSize: "13px",
              fontWeight: filterValue === "all" ? 600 : 400,
              color: filterValue === "all" ? CHARGE_COLOR : "#2C3E38",
            }}>
              All Categories
            </span>
            <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
              {categories.reduce((s, c) => s + (c.item_count ?? 0), 0)}
            </span>
          </div>

          <div style={{ borderTop: "1px solid #F3F4F6" }} />

          {/* Category rows */}
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  backgroundColor: filterValue === cat.id ? "#F0FDF9" : "transparent",
                  minHeight: 34,
                }}
              >
                {renamingId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleRename(cat.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      style={{
                        flex: 1, fontSize: "13px", padding: "3px 6px",
                        border: `1px solid ${CHARGE_COLOR}`, borderRadius: "4px", outline: "none",
                      }}
                    />
                    <button onClick={() => handleRename(cat.id)} style={{ ...iconBtnStyle, color: CHARGE_COLOR }} title="Save"><Check size={13} /></button>
                    <button onClick={() => setRenamingId(null)} style={{ ...iconBtnStyle, color: "#9CA3AF" }} title="Cancel"><X size={13} /></button>
                  </>
                ) : (
                  <>
                    <span
                      onClick={() => { onFilterChange(cat.id); setOpen(false); }}
                      style={{
                        flex: 1, fontSize: "13px", cursor: "pointer",
                        fontWeight: filterValue === cat.id ? 600 : 400,
                        color: filterValue === cat.id ? CHARGE_COLOR : "#2C3E38",
                      }}
                    >
                      {cat.name}
                    </span>
                    <span style={{ fontSize: "11px", color: "#C0C7CC", minWidth: 18, textAlign: "right" }}>
                      {cat.item_count ?? 0}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); setRenamingId(cat.id); setRenameValue(cat.name); }}
                      style={{ ...iconBtnStyle, color: "#C0C7CC" }}
                      title="Rename"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(cat); }}
                      style={{ ...iconBtnStyle, color: (cat.item_count ?? 0) > 0 ? "#E5E7EB" : "#DC2626" }}
                      title={(cat.item_count ?? 0) > 0 ? `${cat.item_count} items — reassign first` : "Delete"}
                    >
                      <X size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new category footer */}
          <div style={{ borderTop: "1px solid #F3F4F6", padding: "8px 12px" }}>
            {addingNew ? (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleAddNew();
                    if (e.key === "Escape") { setAddingNew(false); setNewName(""); }
                  }}
                  placeholder="Category name..."
                  style={{
                    flex: 1, fontSize: "12px", padding: "4px 8px",
                    border: `1px solid ${CHARGE_COLOR}`, borderRadius: "5px", outline: "none",
                  }}
                />
                <button onClick={handleAddNew} style={{ ...iconBtnStyle, color: CHARGE_COLOR }} title="Create"><Check size={13} /></button>
                <button onClick={() => { setAddingNew(false); setNewName(""); }} style={{ ...iconBtnStyle, color: "#9CA3AF" }} title="Cancel"><X size={13} /></button>
              </div>
            ) : (
              <button
                onClick={() => setAddingNew(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "12px", color: CHARGE_COLOR, fontWeight: 500,
                  display: "flex", alignItems: "center", gap: "4px", padding: "2px 0",
                }}
              >
                <Plus size={13} />
                New category
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ==================== ITEM EDIT ROW ====================

// Column order: Name | Services | Unit·Tax·Curr | Status | Usage | Actions

function ItemEditRow({
  item, editForm, setEditForm, categories, allServiceTypes, allUnits, allTaxCodes, typeAccent, onSave, onCancel,
}: {
  item: CatalogItem;
  editForm: Partial<CatalogItem>;
  setEditForm: (f: Partial<CatalogItem>) => void;
  categories: CatalogCategory[];
  allServiceTypes: string[];
  allUnits: string[];
  allTaxCodes: string[];
  typeAccent: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const categoryOptions = [
    { value: "", label: "— No category —" },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ];
  const unitOptions = [
    { value: "", label: "— unit —" },
    ...allUnits.map(u => ({ value: u, label: u })),
  ];
  const taxOptions = [
    { value: "", label: "— tax —" },
    ...allTaxCodes.map(t => ({ value: t, label: t })),
  ];
  const currencyOptions = [
    { value: "PHP", label: "PHP" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
  ];

  return (
    <tr style={{ borderBottom: "1px solid #E5E9F0", backgroundColor: "#F7FAF8" }}>
      {/* Name + Category (stacked) */}
      <td style={{ ...tdStyle, overflow: "hidden" }}>
        <input type="text" value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ ...inputStyle, fontWeight: 500, marginBottom: "6px" }} autoFocus />
        <CustomDropdown
          value={editForm.category_id || ""}
          options={categoryOptions}
          onChange={val => setEditForm({ ...editForm, category_id: val || null })}
          placeholder="— No category —"
          size="sm"
        />
        {item.charge_type_code && (
          <span style={{ fontSize: "10px", color: "#C0C7CC", fontFamily: "monospace", marginTop: "4px", display: "block" }}
            title="Stable backend identifier — cannot be changed after creation">
            {item.charge_type_code}
          </span>
        )}
      </td>
      {/* Unit · Tax · Curr */}
      <td style={tdStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <CustomDropdown
            value={editForm.unit_type || ""}
            options={unitOptions}
            onChange={val => setEditForm({ ...editForm, unit_type: val || null })}
            placeholder="— unit —"
            size="sm"
          />
          <div style={{ display: "flex", gap: "4px" }}>
            <CustomDropdown
              value={editForm.tax_code || ""}
              options={taxOptions}
              onChange={val => setEditForm({ ...editForm, tax_code: val || null })}
              placeholder="— tax —"
              size="sm"
            />
            <CustomDropdown
              value={editForm.currency || "PHP"}
              options={currencyOptions}
              onChange={val => setEditForm({ ...editForm, currency: val })}
              size="sm"
            />
          </div>
        </div>
      </td>
      {/* Status — read-only during edit */}
      <td style={{ ...tdStyle, textAlign: "center" }}>
        <span style={{ fontSize: "10px", color: "#9CA3AF" }}>—</span>
      </td>
      {/* Usage — read-only during edit */}
      <td style={{ ...tdStyle, textAlign: "center" }}>
        <span style={{ fontSize: "12px", color: "#D1D5DB" }}>—</span>
      </td>
      {/* Actions */}
      <td style={{ ...tdStyle, textAlign: "center", padding: "12px 8px" }}>
        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          <button onClick={onSave} title="Save" style={{ ...iconBtnStyle, color: typeAccent }}><Check size={14} /></button>
          <button onClick={onCancel} title="Cancel" style={{ ...iconBtnStyle, color: "#9CA3AF" }}><X size={14} /></button>
        </div>
      </td>
    </tr>
  );
}

// ==================== SHARED SUB-COMPONENTS ====================

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: "7px 10px",
        fontSize: "12px",
        border: "1px solid #E0E6E4",
        borderRadius: "8px",
        color: "#2C3E38",
        backgroundColor: "white",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ==================== SHARED STYLES ====================

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "11px",
  fontWeight: 600,
  color: "#667085",
  textAlign: "left",
  textTransform: "uppercase",
  letterSpacing: "0.002em",
};


const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "13px",
  verticalAlign: "middle",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#667085",
  display: "block",
  marginBottom: "3px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: "13px",
  border: "1px solid #E0E6E4",
  borderRadius: "6px",
  color: "#2C3E38",
  outline: "none",
  backgroundColor: "white",
};

const iconBtnStyle: React.CSSProperties = {
  padding: "4px",
  border: "none",
  backgroundColor: "transparent",
  cursor: "pointer",
  color: "#667085",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: 500,
  borderRadius: "6px",
  border: "1px solid #E0E6E4",
  backgroundColor: "white",
  color: "#667085",
  cursor: "pointer",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: 500,
  borderRadius: "6px",
  border: "none",
  backgroundColor: CHARGE_COLOR,
  color: "white",
  cursor: "pointer",
};

const serviceTagStyle: React.CSSProperties = {
  padding: "1px 6px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: 500,
  backgroundColor: "#F0FDFA",
  color: CHARGE_COLOR,
  border: "1px solid #CCFBF1",
};

const impactChipStyle: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 500,
  backgroundColor: "#FEF3C7",
  color: "#92400E",
  border: "1px solid #FDE68A",
};
