import React, { useContext, useState, useEffect } from "react";
import { ElfStateContext } from '../context';
import manpage from '../../manpage.json';

interface SectionAttribute {
  name: string;
  value: string | number;
  description: string;
}

const getSectionAttributes = (selectedIndex: number, elfState: any): SectionAttribute[] => {
  if (!elfState?.sectionHeaders || selectedIndex < 0 || selectedIndex >= elfState.sectionHeaders.length) {
    return [];
  }

  const section = elfState.sectionHeaders[selectedIndex];
  const manpageFields = (manpage as any).section_header.fields;

  const attributes: SectionAttribute[] = [
    {
      name: 'Name',
      value: section.Name ?? 'N/A',
      description: manpageFields.sh_name || 'Section name'
    },
    {
      name: 'Type',
      value: section.Type ?? 'N/A',
      description: manpageFields.sh_type?.description || 'Section type categorization'
    },
    {
      name: 'Flags',
      value: (section.Flags ?? []).join(', ') || 'None',
      description: manpageFields.sh_flags?.description || 'Section flags'
    },
    {
      name: 'Address',
      value: `0x${(section.Address ?? 0).toString(16).toUpperCase().padStart(8, '0')}`,
      description: manpageFields.sh_addr || 'Section virtual address'
    },
    {
      name: 'Offset',
      value: `0x${(section.Offset ?? 0).toString(16).toUpperCase().padStart(8, '0')}`,
      description: manpageFields.sh_offset || 'Section file offset'
    },
    {
      name: 'Size',
      value: `${section.Size ?? 0} bytes`,
      description: manpageFields.sh_size || 'Section size'
    },
    {
      name: 'Entry Size',
      value: `${section.EntSize ?? 0} bytes`,
      description: manpageFields.sh_entsize || 'Entry size if section holds table'
    },
    {
      name: 'Link',
      value: section.Link ?? 'N/A',
      description: manpageFields.sh_link || 'Link to another section'
    },
    {
      name: 'Info',
      value: section.Info ?? 'N/A',
      description: manpageFields.sh_info || 'Extra information'
    },
    {
      name: 'Align',
      value: `${section.Align ?? 0} bytes`,
      description: manpageFields.sh_addralign || 'Address alignment'
    }
  ];

  return attributes;
};

const getDetailedDescription = (selectedAttr: SectionAttribute, elfState: any): string => {
  const manpageFields = (manpage as any).section_header.fields;

  switch (selectedAttr.name) {
    case 'Type':
      if (manpageFields.sh_type && manpageFields.sh_type[selectedAttr.value as string]) {
        return manpageFields.sh_type[selectedAttr.value as string];
      }
      break;
    case 'Flags':
      return "Section flags indicate attributes: W=Writable, A=Allocatable, X=Executable, M=Processor-specific";
  }

  return selectedAttr.description;
};

const getSpecialSectionDescription = (sectionName: string): string | null => {
  const specialSections = (manpage as any).section_header.special_sections;
  if (specialSections && specialSections[sectionName]) {
    return specialSections[sectionName];
  }
  return null;
};

export function SectionView() {
  const elfState = useContext(ElfStateContext);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [selectedAttr, setSelectedAttr] = useState<SectionAttribute | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // If no section is selected from FileView, show help text
  if (!elfState?.sectionHeaders || elfState.sectionHeaders.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          height: viewportHeight - 80,
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderLeft: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#666', fontSize: '14px' }}>Select a section from the File Overview to view details</p>
      </div>
    );
  }

  // Get attributes for selected section from context
  const selectedIndex = elfState.selectedSectionIndex ?? 0;
  const attributes = getSectionAttributes(selectedIndex, elfState);
  const section = elfState.sectionHeaders[selectedIndex];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9f9f9',
        borderLeft: '1px solid #ddd',
        padding: '10px',
        height: viewportHeight - 80,
      }}
    >
      {/* Section selector header */}
      <div
        style={{
          backgroundColor: '#333',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        Section Details: {section.Name || 'Unknown'}
      </div>

      {/* Horizontal attributes cells */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#fff',
          borderRadius: '4px',
          border: '1px solid #ddd',
          overflowY: 'auto',
          maxHeight: '200px',
        }}
      >
        {attributes.map((attr, index) => (
          <div
            key={`${attr.name}-${index}`}
            onClick={() => setSelectedAttr(attr)}
            style={{
              padding: '10px 15px',
              backgroundColor: selectedAttr?.name === attr.name ? '#007bff' : '#e9ecef',
              color: selectedAttr?.name === attr.name ? 'white' : '#333',
              borderRadius: '4px',
              cursor: 'pointer',
              border: '1px solid #dee2e6',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              if (selectedAttr?.name !== attr.name) {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#d9e1eb';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedAttr?.name !== attr.name) {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#e9ecef';
              }
            }}
          >
            <div>{attr.name}</div>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              {typeof attr.value === 'string' && attr.value.length > 20
                ? `${attr.value.substring(0, 20)}...`
                : attr.value}
            </div>
          </div>
        ))}
      </div>

      {/* Description area */}
      <div
        style={{
          flex: 1,
          padding: '15px',
          backgroundColor: '#fff',
          borderRadius: '4px',
          border: '1px solid #ddd',
          overflowY: 'auto',
        }}
      >
        {/* Always show special section description if it exists */}
        {(() => {
          const specialDesc = getSpecialSectionDescription(section.Name);
          if (specialDesc) {
            return (
              <div
                style={{
                  backgroundColor: '#e8f4f8',
                  padding: '15px',
                  borderRadius: '4px',
                  border: '1px solid #b3dfe5',
                  marginBottom: '15px',
                  borderLeft: '4px solid #2196F3',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1565c0',
                    marginBottom: '8px',
                  }}
                >
                  Section Description
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#555',
                    lineHeight: '1.5',
                  }}
                >
                  {specialDesc}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {selectedAttr ? (
          <>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '10px',
                color: '#333',
              }}
            >
              {selectedAttr.name}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#555',
                lineHeight: '1.6',
                marginBottom: '15px',
              }}
            >
              {getDetailedDescription(selectedAttr, elfState)}
            </div>
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#333',
                wordBreak: 'break-all',
              }}
            >
              <strong>Value:</strong> {selectedAttr.value}
            </div>
          </>
        ) : (
          <div
            style={{
              color: '#999',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            Click on an attribute cell to view details
          </div>
        )}
      </div>
    </div>
  );
}
