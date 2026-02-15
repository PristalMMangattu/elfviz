import * as intf from '../../../intf/interface';
import * as elf from './elf';
import * as common from './common';
//import "vscode-webview"

// Declare the acquireVsCodeApi function.
declare function acquireVsCodeApi(): any;

const vscode = acquireVsCodeApi();
const responseHandler = new common.ResposeHandler();
let gElf: elf.Elf;

function initialView(): void {
  const overviewBtn = document.getElementById('Overview') as HTMLButtonElement;
  overviewBtn.click();
}

export function initialize() {
  // Send init message.
  responseHandler.registerHandler("init", (data: string) => {
    try {
      console.log(`Program : ${data}`);
      let state: common.ElfState = {} as common.ElfState;
      state.program = data;
      common.setStatePartial(state);
      const currentState = vscode.getState();
      console.log('State in initialize:', currentState);
      elf.getElf(vscode, data, responseHandler);
      common.getFileSize(data, responseHandler);
    } catch (error) {
      console.error('Error in init handler:', error);
      console.error('Stack:', (error as Error).stack);
    }
  });

  const msg = {
    id: "init",
    type: intf.RequestType.INIT,
    data: ""
  } as intf.Request;

  vscode.postMessage(msg);
}



// Add event listener for received messages
const messageEventListener = (event: MessageEvent) => {
  const message = event.data as intf.Response;
  responseHandler.handleResponse(message);
};

window.addEventListener('message', messageEventListener);


