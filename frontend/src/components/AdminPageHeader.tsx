import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryActions?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  }[];
  stats?: {
    label: string;
    value: string | number;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }[];
  breadcrumb?: {
    label: string;
    href?: string;
  }[];
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryActions = [],
  stats = [],
  breadcrumb = []
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-b border-blue-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              {breadcrumb.map((item, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  {item.href ? (
                    <a href={item.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {item.label}
                    </a>
                  ) : (
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Title Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 dark:from-blue-600 dark:via-purple-600 dark:to-indigo-700 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-200 dark:ring-blue-800">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-100 bg-clip-text text-transparent">
                  {title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                  {description}
                </p>
              </div>
            </div>

            {/* Stats Section */}
            {stats.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {stats.map((stat, index) => (
                  <div 
                    key={index} 
                    className={`
                      px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border transition-all hover:shadow-md
                      ${stat.variant === "default" 
                        ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" 
                        : stat.variant === "secondary" 
                        ? "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600" 
                        : stat.variant === "destructive" 
                        ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                        : "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
                      }
                    `}
                  >
                    {stat.label}: <span className="font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Secondary Actions */}
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                onClick={action.onClick}
                className={`
                  flex items-center gap-2 font-medium transition-all hover:scale-105
                  ${action.variant === "outline" 
                    ? "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-500" 
                    : ""}
                `}
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}

            {/* Primary Action */}
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all font-medium hover:scale-105 ring-2 ring-blue-200 dark:ring-blue-800"
              >
                {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                {primaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPageHeader;
