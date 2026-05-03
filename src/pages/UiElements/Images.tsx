import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb";
import ResponsiveImage from "../../shared/components/ui/images/ResponsiveImage";
import TwoColumnImageGrid from "../../shared/components/ui/images/TwoColumnImageGrid";
import ThreeColumnImageGrid from "../../shared/components/ui/images/ThreeColumnImageGrid";
import ComponentCard from "../../shared/components/common/ComponentCard";
import PageMeta from "../../shared/components/common/PageMeta";

export default function Images() {
  return (
    <>
      <PageMeta
        title="Images Dashboard | Nexventory"
        description="Nexventory Application"
      />
      <PageBreadcrumb pageTitle="Images" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Responsive image">
          <ResponsiveImage />
        </ComponentCard>
        <ComponentCard title="Image in 2 Grid">
          <TwoColumnImageGrid />
        </ComponentCard>
        <ComponentCard title="Image in 3 Grid">
          <ThreeColumnImageGrid />
        </ComponentCard>
      </div>
    </>
  );
}
