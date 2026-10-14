import React, { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";

export interface AccordionItemData {
  id?: string | number;
  title: React.ReactNode;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  // Option 1: Standalone item
  title?: React.ReactNode;
  children?: React.ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onToggle?: () => void;

  // Option 2: List of items
  items?: AccordionItemData[];
  openIndex?: number | null;
  onToggleIndex?: (index: number | null) => void;

  iconVariant?: "plus-x" | "chevron";
  className?: string;
  itemClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onToggle,
  items,
  openIndex: controlledOpenIndex,
  onToggleIndex,
  iconVariant = "plus-x",
  className = "",
  itemClassName = "",
}) => {
  // Local state for standalone mode
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isStandaloneOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleStandaloneToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  // Local state for list mode
  const [internalOpenIndex, setInternalOpenIndex] = useState<number | null>(
    defaultOpen ? 0 : null
  );
  const currentOpenIndex =
    controlledOpenIndex !== undefined
      ? controlledOpenIndex
      : internalOpenIndex;

  const handleListToggle = (index: number) => {
    const nextIndex = currentOpenIndex === index ? null : index;
    if (onToggleIndex) {
      onToggleIndex(nextIndex);
    } else {
      setInternalOpenIndex(nextIndex);
    }
  };

  // Render list of items
  if (items && items.length > 0) {
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        {items.map((item, index) => {
          const isOpen = currentOpenIndex === index;
          return (
            <div key={item.id ?? index} className={`w-full text-left ${itemClassName}`}>
              {isOpen ? (
                /* Open State Card */
                <div className="rounded-2xl border border-purple-200 border-b-[3px] border-b-purple-300 bg-white shadow-2xs overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => handleListToggle(index)}
                    aria-expanded={true}
                    className="w-full bg-purple-50/80 p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-purple-100 cursor-pointer text-left focus:outline-none"
                  >
                    <span className="font-bold text-base sm:text-lg text-neutral-900 leading-snug">
                      {item.title}
                    </span>
                    <div className="w-8 h-8 rounded-full border border-purple-200 bg-white text-[#7d6aee] flex items-center justify-center shrink-0">
                      {iconVariant === "chevron" ? (
                        <ChevronDown className="w-4 h-4 stroke-[2.5] rotate-180 transition-transform" />
                      ) : (
                        <X className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                  <div className="bg-white p-5 text-sm sm:text-base text-neutral-700 leading-relaxed">
                    {item.content}
                  </div>
                </div>
              ) : (
                /* Closed State Card */
                <button
                  type="button"
                  onClick={() => handleListToggle(index)}
                  aria-expanded={false}
                  className="w-full bg-white rounded-2xl border border-purple-200 border-b-[3px] border-b-purple-300 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs hover:border-purple-300 transition-all cursor-pointer text-left focus:outline-none"
                >
                  <span className="font-bold text-base sm:text-lg text-neutral-900 leading-snug">
                    {item.title}
                  </span>
                  <div className="w-8 h-8 rounded-full border border-purple-100 bg-purple-50 text-[#7d6aee] flex items-center justify-center shrink-0">
                    {iconVariant === "chevron" ? (
                      <ChevronDown className="w-4 h-4 stroke-[2.5] transition-transform" />
                    ) : (
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Render standalone single accordion item
  return (
    <div className={`w-full text-left ${className}`}>
      {isStandaloneOpen ? (
        <div className="rounded-2xl border border-purple-200 border-b-[3px] border-b-purple-300 bg-white shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={handleStandaloneToggle}
            aria-expanded={true}
            className="w-full bg-purple-50/80 p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-purple-100 cursor-pointer text-left focus:outline-none"
          >
            <span className="font-bold text-base sm:text-lg text-neutral-900 leading-snug">
              {title}
            </span>
            <div className="w-8 h-8 rounded-full border border-purple-200 bg-white text-[#7d6aee] flex items-center justify-center shrink-0">
              {iconVariant === "chevron" ? (
                <ChevronDown className="w-4 h-4 stroke-[2.5] rotate-180 transition-transform" />
              ) : (
                <X className="w-4 h-4 stroke-[2.5]" />
              )}
            </div>
          </button>
          <div className="bg-white p-5 text-sm sm:text-base text-neutral-700 leading-relaxed">
            {children}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleStandaloneToggle}
          aria-expanded={false}
          className="w-full bg-white rounded-2xl border border-purple-200 border-b-[3px] border-b-purple-300 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs hover:border-purple-300 transition-all cursor-pointer text-left focus:outline-none"
        >
          <span className="font-bold text-base sm:text-lg text-neutral-900 leading-snug">
            {title}
          </span>
          <div className="w-8 h-8 rounded-full border border-purple-100 bg-purple-50 text-[#7d6aee] flex items-center justify-center shrink-0">
            {iconVariant === "chevron" ? (
              <ChevronDown className="w-4 h-4 stroke-[2.5] transition-transform" />
            ) : (
              <Plus className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>
        </button>
      )}
    </div>
  );
};

export default Accordion;
