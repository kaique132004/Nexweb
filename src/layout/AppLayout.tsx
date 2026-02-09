import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader, { type ParsedCommand } from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const handleCommand = (cmd: ParsedCommand) => {
    console.log("Comando recebido:", cmd);
    // Exemplo: abrir modal de movimentação carregado:
    // openMovementModal({
    //   quantity_amended: cmd.qty,
    //   region_code: cmd.region,
    //   type_entry: cmd.typeEntry ?? "OUT",
    //   supply_code: cmd.supplyCode,
    //   created: cmd.date ? new Date(cmd.date) : new Date(),
    // });
  };


  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader onCommand={handleCommand} />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
