import React, { type ReactNode } from "react";

interface ComponentCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  desc?: ReactNode;
  actions?: ReactNode;
}

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className,
  desc,
  actions,
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white",
        "dark:border-gray-800 dark:bg-white/3",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex gap-4 px-4 py-4 sm:px-6 sm:py-5",
          // mobile: coluna, md+: linha
          "flex-col md:flex-row md:items-center md:justify-between"
        )}
      >
        {/* Título + descrição ocupam largura inteira em mobile */}
        <div className="min-w-0">
          <h3 className="text-base font-medium text-gray-800 dark:text-gray-100 truncate">
            {title}
          </h3>

          {desc && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {desc}
            </p>
          )}
        </div>

        {/* Ações: quebram linha em mobile, alinham à direita em md+ */}
        {actions && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              "md:justify-end"
            )}
          >
            {actions}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
