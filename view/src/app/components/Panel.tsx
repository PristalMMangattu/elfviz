import React, { useContext } from "react";
import * as ctx from '../context';
import { Header } from './Header';
import { FileStructure } from './FileView';
import { SectionView } from './SectionView';

export function PanelRoot() {
  return (
    <ctx.ElfStateProvider>
      <Header />
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        <FileStructure />
        <SectionView />
      </div>
    </ctx.ElfStateProvider>
  );
}
