import { useState } from 'react';
import PageHeader from '@/components/data-display/PageHeader';
import SectionCard from '@/components/data-display/SectionCard';
import Tabs from '@/components/ui/Tabs';
import InventoryPurchases from '@/features/inventory/components/Purchases';;
import InventoryStock from '@/features/inventory/components/Stock';;
import InventorySuppliers from '@/features/inventory/components/Suppliers';;
import InventoryReturns from '@/features/inventory/components/Returns';;
import InventoryMovements from '@/features/inventory/components/Movements';;

const InventoryPage = ({ token }: { token: string }) => {
  const [tab, setTab] = useState('stock');

  return (
    <div className="flex flex-col">
      <PageHeader title="Inventory" subtitle="Stock levels, purchase orders and suppliers" />

      <SectionCard className="mt-6">
        <Tabs
          tabs={[
            { key: 'stock', label: 'Products & Stock' },
            { key: 'suppliers', label: 'Suppliers' },
            { key: 'purchases', label: 'Purchases' },
            { key: 'returns', label: 'Returns' },
            { key: 'movements', label: 'Movements' },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="p-6">
          {tab === 'stock' && <InventoryStock token={token} />}
          {tab === 'suppliers' && <InventorySuppliers token={token} />}
          {tab === 'purchases' && <InventoryPurchases token={token} />}
          {tab === 'returns' && <InventoryReturns token={token} />}
          {tab === 'movements' && <InventoryMovements token={token} />}
        </div>
      </SectionCard>
    </div>
  );
};

export default InventoryPage;