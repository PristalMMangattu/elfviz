import React, { useContext } from "react";
import * as ctx from '../context';
import { Header } from './Header';
import { FileStructure } from './FileView'

export function PanelRoot() {
  return (
    <ctx.ElfStateProvider>
      <Header />
      <FileStructure />
    </ctx.ElfStateProvider>
  );
}
