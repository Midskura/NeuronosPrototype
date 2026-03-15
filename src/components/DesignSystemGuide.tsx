import { useState } from "react";
import { 
  Palette, 
  Type, 
  Layout, 
  Box, 
  Code,
  Check,
  X,
  ChevronRight,
  Calendar,
  ChevronDown,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  User,
  Package,
  Truck,
  Ship,
  FileText,
  Settings,
  Bell,
  Home
} from "lucide-react";
import { CustomCheckbox } from "./bd/CustomCheckbox";
import { CustomDropdown } from "./bd/CustomDropdown";
import { CustomDatePicker } from "./common/CustomDatePicker";

type GuideSection = "overview" | "colors" | "typography" | "spacing" | "components" | "principles";

export function DesignSystemGuide() {
  const [activeSection, setActiveSection] = useState<GuideSection>("overview");
  const [sampleDropdownValue, setSampleDropdownValue] = useState("");
  const [sampleDateValue, setSampleDateValue] = useState("");
  const [sampleSearchValue, setSampleSearchValue] = useState("");
  const [sampleCheckbox1, setSampleCheckbox1] = useState(false);
  const [sampleCheckbox2, setSampleCheckbox2] = useState(true);
  const [sampleCheckbox3, setSampleCheckbox3] = useState(false);

  const sections = [
    { id: "overview" as GuideSection, label: "Overview", icon: Layout },
    { id: "colors" as GuideSection, label: "Colors", icon: Palette },
    { id: "typography" as GuideSection, label: "Typography", icon: Type },
    { id: "spacing" as GuideSection, label: "Spacing", icon: Box },
    { id: "components" as GuideSection, label: "Components", icon: Code },
    { id: "principles" as GuideSection, label: "Principles", icon: CheckCircle }
  ];

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column",
      background: "var(--neuron-bg-page)"
    }}>
      {/* Header */}
      <div style={{
        padding: "32px 48px",
        borderBottom: "1px solid var(--neuron-ui-border)",
        background: "white"
      }}>
        <h1 style={{ 
          fontSize: "32px", 
          fontWeight: 600, 
          color: "#12332B", 
          marginBottom: "4px",
          letterSpacing: "-1.2px"
        }}>
          Neuron OS Design System
        </h1>
        <p style={{ fontSize: "14px", color: "#667085", marginBottom: "16px" }}>
          Complete design system reference for building production-grade Neuron OS applications
        </p>
        
        {/* Warning Notice */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          background: "#FEF3C7",
          border: "1px solid #F59E0B",
          borderRadius: "8px",
          marginTop: "12px"
        }}>
          <AlertCircle size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <div style={{ fontSize: "13px", color: "#92400E", lineHeight: "1.5" }}>
            <strong style={{ fontWeight: 600 }}>Internal Development Reference Only:</strong> This design system guide is a development tool and not part of the production application. Use it as a reference when building Neuron OS modules.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        overflow: "hidden"
      }}>
        {/* Sidebar Navigation */}
        <div style={{
          width: "280px",
          borderRight: "1px solid var(--neuron-ui-border)",
          background: "white",
          padding: "24px 16px",
          overflowY: "auto"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    border: isActive ? "1.5px solid #5FC4A1" : "1px solid transparent",
                    borderRadius: "8px",
                    background: isActive ? "#E8F5F3" : "transparent",
                    color: isActive ? "#0F766E" : "var(--neuron-ink-secondary)",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#F9FAFB";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 48px",
          background: "white"
        }}>
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "colors" && <ColorsSection />}
          {activeSection === "typography" && <TypographySection />}
          {activeSection === "spacing" && <SpacingSection />}
          {activeSection === "components" && (
            <ComponentsSection 
              sampleDropdownValue={sampleDropdownValue}
              setSampleDropdownValue={setSampleDropdownValue}
              sampleDateValue={sampleDateValue}
              setSampleDateValue={setSampleDateValue}
              sampleSearchValue={sampleSearchValue}
              setSampleSearchValue={setSampleSearchValue}
              sampleCheckbox1={sampleCheckbox1}
              setSampleCheckbox1={setSampleCheckbox1}
              sampleCheckbox2={sampleCheckbox2}
              setSampleCheckbox2={setSampleCheckbox2}
              sampleCheckbox3={sampleCheckbox3}
              setSampleCheckbox3={setSampleCheckbox3}
            />
          )}
          {activeSection === "principles" && <PrinciplesSection />}
        </div>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
          Design System Overview
        </h2>
        <p style={{ fontSize: "14px", color: "#667085", lineHeight: "1.6", marginBottom: "16px" }}>
          The Neuron OS design system is built for asset-light freight forwarding SMEs in the Philippines. 
          It emphasizes clarity, consistency, and efficiency through a minimalist approach with stroke-based 
          borders instead of shadows, creating a clean and professional interface.
        </p>
      </div>

      {/* Core Philosophy */}
      <div style={{
        background: "white",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
          Core Philosophy
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PhilosophyItem 
            title="Stroke-Based Design"
            description="Use clean stroke borders (1px solid) instead of box shadows for a crisp, modern look"
          />
          <PhilosophyItem 
            title="Green & White Palette"
            description="Deep green (#12332B) and teal (#0F766E) accents on pure white backgrounds"
          />
          <PhilosophyItem 
            title="Consistent Spacing"
            description="Standard page padding of 32px 48px with systematic internal spacing"
          />
          <PhilosophyItem 
            title="Module Isolation"
            description="Each work module operates independently with clear boundaries"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <StatCard label="Primary Colors" value="2" />
        <StatCard label="Typography Levels" value="6" />
        <StatCard label="Component Types" value="12+" />
      </div>
    </div>
  );
}

