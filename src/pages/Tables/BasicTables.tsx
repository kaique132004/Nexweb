import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb";
import ComponentCard from "../../shared/components/common/ComponentCard";
import PageMeta from "../../shared/components/common/PageMeta";
import BasicTableOne from "../../shared/components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Basic Tables | Nexventory"
        description="Nexventory Application"
      />
      <PageBreadcrumb pageTitle="Basic Tables" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
