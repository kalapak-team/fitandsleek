import React, { createContext, useContext, useMemo, useState } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ open: controlledOpen, onOpenChange, defaultOpen = false, children }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const value = useMemo(() => ({ open, setOpen }), [open, setOpen]);
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function Sidebar({ className = "", children }) {
  const { open, setOpen } = useSidebar();
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] bg-white border-r border-zinc-200 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${className}`}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarHeader({ className = "", children }) {
  return <div className={`p-4 border-b border-zinc-200 ${className}`}>{children}</div>;
}

export function SidebarContent({ className = "", children }) {
  return <div className={`p-4 overflow-y-auto h-[calc(100%-120px)] ${className}`}>{children}</div>;
}

export function SidebarFooter({ className = "", children }) {
  return <div className={`p-4 border-t border-zinc-200 ${className}`}>{children}</div>;
}

export function SidebarGroup({ className = "", children }) {
  return <div className={`mb-6 ${className}`}>{children}</div>;
}

export function SidebarGroupLabel({ className = "", children }) {
  return <div className={`text-xs font-black tracking-wide uppercase text-zinc-500 mb-3 ${className}`}>{children}</div>;
}

export function SidebarMenu({ className = "", children }) {
  return <ul className={`space-y-1 ${className}`}>{children}</ul>;
}

export function SidebarMenuItem({ className = "", children }) {
  return <li className={className}>{children}</li>;
}

export function SidebarMenuButton({ className = "", children, asChild = false, ...props }) {
  const baseClass = `w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition ${className}`;
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `${children.props.className || ""} ${baseClass}`,
      ...props,
    });
  }
  return (
    <button className={baseClass} {...props}>
      {children}
    </button>
  );
}

export function SidebarSeparator({ className = "" }) {
  return <div className={`h-px bg-zinc-200 my-4 ${className}`} />;
}

export function SidebarTrigger({ className = "", children }) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={className}
      aria-expanded={open}
      aria-label="Toggle menu"
    >
      {children}
    </button>
  );
}

export function SidebarInset({ className = "", children }) {
  return <div className={className}>{children}</div>;
}

export function SidebarRail() {
  return null;
}