function PhilosophyItem({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      <div style={{
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        background: "#E8F5F3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        <Check size={14} style={{ color: "#0F766E" }} />
      </div>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#12332B", marginBottom: "4px" }}>
          {title}
        </div>
        <div style={{ fontSize: "13px", color: "#667085", lineHeight: "1.5" }}>
          {description}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "12px",
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{ fontSize: "32px", fontWeight: 700, color: "#0F766E", marginBottom: "4px" }}>
        {value}
      </div>
      <div style={{ fontSize: "13px", color: "#667085" }}>
        {label}
      </div>
    </div>
  );
}

// Colors Section
function ColorsSection() {
  const brandColors = [
    { name: "Brand Green", var: "--neuron-brand-green", hex: "#0F766E", usage: "Primary actions, selected states, accents" },
    { name: "Deep Green", var: "--neuron-brand-deep-green", hex: "#12332B", usage: "Headers, primary text, important elements" }
  ];

  const inkColors = [
    { name: "Primary Ink", var: "--neuron-ink-primary", hex: "#0A1D4D", usage: "Main body text, table content" },
    { name: "Secondary Ink", var: "--neuron-ink-secondary", hex: "#344054", usage: "Sidebar labels, secondary text" },
    { name: "Muted Ink", var: "--neuron-ink-muted", hex: "#667085", usage: "Placeholder text, helper text, icons" }
  ];

  const uiColors = [
    { name: "UI Border", var: "--neuron-ui-border", hex: "#E5E9F0", usage: "All borders, dividers, card edges" },
    { name: "Background Page", var: "--neuron-bg-page", hex: "#F8F9FB", usage: "Page backgrounds" },
    { name: "State Selected", var: "--neuron-state-selected", hex: "#E8F5F3", usage: "Selected item backgrounds" },
    { name: "State Hover", var: "--neuron-state-hover", hex: "#F9FAFB", usage: "Hover states" }
  ];

  const statusColors = [
    { name: "Success", hex: "#0F766E", usage: "Success states, completed items" },
    { name: "Warning", hex: "#F59E0B", usage: "Warning states, pending items" },
    { name: "Error", hex: "#EF4444", usage: "Error states, destructive actions" },
    { name: "Info", hex: "#3B82F6", usage: "Informational messages" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#12332B", marginBottom: "8px" }}>
          Color System
        </h2>
        <p style={{ fontSize: "14px", color: "#667085", lineHeight: "1.6" }}>
          The Neuron OS color palette is built around green tones with functional supporting colors.
        </p>
      </div>

      {/* Brand Colors */}
      <ColorSection title="Brand Colors" colors={brandColors} />
      
      {/* Ink Colors */}
      <ColorSection title="Ink (Text) Colors" colors={inkColors} />
      
      {/* UI Colors */}
      <ColorSection title="UI Colors" colors={uiColors} />
      
      {/* Status Colors */}
      <div style={{
        background: "white",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
          Status Colors
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {statusColors.map((color) => (
            <div key={color.name} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "8px",
                background: color.hex,
                border: "1px solid var(--neuron-ui-border)",
                flexShrink: 0
              }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#12332B", marginBottom: "2px" }}>
                  {color.name}
                </div>
                <div style={{ fontSize: "12px", color: "#667085", fontFamily: "monospace", marginBottom: "4px" }}>
                  {color.hex}
                </div>
                <div style={{ fontSize: "12px", color: "#667085" }}>
                  {color.usage}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColorSection({ title, colors }: { title: string; colors: Array<{ name: string; var?: string; hex: string; usage: string }> }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "12px",
      padding: "24px"
    }}>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {colors.map((color) => (
          <div key={color.name} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "8px",
              background: color.hex,
              border: "1px solid var(--neuron-ui-border)",
              flexShrink: 0
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#12332B", marginBottom: "4px" }}>
                {color.name}
              </div>
              {color.var && (
                <div style={{ fontSize: "12px", color: "#667085", fontFamily: "monospace", marginBottom: "2px" }}>
                  var({color.var})
                </div>
              )}
              <div style={{ fontSize: "12px", color: "#667085", fontFamily: "monospace", marginBottom: "8px" }}>
                {color.hex}
              </div>
              <div style={{ fontSize: "12px", color: "#667085", lineHeight: "1.5" }}>
                {color.usage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Typography Section
function TypographySection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#12332B", marginBottom: "8px" }}>
          Typography
        </h2>
        <p style={{ fontSize: "14px", color: "#667085", lineHeight: "1.6" }}>
          Neuron OS uses Inter as the primary typeface with systematic sizing and weights.
        </p>
      </div>

      {/* Font Family */}
      <div style={{
        background: "white",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
          Font Family
        </h3>
        <div style={{ fontSize: "14px", color: "#667085", marginBottom: "12px" }}>
          <code style={{ 
            background: "#F9FAFB", 
            padding: "4px 8px", 
            borderRadius: "4px",
            fontSize: "13px"
          }}>
            font-family: Inter, system-ui, -apple-system, sans-serif
          </code>
        </div>
        <p style={{ fontSize: "13px", color: "#667085", lineHeight: "1.6" }}>
          Inter provides excellent readability at all sizes and weights, making it ideal for data-heavy interfaces.
        </p>
      </div>

      {/* Typography Scale */}
      <div style={{
        background: "white",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "24px" }}>
          Typography Scale
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <TypeExample 
            level="Page Title"
            size="32px"
            weight="600"
            color="#12332B"
            usage="Module headers, main page titles"
            letterSpacing="-1.2px"
            lineHeight="1.3"
          />
          <TypeExample 
            level="Section Title"
            size="24px"
            weight="600"
            color="#12332B"
            usage="Section headers within pages"
            letterSpacing="-0.5px"
            lineHeight="1.3"
          />
          <TypeExample 
            level="Card Title"
            size="18px"
            weight="600"
            color="#12332B"
            usage="Card headers, sub-sections"
            letterSpacing="0px"
            lineHeight="1.5"
          />
          <TypeExample 
            level="Body Large"
            size="14px"
            weight="400"
            color="#0A1D4D"
            usage="Primary body text, descriptions"
            letterSpacing="0px"
            lineHeight="1.5"
          />
          <TypeExample 
            level="Body Regular"
            size="13px"
            weight="400"
            color="#344054"
            usage="Table content, form labels"
            letterSpacing="0px"
            lineHeight="1.6"
          />
          <TypeExample 
            level="Caption"
            size="11px"
            weight="400"
            color="#667085"
            usage="Helper text, table headers, metadata"
            letterSpacing="0.5px"
            lineHeight="1.6"
          />
        </div>
      </div>

      {/* Font Weights */}
      <div style={{
        background: "white",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
          Font Weights
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <WeightExample weight="400" label="Regular" usage="Body text" />
          <WeightExample weight="500" label="Medium" usage="Labels, buttons" />
          <WeightExample weight="600" label="Semibold" usage="Headers, emphasis" />
        </div>
      </div>
    </div>
  );
}

function TypeExample({ 
  level, 
  size, 
  weight, 
  color, 
  usage,
  letterSpacing,
  lineHeight
}: { 
  level: string; 
  size: string; 
  weight: string; 
  color: string; 
  usage: string;
  letterSpacing: string;
  lineHeight: string;
}) {
  return (
    <div>
      <div style={{ 
        fontSize: size, 
        fontWeight: Number(weight), 
        color: color,
        marginBottom: "8px",
        letterSpacing: letterSpacing,
        lineHeight: lineHeight
      }}>
        {level}
      </div>
      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#667085", flexWrap: "wrap" }}>
        <span><strong>Size:</strong> {size}</span>
        <span><strong>Weight:</strong> {weight}</span>
        <span><strong>Line Height:</strong> {lineHeight}</span>
        <span><strong>Letter Spacing:</strong> {letterSpacing}</span>
        <span><strong>Color:</strong> {color}</span>
      </div>
      <div style={{ fontSize: "12px", color: "#667085", marginTop: "4px" }}>
        <strong>Usage:</strong> {usage}
      </div>
    </div>
  );
}

function WeightExample({ weight, label, usage }: { weight: string; label: string; usage: string }) {
  return (
    <div style={{
      background: "#F9FAFB",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "16px"
    }}>
      <div style={{ fontSize: "18px", fontWeight: Number(weight), color: "#12332B", marginBottom: "8px" }}>
        Aa
      </div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#12332B", marginBottom: "4px" }}>
        {label} ({weight})
      </div>
      <div style={{ fontSize: "12px", color: "#667085" }}>
        {usage}
      </div>
    </div>
  );
}

// Spacing Section
function SpacingSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#12332B", marginBottom: "8px" }}>
          Spacing System
        </h2>
        <p style={{ fontSize: "14px", color: "#667085", lineHeight: "1.6" }}>
          Consistent spacing creates visual rhythm and hierarchy throughout the application.
        </p>
      </div>

      {/* Page Padding */}
      <div style={{
        background: "white",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
          Page Padding
        </h3>
        <div style={{
          background: "#F9FAFB",
          border: "2px dashed #0F766E",
          borderRadius: "8px",
          padding: "32px 48px",
          marginBottom: "16px"
        }}>
          <div style={{
            background: "white",
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "8px",
            padding: "16px",
            textAlign: "center",
            color: "#667085",
            fontSize: "13px"
          }}>
            Page Content
          </div>
        </div>
        <div style={{ fontSize: "13px", color: "#667085" }}>
          <strong>Standard:</strong> padding: 32px 48px (vertical horizontal)
        </div>
      </div>

      {/* Spacing Scale */}
      <div style={{
        background: "white",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
          Spacing Scale
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SpacingExample size="4px" usage="Micro spacing within components" />
          <SpacingExample size="8px" usage="Small gaps between related items" />
          <SpacingExample size="12px" usage="Standard gaps between elements" />
          <SpacingExample size="16px" usage="Section spacing within cards" />
          <SpacingExample size="24px" usage="Major section spacing" />
          <SpacingExample size="32px" usage="Module section separation" />
          <SpacingExample size="48px" usage="Page-level separation" />
        </div>
      </div>

      {/* Border Radius */}
      <div style={{
        background: "white",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
          Border Radius
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <RadiusExample size="4px" label="Small" usage="Inputs, tags" />
          <RadiusExample size="6px" label="Medium" usage="Buttons, dropdowns" />
          <RadiusExample size="8px" label="Large" usage="Cards, modals" />
          <RadiusExample size="12px" label="Extra Large" usage="Major containers" />
        </div>
      </div>
    </div>
  );
}

function SpacingExample({ size, usage }: { size: string; usage: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{
        width: size,
        height: "32px",
        background: "#0F766E",
        borderRadius: "2px",
        flexShrink: 0
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#12332B" }}>
          {size}
        </div>
        <div style={{ fontSize: "12px", color: "#667085" }}>
          {usage}
        </div>
      </div>
    </div>
  );
}

function RadiusExample({ size, label, usage }: { size: string; label: string; usage: string }) {
  return (
    <div style={{
      background: "#F9FAFB",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "16px",
      textAlign: "center"
    }}>
      <div style={{
        width: "64px",
        height: "64px",
        background: "#0F766E",
        borderRadius: size,
        margin: "0 auto 12px"
      }} />
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#12332B", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "11px", color: "#667085", marginBottom: "4px" }}>
        {size}
      </div>
      <div style={{ fontSize: "11px", color: "#667085" }}>
        {usage}
      </div>
    </div>
  );
}

// Components Section
function ComponentsSection({
  sampleDropdownValue,
  setSampleDropdownValue,
  sampleDateValue,
  setSampleDateValue,
  sampleSearchValue,
  setSampleSearchValue,
  sampleCheckbox1,
  setSampleCheckbox1,
  sampleCheckbox2,
  setSampleCheckbox2,
  sampleCheckbox3,
  setSampleCheckbox3
}: {
  sampleDropdownValue: string;
  setSampleDropdownValue: (value: string) => void;
  sampleDateValue: string;
  setSampleDateValue: (value: string) => void;
  sampleSearchValue: string;
  setSampleSearchValue: (value: string) => void;
  sampleCheckbox1: boolean;
  setSampleCheckbox1: (value: boolean) => void;
  sampleCheckbox2: boolean;
  setSampleCheckbox2: (value: boolean) => void;
  sampleCheckbox3: boolean;
  setSampleCheckbox3: (value: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#12332B", marginBottom: "8px" }}>
          Component Library
        </h2>
        <p style={{ fontSize: "14px", color: "#667085", lineHeight: "1.6" }}>
          Production-ready components following Neuron OS design principles.
        </p>
      </div>

      {/* Buttons */}
      <ComponentCard title="Buttons">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button style={{
              padding: "8px 16px",
              background: "#0F766E",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer"
            }}>
              Primary Button
            </button>
            <button style={{
              padding: "8px 16px",
              background: "white",
              color: "#0F766E",
              border: "1px solid #0F766E",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer"
            }}>
              Secondary Button
            </button>
            <button style={{
              padding: "8px 16px",
              background: "#EF4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer"
            }}>
              Destructive Button
            </button>
            <button style={{
              padding: "8px 16px",
              background: "transparent",
              color: "#667085",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer"
            }}>
              Ghost Button
            </button>
          </div>
          <CodeBlock code={`<button style={{
  padding: "8px 16px",
  background: "#0F766E",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer"
}}>
  Primary Button
</button>`} />
        </div>
      </ComponentCard>

      {/* Input Fields */}
      <ComponentCard title="Input Fields">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text"
              placeholder="Enter text..."
              style={{
                padding: "8px 12px",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "6px",
                fontSize: "13px",
                outline: "none",
                width: "300px"
              }}
            />
            <input
              type="text"
              placeholder="Disabled input"
              disabled
              style={{
                padding: "8px 12px",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "6px",
                fontSize: "13px",
                background: "#F3F4F6",
                color: "#9CA3AF",
                width: "300px"
              }}
            />
          </div>
          <CodeBlock code={`<input
  type="text"
  placeholder="Enter text..."
  style={{
    padding: "8px 12px",
    border: "1px solid var(--neuron-ui-border)",
    borderRadius: "6px",
    fontSize: "13px",
    outline: "none"
  }}
/>`} />
        </div>
      </ComponentCard>

      {/* Search Input */}
      <ComponentCard title="Search Input">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ position: "relative", width: "300px" }}>
            <Search 
              size={16} 
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#667085"
              }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={sampleSearchValue}
              onChange={(e) => setSampleSearchValue(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "6px",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>
          <CodeBlock code={`<div style={{ position: "relative" }}>
  <Search 
    size={16} 
    style={{
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#667085"
    }}
  />
  <input
    type="text"
    placeholder="Search..."
    style={{
      width: "100%",
      padding: "8px 12px 8px 36px",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "6px",
      fontSize: "13px"
    }}
  />
</div>`} />
        </div>
      </ComponentCard>

      {/* Custom Dropdown */}
      <ComponentCard title="Custom Dropdown">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ width: "200px" }}>
            <CustomDropdown
              value={sampleDropdownValue}
              onChange={setSampleDropdownValue}
              options={[
                { value: "option1", label: "Option 1" },
                { value: "option2", label: "Option 2" },
                { value: "option3", label: "Option 3" }
              ]}
              placeholder="Select option..."
            />
          </div>
          <CodeBlock code={`<CustomDropdown
  value={value}
  onChange={setValue}
  options={[
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" }
  ]}
  placeholder="Select option..."
/>`} />
        </div>
      </ComponentCard>

      {/* Date Picker */}
      <ComponentCard title="Date Picker">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ width: "200px" }}>
            <CustomDatePicker
              value={sampleDateValue}
              onChange={setSampleDateValue}
              placeholder="dd/mm/yyyy"
            />
          </div>
          <CodeBlock code={`<CustomDatePicker
  value={dateValue}
  onChange={setDateValue}
  placeholder="dd/mm/yyyy"
/>`} />
        </div>
      </ComponentCard>

      {/* Status Badges */}
      <ComponentCard title="Status Badges">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <StatusBadge status="Active" color="#0F766E" />
            <StatusBadge status="Pending" color="#F59E0B" />
            <StatusBadge status="Cancelled" color="#EF4444" />
            <StatusBadge status="Completed" color="#3B82F6" />
          </div>
          <CodeBlock code={`<div style={{
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 8px",
  background: "#E8F5F3",
  color: "#0F766E",
  borderRadius: "4px",
  fontSize: "11px",
  fontWeight: 600
}}>
  Active
</div>`} />
        </div>
      </ComponentCard>

      {/* Cards */}
      <ComponentCard title="Cards">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{
            background: "white",
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "12px",
            padding: "20px",
            maxWidth: "400px"
          }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#12332B", marginBottom: "8px" }}>
              Card Title
            </h4>
            <p style={{ fontSize: "13px", color: "#667085", marginBottom: "16px" }}>
              Card description text goes here. Cards use stroke borders instead of shadows.
            </p>
            <button style={{
              padding: "8px 16px",
              background: "#0F766E",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer"
            }}>
              Card Action
            </button>
          </div>
          <CodeBlock code={`<div style={{
  background: "white",
  border: "1px solid var(--neuron-ui-border)",
  borderRadius: "12px",
  padding: "20px"
}}>
  <h4>Card Title</h4>
  <p>Card content...</p>
</div>`} />
        </div>
      </ComponentCard>

      {/* Alert Messages */}
      <ComponentCard title="Alert Messages">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Alert type="success" message="Operation completed successfully!" />
          <Alert type="warning" message="Please review this information carefully." />
          <Alert type="error" message="An error occurred. Please try again." />
          <Alert type="info" message="This is an informational message." />
        </div>
      </ComponentCard>

      {/* Icon Buttons */}
      <ComponentCard title="Icon Buttons">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <IconButton icon={<Plus size={16} />} label="Add" />
            <IconButton icon={<Edit size={16} />} label="Edit" />
            <IconButton icon={<Trash2 size={16} />} label="Delete" variant="danger" />
            <IconButton icon={<Download size={16} />} label="Download" variant="secondary" />
          </div>
          <CodeBlock code={`<button style={{
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 12px",
  background: "#0F766E",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer"
}}>
  <Plus size={16} />
  Add
</button>`} />
        </div>
      </ComponentCard>

      {/* Table Row */}
      <ComponentCard title="Table Styles">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "8px",
            overflow: "hidden"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              background: "#F9FAFB",
              borderBottom: "1px solid var(--neuron-ui-border)",
              padding: "12px 16px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#667085",
              letterSpacing: "0.5px"
            }}>
              <div>NAME</div>
              <div>STATUS</div>
              <div>DATE</div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              background: "white",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#0A1D4D",
              alignItems: "center"
            }}>
              <div>Sample Item</div>
              <div><StatusBadge status="Active" color="#0F766E" /></div>
              <div>Jan 18, 2026</div>
            </div>
          </div>
          <CodeBlock code={`<div style={{
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  background: "white",
  padding: "12px 16px",
  fontSize: "13px",
  borderBottom: "1px solid var(--neuron-ui-border)"
}}>
  <div>Cell 1</div>
  <div>Cell 2</div>
  <div>Cell 3</div>
</div>`} />
        </div>
      </ComponentCard>

      {/* Lucide Icons */}
      <ComponentCard title="Lucide Icons">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "14px", color: "#667085", lineHeight: "1.6" }}>
            Neuron OS uses Lucide React icons throughout the system. Icons should be 16px-20px in size and use muted colors (#667085) by default.
          </p>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", 
            gap: "16px",
            padding: "16px",
            background: "#F9FAFB",
            borderRadius: "8px"
          }}>
            {[
              { icon: Home, label: "Home" },
              { icon: User, label: "User" },
              { icon: Package, label: "Package" },
              { icon: Truck, label: "Truck" },
              { icon: Ship, label: "Ship" },
              { icon: FileText, label: "File" },
              { icon: Settings, label: "Settings" },
              { icon: Bell, label: "Bell" },
              { icon: Search, label: "Search" },
              { icon: Filter, label: "Filter" },
              { icon: Plus, label: "Plus" },
              { icon: Edit, label: "Edit" },
              { icon: Trash2, label: "Trash" },
              { icon: Eye, label: "Eye" },
              { icon: Download, label: "Download" }
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                background: "white",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "6px"
              }}>
                <Icon size={20} style={{ color: "#667085" }} />
                <span style={{ fontSize: "11px", color: "#667085" }}>{label}</span>
              </div>
            ))}
          </div>
          <CodeBlock code={`import { Home } from "lucide-react";

<Home size={20} style={{ color: "#667085" }} />`} />
        </div>
      </ComponentCard>

      {/* Table with Icons */}
      <ComponentCard title="Table with Icons">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "8px",
            overflow: "hidden"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "40px 2fr 1fr 1fr 1fr",
              background: "#F9FAFB",
              borderBottom: "1px solid var(--neuron-ui-border)",
              padding: "12px 16px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#667085",
              letterSpacing: "0.5px"
            }}>
              <div></div>
              <div>SERVICE</div>
              <div>STATUS</div>
              <div>TYPE</div>
              <div>DATE</div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "40px 2fr 1fr 1fr 1fr",
              background: "white",
              borderBottom: "1px solid var(--neuron-ui-border)",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#0A1D4D",
              alignItems: "center"
            }}>
              <Ship size={18} style={{ color: "#667085" }} />
              <div>Ocean Freight</div>
              <div><StatusBadge status="Active" color="#0F766E" /></div>
              <div>Import</div>
              <div>Jan 15, 2026</div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "40px 2fr 1fr 1fr 1fr",
              background: "white",
              borderBottom: "1px solid var(--neuron-ui-border)",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#0A1D4D",
              alignItems: "center"
            }}>
              <Truck size={18} style={{ color: "#667085" }} />
              <div>Land Freight</div>
              <div><StatusBadge status="Pending" color="#F59E0B" /></div>
              <div>Domestic</div>
              <div>Jan 16, 2026</div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "40px 2fr 1fr 1fr 1fr",
              background: "white",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#0A1D4D",
              alignItems: "center"
            }}>
              <Package size={18} style={{ color: "#667085" }} />
              <div>Customs Brokerage</div>
              <div><StatusBadge status="Completed" color="#3B82F6" /></div>
              <div>Export</div>
              <div>Jan 18, 2026</div>
            </div>
          </div>
          <CodeBlock code={`import { Ship } from "lucide-react";

<div style={{
  display: "grid",
  gridTemplateColumns: "40px 2fr 1fr 1fr 1fr",
  alignItems: "center"
}}>
  <Ship size={18} style={{ color: "#667085" }} />
  <div>Ocean Freight</div>
  <div>Active</div>
  ...
</div>`} />
        </div>
      </ComponentCard>

      {/* Dropdown with Icons */}
      <ComponentCard title="Dropdown with Icons">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "13px", color: "#667085", marginBottom: "8px" }}>
            Custom dropdowns can include icons for better visual clarity and categorization.
          </p>
          <div style={{
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "8px",
            padding: "16px",
            background: "#F9FAFB"
          }}>
            <div style={{
              background: "white",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "6px",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: "250px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Ship size={16} style={{ color: "#667085" }} />
                <span style={{ fontSize: "13px", color: "#0A1D4D" }}>Ocean Freight</span>
              </div>
              <ChevronDown size={14} style={{ color: "#667085" }} />
            </div>
            <div style={{
              marginTop: "4px",
              background: "white",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "6px",
              maxWidth: "250px",
              overflow: "hidden"
            }}>
              {[
                { icon: Ship, label: "Ocean Freight" },
                { icon: Truck, label: "Land Freight" },
                { icon: Package, label: "Customs Brokerage" }
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#0A1D4D",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--neuron-ui-border)"
                  }}
                >
                  <Icon size={16} style={{ color: "#667085" }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <CodeBlock code={`<div style={{
  display: "flex",
  alignItems: "center",
  gap: "8px"
}}>
  <Ship size={16} style={{ color: "#667085" }} />
  <span>Ocean Freight</span>
</div>`} />
        </div>
      </ComponentCard>

      {/* Checkboxes */}
      <ComponentCard title="Checkboxes">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "14px", color: "#667085", lineHeight: "1.6", marginBottom: "8px" }}>
            Custom checkboxes with Neuron branding. Unticked state shows white background with gray border,
            ticked state shows Neuron green background with white checkmark.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CustomCheckbox
                checked={sampleCheckbox1}
                onChange={setSampleCheckbox1}
              />
              <label style={{ fontSize: "13px", color: "#12332B", cursor: "pointer" }}
                onClick={() => setSampleCheckbox1(!sampleCheckbox1)}>
                Include optional charges
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CustomCheckbox
                checked={sampleCheckbox2}
                onChange={setSampleCheckbox2}
              />
              <label style={{ fontSize: "13px", color: "#12332B", cursor: "pointer" }}
                onClick={() => setSampleCheckbox2(!sampleCheckbox2)}>
                Apply tax (Checked state example)
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CustomCheckbox
                checked={sampleCheckbox3}
                onChange={setSampleCheckbox3}
              />
              <label style={{ fontSize: "13px", color: "#12332B", cursor: "pointer" }}
                onClick={() => setSampleCheckbox3(!sampleCheckbox3)}>
                Send notification email
              </label>
            </div>
          </div>
          <CodeBlock code={`import { CustomCheckbox } from "./components/bd/CustomCheckbox";

<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <CustomCheckbox
    checked={isChecked}
    onChange={setIsChecked}
  />
  <label 
    style={{ fontSize: "13px", color: "#12332B", cursor: "pointer" }}
    onClick={() => setIsChecked(!isChecked)}
  >
    Label text
  </label>
</div>`} />
        </div>
      </ComponentCard>
    </div>
  );
}

function ComponentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "12px",
      padding: "24px"
    }}>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "20px" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div style={{
      background: "#F9FAFB",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "6px",
      padding: "12px",
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#344054",
      overflow: "auto",
      whiteSpace: "pre-wrap"
    }}>
      {code}
    </div>
  );
}

function StatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 8px",
      background: `${color}15`,
      color: color,
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: 600
    }}>
      {status}
    </div>
  );
}

function Alert({ type, message }: { type: "success" | "warning" | "error" | "info"; message: string }) {
  const configs = {
    success: { icon: CheckCircle, color: "#0F766E", bg: "#E8F5F3" },
    warning: { icon: AlertCircle, color: "#F59E0B", bg: "#FEF3C7" },
    error: { icon: XCircle, color: "#EF4444", bg: "#FEE2E2" },
    info: { icon: Info, color: "#3B82F6", bg: "#DBEAFE" }
  };
  
  const config = configs[type];
  const Icon = config.icon;
  
  return (
    <div style={{
      display: "flex",
      gap: "12px",
      padding: "12px 16px",
      background: config.bg,
      border: `1px solid ${config.color}30`,
      borderRadius: "8px"
    }}>
      <Icon size={18} style={{ color: config.color, flexShrink: 0 }} />
      <div style={{ fontSize: "13px", color: config.color, lineHeight: "1.5" }}>
        {message}
      </div>
    </div>
  );
}

