import React, { useContext, useState, useEffect } from "react";
import { ElfStateContext, ElfActionContext } from '../context';
import * as def from '../../core/define';
import * as common from '../../core/common';

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
  const { updateSelectedSectionIndex } = useContext(ElfActionContext);
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
    // Find the section header index for this file area
    const area = fileAreas[boxIndex];
    if (elfState?.sectionHeaders) {
      const sectionIndex = elfState.sectionHeaders.findIndex(s => s.Name === area.name);
      if (sectionIndex >= 0) {
        updateSelectedSectionIndex(sectionIndex);
      }
    }
    console.log(`Box ${boxIndex} clicked: ${fileAreas[boxIndex].name}`);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: viewportHeight - 140, // Subtract header and title space
        margin: '10px',
        flex: 1,
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
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!state || !state.program)
    return (
      <h1> Program : Loading </h1>
    )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: viewportWidth / 4,
        height: viewportHeight - 80, // Account for header height
      }}
    >
      <h1 style={{ margin: '10px 20px', fontSize: '18px' }}>
        Program : {state.program}
      </h1>
      <StackedBoxes />
    </div>
  )
}
