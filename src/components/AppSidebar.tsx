/**
 * AppSidebar – komponen sidebar bersama untuk /app dan /dash.
 * Dipanggil dari UserApp dan AdminDash.
 */
import React from "react";
import { PanelLeft, PanelLeftOpen } from "lucide-react";

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export interface SidebarFooterItem {
  avatar?: string;
  name: string;
  email?: string;
  onEdit?: () => void;
  onLogout?: () => void;
}

export interface AppSidebarProps {
  /** Logo section */
  logoSrc?: string;
  brandName?: React.ReactNode;
  brandSubtitle?: string;
  onLogoClick?: () => void;
  /** External link button (optional legacy slot) */
  externalButton?: React.ReactNode;
  /** Navigation items */
  navItems: SidebarNavItem[];
  /** Footer nav items (e.g. Settings) */
  footerNavItems?: SidebarNavItem[];
  /** Footer user card */
  footerUser?: SidebarFooterItem;
  /** Logout button in footer (UserApp style) */
  onLogout?: () => void;
  /** Collapsible (AdminDash & UserApp) */
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  logoSrc = "/logos/satucerita.png",
  brandName,
  brandSubtitle,
  onLogoClick,
  externalButton,
  navItems,
  footerNavItems = [],
  footerUser,
  onLogout,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
}) => {
  const isCollapsed = collapsible && collapsed;

  return (
    <aside
      className={`hidden md:flex flex-col ${
        isCollapsed ? "w-[74px]" : "w-[220px] lg:w-[250px]"
      } bg-white border-r border-neutral-200/80 min-h-screen h-screen sticky top-0 shrink-0 z-30 justify-between p-2.5`}
    >
      <div className="flex flex-col gap-4">
        {/* === LOGO / BRAND HEADER === */}
        {isCollapsed ? (
          <div className="flex items-center justify-center pb-3 border-b border-neutral-100">
            {collapsible && onToggleCollapse ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Buka Sidebar"
                className="relative size-10 rounded-xl overflow-hidden shrink-0 border border-purple-100 shadow-2xs group cursor-pointer focus:outline-none"
                aria-label="Buka Sidebar"
              >
                <img
                  src={logoSrc}
                  alt="Satu Cerita"
                  className="w-full h-full object-cover transition-opacity group-hover:opacity-0"
                />
                <div className="absolute inset-0 bg-[#7d6aee] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PanelLeftOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
              </button>
            ) : (
              <div className="size-10 rounded-xl overflow-hidden shrink-0 border border-purple-100 shadow-2xs">
                <img src={logoSrc} alt="Satu Cerita" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div
              className="flex items-center gap-2 min-w-0 cursor-pointer"
              onClick={onLogoClick}
            >
              <div className="size-8 rounded-xl overflow-hidden shrink-0 border border-purple-100 shadow-2xs">
                <img src={logoSrc} alt="Satu Cerita" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                {brandName && (
                  <span className="text-base font-black tracking-tight text-neutral-900 block leading-tight truncate">
                    {brandName}
                  </span>
                )}
                {brandSubtitle && (
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    {brandSubtitle}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {externalButton}
              {collapsible && onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title="Tutup Sidebar"
                  className="p-1.5 text-neutral-400 hover:text-[#7d6aee] hover:bg-purple-50 rounded-lg cursor-pointer shrink-0 transition-colors"
                  aria-label="Tutup Sidebar"
                >
                  <PanelLeft className="w-4 h-4 stroke-[2.2]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* === NAV ITEMS === */}
        <nav className="space-y-0.5">
          {!isCollapsed && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-3 pb-1 block">
              Menu Utama
            </span>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive ?? false;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                title={item.label}
                className={`w-full flex items-center ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                } rounded-xl text-[14px] font-semibold cursor-pointer ${
                  isActive
                    ? "bg-[#7d6aee] text-white shadow-2xs font-extrabold border border-[#7d6aee] border-b-[3px] border-b-[#5c47dc]"
                    : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5 min-w-0"}`}>
                  <Icon className={`w-[14px] h-[14px] shrink-0 ${isActive ? "text-white" : "text-neutral-500"}`} />
                  {!isCollapsed && <span className="truncate text-[14px]">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      isActive ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* === SIDEBAR FOOTER (Tanpa garis separator atas) === */}
      <div className="flex flex-col gap-2 pt-2">
        {/* Footer nav items (e.g. Settings) */}
        {footerNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive ?? false;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              title={item.label}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
              } rounded-xl text-[14px] font-semibold cursor-pointer ${
                isActive
                  ? "bg-[#7d6aee] text-white shadow-2xs font-extrabold border border-[#7d6aee] border-b-[3px] border-b-[#5c47dc]"
                  : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
                <Icon className={`w-[14px] h-[14px] shrink-0 ${isActive ? "text-white" : "text-neutral-500"}`} />
                {!isCollapsed && <span className="text-[14px]">{item.label}</span>}
              </div>
            </button>
          );
        })}

        {/* User Card */}
        {footerUser && (
          <div
            onClick={footerUser.onEdit}
            className={`flex items-center ${
              isCollapsed ? "justify-center p-1.5" : "justify-between gap-2 p-2"
            } rounded-2xl bg-neutral-50 border border-neutral-200/70 cursor-pointer group hover:border-purple-200`}
            title={footerUser.email}
          >
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5 min-w-0"}`}>
              {footerUser.avatar ? (
                <img
                  src={footerUser.avatar}
                  alt={footerUser.name}
                  className="size-9 rounded-full object-cover border border-[#7d6aee]/30 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="size-9 rounded-full bg-purple-100 text-[#7d6aee] font-black flex items-center justify-center shrink-0 text-sm">
                  {footerUser.name.charAt(0)}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 truncate leading-tight">
                    {footerUser.name}
                  </p>
                  {footerUser.email && (
                    <p className="text-[11px] text-neutral-500 truncate leading-tight">
                      {footerUser.email}
                    </p>
                  )}
                </div>
              )}
            </div>
            {!isCollapsed && onLogout && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                title="Keluar dari akun"
                className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 shrink-0 cursor-pointer"
                aria-label="Tombol Logout"
              >
                {/* Logout icon */}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
            {!isCollapsed && !onLogout && footerUser.onEdit && (
              <div className="p-1 rounded-lg text-neutral-400 group-hover:text-[#7d6aee] shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
