"use client";
import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface TableColumn {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'date';
  sortKey?: string
}

interface TableProps {
  title?: string;
  columns: TableColumn[];
  data: any[];
  className?: string;
  maxHeight?: string;
  showIndex?: boolean;
  emptyMessage?: string;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export function Table({ 
  title, 
  columns, 
  data, 
  className = "", 
  maxHeight = "400px",
  showIndex = false,
  emptyMessage = "No data available",
  defaultSort
}: TableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(defaultSort || null);

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const { key, direction } = sortConfig;
    const column = columns.find(col => col.key === key);
    
    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle different data types
      if (column?.sortType === 'number') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (column?.sortType === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        // Default string sorting
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, columns]);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (!current || current.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return null; // Remove sorting
    });
  };

  const getSortIcon = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return null;

    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-500" />;
    }

    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-400" />
      : <ChevronDown className="h-4 w-4 text-blue-400" />;
  };
  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        )}
        <div className="flex items-center justify-center h-32 text-gray-400">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {title && (
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      )}
      
      <div className="p-6">
        <div 
          className="overflow-auto rounded-lg border border-gray-700"
          style={{ maxHeight }}
        >
          <table className="w-full">
            <thead className="bg-gray-900 sticky top-0">
              <tr>
                {showIndex && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider ${
                      column.align === 'center' ? 'text-center' :
                      column.align === 'right' ? 'text-right' : 'text-left'
                    } ${column.sortable ? 'cursor-pointer hover:text-gray-200 transition-colors select-none' : ''}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{column.header}</span>
                      {getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {sortedData.map((row, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-gray-750 transition-colors duration-150"
                >
                  {showIndex && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {index + 1}
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-4 whitespace-nowrap text-sm text-gray-300 ${
                        column.align === 'center' ? 'text-center' :
                        column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
