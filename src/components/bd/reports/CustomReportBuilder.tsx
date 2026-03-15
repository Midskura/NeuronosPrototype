import { useState } from 'react';
import { ChevronLeft, Play, Plus, X } from 'lucide-react';

interface CustomReportBuilderProps {
  onBack: () => void;
  onRunReport: (config: any) => void;
}

const DATA_SOURCES = [
  { value: 'quotations', label: 'Quotations', icon: '📝' },
  { value: 'customers', label: 'Customers', icon: '🏢' },
  { value: 'contacts', label: 'Contacts', icon: '👤' },
  { value: 'activities', label: 'Activities', icon: '📅' },
  { value: 'budget_requests', label: 'Budget Requests', icon: '💰' },
];

const FIELD_OPTIONS: Record<string, any[]> = {
  quotations: [
    { value: 'id', label: 'Quotation ID' },
    { value: 'quotation_name', label: 'Quotation Name' },
    { value: 'customer_id', label: 'Customer' },
    { value: 'status', label: 'Status' },
    { value: 'total_amount', label: 'Total Amount' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'created_by', label: 'Created By' },
  ],
  customers: [
    { value: 'id', label: 'Customer ID' },
    { value: 'company_name', label: 'Company Name' },
    { value: 'industry', label: 'Industry' },
    { value: 'country', label: 'Country' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'account_manager', label: 'Account Manager' },
  ],
  contacts: [
    { value: 'id', label: 'Contact ID' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'customer_id', label: 'Customer' },
    { value: 'created_at', label: 'Created Date' },
  ],
  activities: [
    { value: 'id', label: 'Activity ID' },
    { value: 'title', label: 'Title' },
    { value: 'type', label: 'Type' },
    { value: 'status', label: 'Status' },
    { value: 'created_at', label: 'Date' },
    { value: 'assigned_to', label: 'Assigned To' },
  ],
  budget_requests: [
    { value: 'id', label: 'Request ID' },
    { value: 'purpose', label: 'Purpose' },
    { value: 'amount', label: 'Amount' },
    { value: 'status', label: 'Status' },
    { value: 'requested_by', label: 'Requested By' },
    { value: 'created_at', label: 'Request Date' },
  ],
};

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'In List' },
  { value: 'date_after', label: 'After Date' },
  { value: 'date_before', label: 'Before Date' },
];

export function CustomReportBuilder({ onBack, onRunReport }: CustomReportBuilderProps) {
  const [dataSource, setDataSource] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<any[]>([]);

  const availableFields = dataSource ? FIELD_OPTIONS[dataSource] || [] : [];

  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: string, value: any) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: value };
    setFilters(updated);
  };

  const toggleColumn = (field: string) => {
    if (selectedColumns.includes(field)) {
      setSelectedColumns(selectedColumns.filter(c => c !== field));
    } else {
      setSelectedColumns([...selectedColumns, field]);
    }
  };

  const handleRunReport = () => {
    const config = {
      dataSource,
      columns: selectedColumns.length > 0 ? selectedColumns : undefined,
      filters: filters.length > 0 ? filters : undefined,
      sortBy: sortBy.length > 0 ? sortBy : undefined,
    };
    onRunReport(config);
  };

  const isValid = dataSource && selectedColumns.length > 0;

  return (
    <div className="h-full flex flex-col" style={{ padding: '32px 48px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#0F766E',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '16px',
            padding: '4px 0',
          }}
        >
          <ChevronLeft size={20} />
          Back to Reports
        </button>
        <h1 style={{ color: '#12332B', marginBottom: '8px' }}>Build Custom Report</h1>
        <p style={{ color: '#666' }}>
          Create a custom report by selecting data source, columns, and filters
        </p>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '900px' }}>
        {/* Step 1: Select Data Source */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#12332B', marginBottom: '16px' }}>Step 1: Select Data Source</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {DATA_SOURCES.map((source) => (
              <button
                key={source.value}
                onClick={() => {
                  setDataSource(source.value);
                  setSelectedColumns([]);
                  setFilters([]);
                }}
                style={{
                  backgroundColor: dataSource === source.value ? '#F0FDFA' : 'white',
                  border: dataSource === source.value ? '2px solid #0F766E' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{source.icon}</div>
                <div style={{ color: '#12332B', fontSize: '14px' }}>{source.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Columns */}
        {dataSource && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#12332B', marginBottom: '16px' }}>Step 2: Select Columns to Display</h3>
            <div
              style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {availableFields.map((field) => (
                  <label
                    key={field.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: selectedColumns.includes(field.value) ? '#F0FDFA' : '#F9FAFB',
                      border: selectedColumns.includes(field.value) ? '1px solid #0F766E' : '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(field.value)}
                      onChange={() => toggleColumn(field.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: '#12332B', fontSize: '14px' }}>{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Add Filters */}
        {dataSource && selectedColumns.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#12332B' }}>Step 3: Add Filters (Optional)</h3>
              <button
                onClick={addFilter}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #0F766E',
                  color: '#0F766E',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                Add Filter
              </button>
            </div>

            {filters.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filters.map((filter, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(index, 'field', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                      }}
                    >
                      <option value="">Select field...</option>
                      {availableFields.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                      }}
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, 'value', e.target.value)}
                      placeholder="Value..."
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                      }}
                    />

                    <button
                      onClick={() => removeFilter(index)}
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        color: '#EF4444',
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Run Button */}
        {isValid && (
          <div style={{ paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
            <button
              onClick={handleRunReport}
              style={{
                backgroundColor: '#0F766E',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0D6259';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0F766E';
              }}
            >
              <Play size={16} />
              Generate Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