function IconButton({ 
  icon, 
  label, 
  variant = "primary" 
}: { 
  icon: React.ReactNode; 
  label: string; 
  variant?: "primary" | "secondary" | "danger" 
}) {
  const styles = {
    primary: { background: "#0F766E", color: "white", border: "none" },
    secondary: { background: "white", color: "#0F766E", border: "1px solid #0F766E" },
    danger: { background: "#EF4444", color: "white", border: "none" }
  };
  
  const style = styles[variant];
  
  return (
    <button style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 12px",
      ...style,
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: 500,
      cursor: "pointer"
    }}>
      {icon}
      {label}
    </button>
  );
}

// Principles Section
function PrinciplesSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#12332B", marginBottom: "8px" }}>
          Design Principles
        </h2>
        <p style={{ fontSize: "14px", color: "#667085", lineHeight: "1.6" }}>
          Core principles that guide all design decisions in Neuron OS.
        </p>
      </div>

      {/* Principle Cards */}
      <PrincipleCard 
        title="Stroke-Based Design"
        description="Use clean 1px stroke borders instead of box shadows for all containers, cards, and inputs. This creates a crisp, modern look that maintains clarity even in complex interfaces."
        dos={[
          "Use border: 1px solid var(--neuron-ui-border)",
          "Apply consistent border radius (6px-12px)",
          "Keep backgrounds clean and minimal"
        ]}
        donts={[
          "Avoid box shadows and drop shadows",
          "Don't use gradient borders",
          "Avoid heavy visual effects"
        ]}
      />

      <PrincipleCard 
        title="Consistent Spacing"
        description="Maintain systematic spacing throughout the application. Page padding should be 32px vertical and 48px horizontal, with internal spacing following the 4px/8px/12px/16px/24px/32px scale."
        dos={[
          "Use standard page padding: 32px 48px",
          "Follow the spacing scale (4, 8, 12, 16, 24, 32)",
          "Create visual breathing room"
        ]}
        donts={[
          "Don't use arbitrary spacing values",
          "Avoid cramped layouts",
          "Don't ignore visual hierarchy"
        ]}
      />

      <PrincipleCard 
        title="Color Hierarchy"
        description="Use the green color system purposefully. Deep green (#12332B) for headers and primary text, teal (#0F766E) for actions and selected states, and gray tones for supporting text."
        dos={[
          "Use teal for primary actions",
          "Deep green for headers",
          "Gray tones for secondary text"
        ]}
        donts={[
          "Don't overuse accent colors",
          "Avoid low contrast combinations",
          "Don't use random colors"
        ]}
      />

      <PrincipleCard 
        title="Typography Clarity"
        description="Use Inter font with clear size and weight hierarchy. Headers should be bold (600) while body text is regular (400). Maintain adequate line height for readability."
        dos={[
          "Use 600 weight for headers",
          "Keep body text at 13-14px",
          "Maintain proper line height (1.5-1.6)"
        ]}
        donts={[
          "Don't use too many font sizes",
          "Avoid mixing font families",
          "Don't use light weights for small text"
        ]}
      />

      <PrincipleCard 
        title="Module Isolation"
        description="Each work module should operate independently with clear boundaries. Modules should have their own navigation, state, and data management without cross-contamination."
        dos={[
          "Keep module data isolated",
          "Use clear module boundaries",
          "Maintain consistent navigation within modules"
        ]}
        donts={[
          "Don't share state across modules unnecessarily",
          "Avoid tight coupling between modules",
          "Don't break module boundaries"
        ]}
      />

      <PrincipleCard 
        title="Responsive Feedback"
        description="Provide immediate visual feedback for all user interactions. Hover states, active states, and loading states should be clear and consistent across all components."
        dos={[
          "Show hover states on interactive elements",
          "Provide loading indicators",
          "Use toast notifications for confirmations"
        ]}
        donts={[
          "Don't leave users guessing",
          "Avoid delayed feedback",
          "Don't hide system status"
        ]}
      />
    </div>
  );
}

function PrincipleCard({ 
  title, 
  description, 
  dos, 
  donts 
}: { 
  title: string; 
  description: string; 
  dos: string[]; 
  donts: string[] 
}) {
  return (
    <div style={{
      background: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "12px",
      padding: "24px"
    }}>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "12px" }}>
        {title}
      </h3>
      <p style={{ fontSize: "14px", color: "#667085", lineHeight: "1.6", marginBottom: "20px" }}>
        {description}
      </p>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Do's */}
        <div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            marginBottom: "12px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#0F766E"
          }}>
            <Check size={16} />
            Do
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {dos.map((item, index) => (
              <div key={index} style={{
                display: "flex",
                gap: "8px",
                fontSize: "13px",
                color: "#344054"
              }}>
                <Check size={14} style={{ color: "#0F766E", flexShrink: 0, marginTop: "2px" }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Don'ts */}
        <div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            marginBottom: "12px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#EF4444"
          }}>
            <X size={16} />
            Don't
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {donts.map((item, index) => (
              <div key={index} style={{
                display: "flex",
                gap: "8px",
                fontSize: "13px",
                color: "#344054"
              }}>
                <X size={14} style={{ color: "#EF4444", flexShrink: 0, marginTop: "2px" }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}