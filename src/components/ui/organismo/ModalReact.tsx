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
      className="top-0 left-0 z-[999] fixed flex justify-center items-center bg-black bg-opacity-70 backdrop-blur-sm mt-0 w-full h-screen"
      onClick={() => onClose(false)}
    >
      <div
        className={cn(
          `bg-white relative rounded-lg overflow-hidden border-l-2 text-border-primary-100/80 mt-0 shadow-lg h-fit max-w-[90dvw] overflow-y-auto w-fit min-w-[50dvw] ${className}`
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Fijo */}
        <div className="flex flex-shrink-0 justify-between items-center bg-primary-bg-componentes p-4 border-b">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-gray-800 text-xl">{title}</h3>
          </div>
          <button
            id={`modal-close-${id}`}
            className="p-1 rounded-full text-gray-500 hover:text-primary-100 transition-colors"
            onClick={() => onClose(false)}
          >
            <CircleX size={24} />
          </button>
        </div>
        <div className="flex-grow p-6  flex-1 max-h-[90vh] overflow-y-auto text-primary-texto">
          {children}
        </div>
      </div>
    </div>
  );
}
