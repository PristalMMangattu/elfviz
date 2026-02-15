import React, { useContext, useState, useEffect } from "react";
import { ElfStateContext } from '../context';
import * as def from '../../core/define';

interface FileArea {
  name: string;
  addr: number;
  size: number;
}

const fillVoidsInElf = (info: FileArea[]): FileArea[] => {
  let completeInfo: FileArea[] = [];
  let prevBoundary = 0;
  let prevStart = 0;
  let voidSize = 0;
  
  for (const area of info) {
    if (prevStart && area.addr > prevBoundary) {
      voidSize = area.addr - prevBoundary;
      completeInfo.push({
        name: `VOID`,
        addr: prevBoundary,
        size: voidSize
      });
    }
    completeInfo.push(area);
    prevStart = area.addr;
    prevBoundary = area.addr + area.size;
  }
  
  return completeInfo;
};

const getFileAreas = (elfState: any): FileArea[] => {
  let info: FileArea[] = [];

  if (!elfState || !elfState.elfHeader) {
    return info;
  }

  // Elf Header
  const elfHeaderFileArea: FileArea = {
    name: "Elf Header",
    addr: 0,
    size: elfState.elfHeader.SizeEH
  };
  info.push(elfHeaderFileArea);

  // Section Header Table
  const sectionHeaderFileArea: FileArea = {
    name: "Section Header Table",
    addr: elfState.elfHeader.StartOfSH,
    size: elfState.elfHeader.SizeSH * elfState.elfHeader.NumOfSH
  };
  info.push(sectionHeaderFileArea);

  // Sections
  if (elfState.sectionHeaders && elfState.sectionHeaders.length > 0) {
    for (const sect of elfState.sectionHeaders) {
      if (!sect.Offset || !sect.Size) {
        continue;
      }

      const sectArea: FileArea = {
        name: sect.Name,
        addr: sect.Offset,
        size: sect.Size
      };
      info.push(sectArea);
    }
  }

  // Program Header Table
  const programHeaderFileArea: FileArea = {
    name: "Program Header Table",
    addr: elfState.elfHeader.StartOfPH,
    size: elfState.elfHeader.SizePH * elfState.elfHeader.NumOfPH
  };
  info.push(programHeaderFileArea);

  // Sort by address
  info.sort((first, second) => first.addr - second.addr);

  return fillVoidsInElf(info);
};

const getColorForArea = (index: number, name: string): string => {
  const safeName = name ?? '';
  if (safeName.includes('VOID')) {
    return def.VOID_COLOR;
  } else if (safeName.includes('OVERLAP')) {
    return def.OVERLAP_COLOR;
  }
  return def.PASTEL_COLORS[index % def.PASTEL_COLORS.length];
};

const StackedBoxes = () => {
  const elfState = useContext(ElfStateContext);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const [clickedBox, setClickedBox] = useState<number | null>(null);
  const fileAreas = getFileAreas(elfState);
  const totalBoxes = fileAreas.length;

  const handleClick = (boxIndex: number) => {
    setClickedBox(boxIndex);
    console.log(`Box ${boxIndex} clicked: ${fileAreas[boxIndex].name}`);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: viewportHeight,
        margin: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#333',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          flexShrink: 0,
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        File Overview ({totalBoxes} sections)
        {clickedBox !== null && ` | Selected: ${fileAreas[clickedBox]?.name}`}
      </div>

      {/* Scrollable container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {fileAreas.map((area, index) => {
          const isVoid = (area.name ?? '').includes('VOID');
          const isSelected = clickedBox === index;
          const backgroundColor = getColorForArea(index, area.name ?? '');

          return (
            <div
              key={`${area.name ?? 'unknown'}-${area.addr ?? 0}`}
              onClick={() => handleClick(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor,
                border: isSelected ? '3px solid #000' : '2px solid #555',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                userSelect: 'none',
                opacity: isVoid ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {/* Address column */}
              <div
                style={{
                  minWidth: '80px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: 'right',
                  marginRight: '12px',
                }}
              >
                {`0x${(area.addr ?? 0).toString(16).toUpperCase().padStart(8, '0')}`}
              </div>

              {/* Info column */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '4px',
                  }}
                >
                  {area.name ?? 'Unknown Section'}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#555',
                  }}
                >
                  Size: {area.size ?? 0} bytes (0x{(area.size ?? 0).toString(16).toUpperCase().padStart(8, '0')})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function FileStructure() {
  const state = useContext(ElfStateContext);
  if (!state || !state.program)
    return (
      <h1> Program : Loading </h1>
    )

  return (
    <>
      <h1>
        Program : {state.program}
      </h1>
      <StackedBoxes />
    </>

  )
}
