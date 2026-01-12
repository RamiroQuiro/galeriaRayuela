import { CircleX } from "lucide-react";
import React from "react";
import { cn } from "../../../lib/utils";

type Props = {
  onClose: (value: boolean) => void;
  children: React.ReactNode;
  className?: string;
  title: string;
  id: string;
  icon?: React.ReactNode;
};

export default function ModalReact({
  onClose,
  children,
  className,
  title,
  id,
  icon,
}: Props) {
  return (
    <div
      style={{ margin: 0, position: "fixed" }}
      className="top-0 left-0 z-[999] fixed flex justify-center items-center bg-black/80 backdrop-blur-sm mt-0 w-full h-screen"
      onClick={() => onClose(false)}
    >
      <div
        className={cn(
          `bg-[#0f0f13] border border-white/10 relative rounded-2xl overflow-hidden shadow-2xl h-fit max-w-[90dvw] overflow-y-auto w-fit min-w-[500px] ${className}`
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Fijo */}
        <div className="flex flex-shrink-0 justify-between items-center border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="font-bold text-white text-xl tracking-tight">
              {title}
            </h3>
          </div>
          <button
            id={`modal-close-${id}`}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => onClose(false)}
          >
            <CircleX size={24} />
          </button>
        </div>
        <div className="p-6 text-gray-300">{children}</div>
      </div>
    </div>
  );
}
