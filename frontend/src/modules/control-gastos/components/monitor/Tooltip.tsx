import React, { useState } from 'react';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900',
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-[200] whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 ${positionClasses[position]}`}>
                    {content}
                    {/* Arrow */}
                    <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`}></div>
                </div>
            )}
        </div>
    );
};
