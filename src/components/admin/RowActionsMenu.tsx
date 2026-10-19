import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  hidden?: boolean;
  danger?: boolean;
  /** Tailwind text color class for the icon (ignored when danger) */
  iconClassName?: string;
}

export interface RowActionSection {
  title?: string;
  items: RowAction[];
}

const MENU_WIDTH = 256;

// Fixed-position dropdown so it is not clipped by the table's overflow-x-auto wrapper
export default function RowActionsMenu({ sections }: { sections: RowActionSection[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleSections = sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.hidden) }))
    .filter((s) => s.items.length > 0);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !menuRef.current) return;
    const btn = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const fitsBelow = btn.bottom + 4 + menuHeight <= window.innerHeight;
    const top = fitsBelow ? btn.bottom + 4 : Math.max(8, btn.top - 4 - menuHeight);
    const left = Math.max(8, Math.min(btn.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (visibleSections.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => { setPos(null); setOpen((o) => !o); }}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border transition-colors ${
          open ? 'border-gray-400 bg-gray-100 text-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-4 h-4" />
        Más
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: MENU_WIDTH, visibility: pos ? 'visible' : 'hidden' }}
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-left whitespace-normal"
        >
          {visibleSections.map((section, si) => (
            <div key={si} className={si > 0 ? 'border-t border-gray-100 mt-1 pt-1' : ''}>
              {section.title && (
                <div className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    role="menuitem"
                    onClick={() => { setOpen(false); item.onClick(); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      item.danger ? 'text-red-700 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${item.danger ? 'text-red-600' : item.iconClassName || 'text-gray-500'}`} />
                    <span className="text-left">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
