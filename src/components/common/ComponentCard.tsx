import React from "react";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;           // Additional custom classes for styling
  desc?: string;                // Description text
  actions?: React.ReactNode;    // 🔥 Um ou vários elementos de ação no header
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  actions,
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 ${className}`}
    >
      {/* Card Header */}
      <div className="px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-gray-800">
            {title}
          </h3>
          {desc && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {desc}
            </p>
          )}
        </div>

        {/* 🔥 Área opcional para várias ações (botões, dropdowns, tabs, etc.) */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
