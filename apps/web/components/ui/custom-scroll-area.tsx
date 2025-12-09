import React from 'react';

interface CustomScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CustomScrollArea({ children, className = '', style }: CustomScrollAreaProps) {
  return (
    <>
      <style jsx>{`
        .custom-scroll-area {
          overflow-y: auto;
          overflow-x: hidden;
        }

        .custom-scroll-area::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scroll-area::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 4px;
        }

        .custom-scroll-area::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }

        .custom-scroll-area::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }

        /* Firefox */
        .custom-scroll-area {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
      `}</style>
      <div className={`custom-scroll-area ${className}`} style={style}>
        {/* Wrapper com padding para não cortar sombras dos cards internos */}
        <div className="px-1 -mx-1">
          {children}
        </div>
      </div>
    </>
  );
}












