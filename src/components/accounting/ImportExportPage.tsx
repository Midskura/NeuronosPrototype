import { Button } from "../ui/button";
import { Upload, Download, FileText } from "lucide-react";

export function ImportExportPage() {
  return (
    <>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-[var(--theme-text-primary)] mb-2">Import / Export</h1>
        <p className="text-[14px] text-[var(--theme-text-muted)] leading-[20px]">
          Import and export accounting data
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="border border-[var(--theme-border-default)] p-6" style={{ borderRadius: 'var(--radius-sm)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[var(--theme-bg-page)] rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-[var(--theme-text-primary)]" />
            </div>
            <div>
              <h2 className="text-[var(--theme-text-primary)] mb-1">Import Data</h2>
              <p className="text-[14px] text-[var(--theme-text-muted)] leading-[20px]">
                Upload CSV or Excel files
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full h-10 justify-start" 
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Import Expenses
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 justify-start" 
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Import Payments
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 justify-start" 
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Import Accounts
            </Button>
          </div>

          <div className="mt-6 p-4 bg-[var(--theme-bg-page)] text-[14px] text-[var(--theme-text-muted)] leading-[20px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Supported formats: CSV, XLSX. Maximum file size: 5MB
          </div>
        </div>

        {/* Export Section */}
        <div className="border border-[var(--theme-border-default)] p-6" style={{ borderRadius: 'var(--radius-sm)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[var(--theme-bg-page)] rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-[var(--theme-text-primary)]" />
            </div>
            <div>
              <h2 className="text-[var(--theme-text-primary)] mb-1">Export Data</h2>
              <p className="text-[14px] text-[var(--theme-text-muted)] leading-[20px]">
                Download reports and data
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full h-10 justify-start" 
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Entries
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 justify-start" 
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Approved Only
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 justify-start" 
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Chart of Accounts
            </Button>
          </div>

          <div className="mt-6 p-4 bg-[var(--theme-bg-page)] text-[14px] text-[var(--theme-text-muted)] leading-[20px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Exports include all data within selected date range
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 border border-[var(--theme-border-default)] p-6" style={{ borderRadius: 'var(--radius-sm)' }}>
        <h2 className="text-[var(--theme-text-primary)] mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[14px] leading-[20px]">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[var(--theme-text-muted)]" />
              <span className="text-[var(--theme-text-secondary)]">Exported expenses (Jan 2025)</span>
            </div>
            <span className="text-[var(--theme-text-muted)]">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between text-[14px] leading-[20px]">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[var(--theme-text-muted)]" />
              <span className="text-[var(--theme-text-secondary)]">Imported 45 expense entries</span>
            </div>
            <span className="text-[var(--theme-text-muted)]">1 day ago</span>
          </div>
          <div className="flex items-center justify-between text-[14px] leading-[20px]">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[var(--theme-text-muted)]" />
              <span className="text-[var(--theme-text-secondary)]">Exported chart of accounts</span>
            </div>
            <span className="text-[var(--theme-text-muted)]">3 days ago</span>
          </div>
        </div>
      </div>
    </>
  );
}
