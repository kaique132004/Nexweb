import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDownIcon, GridIcon, HorizontaLDots, ListIcon, PageIcon, QRCodeIcon, TableIcon, UserCircleIcon } from "../../../assets/icons";
import { useSidebar } from "../../../context/SidebarContext";


type SubItem = { 
  name: string; 
  path: string; 
  pro?: boolean; 
  new?: boolean;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [
      { name: "Supply", path: "/", pro: false },
      // { name: "Asset", path: "/Asset", pro: false }
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "User List",
    path: "/user-list",
  },
  {
    name: "Regions",
    icon: <ListIcon />,
    path: "/region-list",
  },
  {
    name: "Supply",
    icon: <TableIcon />,
    path: "/supply-list",
  },
  {
    name: "Movements",
    icon: <PageIcon />,
    path: "/transaction-list",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <QRCodeIcon />,
    name: "Generate QRCode",
    path: "/404",
  },
];

type MenuType = "main" | "others";

const getItemsByType = (type: MenuType) =>
  type === "main" ? navItems : othersItems;

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: MenuType;
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );

  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Abre automaticamente o submenu correspondente à rota ativa
  useEffect(() => {
    let submenuMatched = false as boolean;

    (["main", "others"] as MenuType[]).forEach((menuType) => {
      const items = getItemsByType(menuType);

      items.forEach((nav, index) => {
        if (!nav.subItems) return;

        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType, index });
            submenuMatched = true;
          }
        });
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [isActive]);

  // Calcula a altura do submenu aberto para animação
  useEffect(() => {
    if (!openSubmenu) return;

    const key = `${openSubmenu.type}-${openSubmenu.index}`;
    const el = subMenuRefs.current[key];

    if (el) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [key]: el.scrollHeight || 0,
      }));
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: MenuType) => {
    setOpenSubmenu((prev) =>
      prev && prev.type === menuType && prev.index === index
        ? null
        : { type: menuType, index }
    );
  };

  const isSidebarOpen = isExpanded || isHovered || isMobileOpen;

  const renderMenuItems = (items: NavItem[], menuType: MenuType) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const hasSubItems = !!nav.subItems;
        const isSubmenuOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;
        const key = `${menuType}-${index}`;

        return (
          <li key={nav.name}>
            {hasSubItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  isSubmenuOpen ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isSubmenuOpen
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>

                {isSidebarOpen && (
                  <>
                    <span className="menu-item-text">{nav.name}</span>
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        isSubmenuOpen ? "rotate-180 text-[#4c3de3]" : ""
                      }`}
                    />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>

                  {isSidebarOpen && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}

            {hasSubItems && isSidebarOpen && (
              <div
                ref={(el) => {
                  subMenuRefs.current[key] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: isSubmenuOpen ? `${subMenuHeight[key] || 0}px` : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems!.map((subItem) => {
                    const active = isActive(subItem.path);
                    const badgeBaseClass = "menu-dropdown-badge";
                    const badgeColorClass = active
                      ? "menu-dropdown-badge-active"
                      : "menu-dropdown-badge-inactive";

                    return (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`menu-dropdown-item ${
                            active
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}

                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${badgeColorClass} ${badgeBaseClass}`}
                              >
                                new
                              </span>
                            )}

                            {subItem.pro && (
                              <span
                                className={`ml-auto ${badgeColorClass} ${badgeBaseClass}`}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`
        fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 
        bg-[#2B3E2B] dark:bg-[#1e1e1e] dark:border-gray-800 
        text-white h-screen transition-all duration-300 ease-in-out 
        z-50 border-r border-[#4c3de3]
        ${isSidebarOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isSidebarOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/logo.png"
                alt="Logo"
                width={270}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/logo.png"
                alt="Logo"
                width={270}
                height={40}
              />
            </>
          ) : (
            <img
              src="/logo.png"
              alt="Logo"
              width={102}
              height={102}
            />
          )}
        </Link>
      </div>

      {/* Menus - com padding bottom para não sobrepor o footer */}
      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar pb-32">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`
                  mb-4 text-xs uppercase flex leading-5 text-white
                  ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }
                `}
              >
                {isSidebarOpen ? "Menu" : <HorizontaLDots className="size-6" />}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div>
              <h2
                className={`
                  mb-4 text-xs uppercase flex leading-5 text-white
                  ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }
                `}
              >
                {isSidebarOpen ? "Others" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>

      {/* Footer - fixo no bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 bg-[#2B3E2B] dark:bg-[#1e1e1e] border-t border-[#4c3de3]/30">
        {isSidebarOpen ? (
          <div className="flex flex-col gap-3 pt-4">
            {/* Botão de Report */}
            <Link
              to="/report"
              className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Report Bug / Suggestion</span>
            </Link>

            {/* Copyright */}
            <div className="text-xs text-white/50 text-center">
              © {new Date().getFullYear()} Araxios
              <br />
              <span className="text-[10px]">All rights reserved</span>
            </div>
          </div>
        ) : (
          // Versão colapsada - apenas ícone
          <div className="flex flex-col items-center gap-3 pt-4">
            <Link
              to="/report"
              className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Report Bug / Suggestion"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </Link>
            <div className="text-[10px] text-white/50 text-center">
              © {new Date().getFullYear()}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
