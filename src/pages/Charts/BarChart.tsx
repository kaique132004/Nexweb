import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb";
import ComponentCard from "../../shared/components/common/ComponentCard";
import BarChartOne from "../../shared/components/charts/bar/BarChartOne";
import PageMeta from "../../shared/components/common/PageMeta";

export default function BarChart() {
  return (
    <div>
      <PageMeta
        title="Chart | Nexventory"
        description="Nexventory Application"
      />
      <PageBreadcrumb pageTitle="Bar Chart" />
      <div className="space-y-6">
        <ComponentCard title="Bar Chart 1">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
