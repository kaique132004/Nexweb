import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb";
import ComponentCard from "../../shared/components/common/ComponentCard";
import LineChartOne from "../../shared/components/charts/line/LineChartOne";
import PageMeta from "../../shared/components/common/PageMeta";

export default function LineChart() {
  return (
    <>
      <PageMeta
        title="Chart | Nexventory"
        description="Nexventory Application"
      />
      <PageBreadcrumb pageTitle="Line Chart" />
      <div className="space-y-6">
        <ComponentCard title="Line Chart 1">
          <LineChartOne />
        </ComponentCard>
      </div>
    </>
  );
}
