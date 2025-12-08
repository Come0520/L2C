'use client';

import React, { useEffect } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { InboundTable } from '@/features/products/tools/components/InboundTable';
import { InventoryTable } from '@/features/products/tools/components/InventoryTable';
import { Loading } from '@/features/products/tools/components/loading';
import { OutboundTable } from '@/features/products/tools/components/OutboundTable';
import { ProductDetailModal } from '@/features/products/tools/components/ProductDetailModal';
import { StatsOverview } from '@/features/products/tools/components/StatsOverview';
import { ToolsHeader } from '@/features/products/tools/components/ToolsHeader';
import { ToolsSearchBar } from '@/features/products/tools/components/ToolsSearchBar';
import { ToolsTabs } from '@/features/products/tools/components/ToolsTabs';
import { useToolsPageState } from '@/features/products/tools/useToolsPageState';

export default function SalesToolsPage() {
  const {
    activeTab, searchTerm, statusFilter, currentPage, selectedStore, selectedProduct, isLoading,
    salesTools, stockRecords, stockStats, stores, statusOptions,
    filteredTools, paginatedTools, filteredRecords, totalPages, itemsPerPage,
    getStatusText, getStatusColor, getRecordTypeText, getRecordTypeBadge,
    setActiveTab, setSearchTerm, setStatusFilter, setCurrentPage, setSelectedStore, setSelectedProduct, setIsLoading
  } = useToolsPageState();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  const handleSearch = () => {
    console.log('Searching...', searchTerm, statusFilter);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {isLoading ? (
          <Loading activeTab={activeTab} />
        ) : (
          <>
            <ToolsHeader selectedStore={selectedStore} stores={stores} onStoreChange={setSelectedStore} />
            <ToolsTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <ToolsSearchBar
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              activeTab={activeTab}
              statusOptions={statusOptions}
              selectedStore={selectedStore}
              onSearchTermChange={setSearchTerm}
              onStatusFilterChange={setStatusFilter}
              onSearch={handleSearch}
            />

            {activeTab === 'inventory' && (
              <InventoryTable
                tools={paginatedTools}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTools.length}
                itemsPerPage={itemsPerPage}
                getStatusText={getStatusText}
                getStatusColor={getStatusColor}
                onPageChange={setCurrentPage}
                onViewProduct={setSelectedProduct}
              />
            )}

            {activeTab === 'inbound' && (
              <InboundTable records={filteredRecords} getRecordTypeBadge={getRecordTypeBadge} />
            )}

            {activeTab === 'outbound' && (
              <OutboundTable records={filteredRecords} getRecordTypeBadge={getRecordTypeBadge} />
            )}

            {activeTab === 'stats' && (
              <StatsOverview
                stats={stockStats}
                tools={salesTools}
                selectedStore={selectedStore}
                getStatusText={getStatusText}
                getStatusColor={getStatusColor}
              />
            )}

            <ProductDetailModal
              product={selectedProduct}
              stockRecords={stockRecords}
              getStatusText={getStatusText}
              getStatusColor={getStatusColor}
              getRecordTypeText={getRecordTypeText}
              onClose={() => setSelectedProduct(null)}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
