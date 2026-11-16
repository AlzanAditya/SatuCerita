import React from "react";

interface CollapseProps {
  open: boolean;
  children: React.ReactNode;
  id?: string;
}

/** Buka/tutup halus (tinggi animasi) tanpa mengukur DOM. Konten tertutup tidak bisa difokus. */
export const Collapse: React.FC<CollapseProps> = ({ open, children, id }) => (
  <div
    id={id}
    inert={!open}
    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
    }`}
  >
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>
);

export default Collapse;
