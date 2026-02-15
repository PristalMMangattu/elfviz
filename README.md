# elfviz

![ELFViz Icon](media/icon2.png)

A VS Code extension that provides an intuitive visualization of ELF (Executable and Linkable Format) binary files. Explore the structure, layout, and detailed attributes of ELF binaries directly within VS Code.

## Features

- **File Structure Visualization** - View the complete layout of an ELF binary with:
  - ELF header location and size
  - Program header table visualization
  - All sections with color-coded identification
  - Void area detection (gaps between sections)
  - Hexadecimal address display
  - Size information for each component

- **Section Details Panel** - Inspect individual ELF sections with:
  - All section header attributes (Name, Type, Flags, Address, Offset, Size, Entry Size, Link, Info, Align)
  - Interactive attribute cells with detailed descriptions
  - Special section documentation from the ELF specification
  - Inline ELF standard reference information

- **ELF Specification Reference** - Built-in documentation including:
  - Section type definitions and uses
  - Flag meanings and implications
  - Special sections (.text, .data, .bss, .dynamic, etc.) with standard descriptions
  - Comprehensive ELF header and program header documentation

- **Interactive Navigation** - Click on file structure components to view their detailed attributes



## Usage

1. Open an ELF binary file in VS Code
2. The extension will parse and display the binary structure
3. Click on any section or component in the file overview to view its detailed attributes
4. Select attributes to read their descriptions and values

## Extension Settings

This extension contributes the following settings:

* `elfviz.enable`: Enable/disable ELF file visualization
* `elfviz.showAddresses`: Display hexadecimal addresses in the file overview (default: true)
* `elfviz.colorScheme`: Color scheme for visualization (pastel colors)



## Release Notes

### 0.0.5

Initial release of ELFViz with core features:
- ELF binary file structure visualization with color-coded sections
- Interactive section detail viewer with ELF specification reference
- Void area detection and display
- Hexadecimal address and size information
- Built-in ELF standard documentation for all section types and attributes



**Enjoy!**
