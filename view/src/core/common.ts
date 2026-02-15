import * as intf from '../../../intf/interface';
import * as elf from './elf';
// Declare the acquireVsCodeApi function.
declare function acquireVsCodeApi(): any;

export const vscode = acquireVsCodeApi();

export interface ElfState {
  program: string,
  size: number,
  interpreter: string,
  elfHeader: elf.ElfHeader,
  programHeaders: elf.ProgramHeader[],
  sectionHeaders: elf.SectionHeader[],
  selectedSectionIndex: number
}

export function setStatePartial(partial: Partial<ElfState>): void {
  const current = (vscode.getState() as ElfState) || { program: '', size: 0, interpreter: '', elfHeader: {} as elf.ElfHeader, programHeaders: [] as elf.ProgramHeader[], sectionHeaders: [] as elf.SectionHeader[], selectedSectionIndex: 0 };
  vscode.setState({ ...current, ...partial } as ElfState);
}

export function setSelectedSectionIndex(index: number): void {
  const current = (vscode.getState() as ElfState) || { program: '', size: 0, interpreter: '', elfHeader: {} as elf.ElfHeader, programHeaders: [] as elf.ProgramHeader[], sectionHeaders: [] as elf.SectionHeader[], selectedSectionIndex: 0 };
  vscode.setState({ ...current, selectedSectionIndex: index } as ElfState);
}

type MessageCallback = (message: any) => void;

export class ResposeHandler {
  private messageHandler: Map<string, MessageCallback>;

  constructor() {
    this.messageHandler = new Map();
  }

  public registerHandler(id: string, callback: MessageCallback) {
    if (this.messageHandler.has(id)) {
      console.warn(`Handler '${id}' is already registed.`);
      return;
    }

    console.log(`Registering call back for message ID, '${id}'`);
    this.messageHandler.set(id, callback);
  }

  public handleResponse(message: intf.Response) {
    const callback = this.messageHandler.get(message.id);
    if (callback) {
      callback(message.out);
    } else {
      console.error(`No message handler registered for, ${message.id}`);
    }
  }
}

// This function sends section header info for populating activity bar
export function sendSectionHeaderToWebview(data: elf.SectionHeader[]) {
  const headers = data.map(obj => obj.Name);
  const activity = {
    header: intf.HeaderType.SECT,
    data: headers
  } as intf.ActivityBar;

  const msg = {
    id: "sec-activity",
    type: intf.RequestType.ACTIVITY,
    data: activity
  } as intf.Request;

  vscode.postMessage(msg);
}

// This function sends section header info for populating activity bar
export function sendProgramHeaderToWebview(data: elf.ProgramHeader[]) {
  const headers = data.map(obj => obj.Type);
  const activity = {
    header: intf.HeaderType.PROG,
    data: headers
  } as intf.ActivityBar;

  const msg = {
    id: "sec-activity",
    type: intf.RequestType.ACTIVITY,
    data: activity
  } as intf.Request;

  vscode.postMessage(msg);
}

function wcResponseHandler(data: intf.Result) {
  if (data.exitCode) {
    console.log(`'wc -c <prog>', exit code is ${data.exitCode} (non-zero)`);
    return;
  }

  if (!data.stdout) {
    console.log(`'wc -c <prog>', stdout is empty.`);
    return;
  }

  const out = data.stdout;
  const matches = out.match(/^\s*([\d]+)\s+([\S]+)\s*$/);
  if (!matches) {
    console.log(`'wc' output is not proper.`);
    return;
  }

  const sizeMatch = matches[1];
  const size = parseInt(sizeMatch, 10);
  console.log(`Size of ${matches[2]} is ${matches[1]}`);
  // Update state with size information. 
  let state: ElfState = {} as ElfState;
  state.size = size;
  setStatePartial(state);
  console.log('ElfState in wcResponseHandler:', vscode.getState());
}

export function getFileSize(program: string, handler: ResposeHandler) {
  // Sends 'wc -c <file>' command to get the filesSize 
  console.log('getFileSize called.');
  handler.registerHandler("wc", (d) => wcResponseHandler(d));
  vscode.postMessage({
    id: "wc",
    type: intf.RequestType.EXECUTE,
    data: {
      prog: "wc",
      args: ["-c", `${program}`],
    }
  });
}
