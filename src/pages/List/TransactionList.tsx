import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import TransactionFormModal from "../../components/Supply/TransactionFormModal";
import ConsumptionsTable, { type TransactionResponse } from "../../components/tables/SupplyList/ConsumptionsTable";
import Button from "../../components/ui/button/Button";

export default function TransactionList() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<TransactionResponse | any>(null);


    const openCreate = () => {
        setEditingRegion(null);
        setIsFormOpen(true);
    };

    const handleSaved = () => {
        setIsFormOpen(false);
    }


    return (
        <>
            <PageMeta title="Transaction List | Nexventory" description="Create a new register" />
            <PageBreadcrumb pageTitle="Transaction List" />
            <ComponentCard
                title="Transaction Table"
                actions={
                    <>
                        <Button size="sm" variant="outline">Export Transaction List</Button>
                        <Button size="sm">Close Count Week</Button>
                        <Button size="sm">Filter</Button>
                        <Button
                            size="sm"
                            variant="primary"
                            startIcon={<span className="text-base leading-none">+</span>}
                            onClick={openCreate}>Register new Consumption</Button>
                    </>
                }
            >
                <ConsumptionsTable />
            </ComponentCard>

            <TransactionFormModal
                isOpen={isFormOpen}
                closeModal={() => setIsFormOpen(false)}
                transaction={editingRegion}      // 🔥 se null => create, se tiver supply => edit
                onSaved={handleSaved}
            />
        </>
    );
}