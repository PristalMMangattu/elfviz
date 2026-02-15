import React, { createContext, useEffect, useState } from "react";
import * as intf from '../../../intf/interface';
import * as elf from '../core/elf';
import * as common from '../core/common'

const responseHandler = new common.ResposeHandler();

// Create the context with default null data
export const ElfStateContext = createContext<common.ElfState>({
  program: '', size: 0, interpreter: '', elfHeader: {} as elf.ElfHeader, programHeaders: [] as elf.ProgramHeader[], sectionHeaders: [] as elf.SectionHeader[], selectedSectionIndex: 0
});

// Create action context for state updates
export const ElfActionContext = createContext<{
  updateSelectedSectionIndex: (index: number) => void;
}>({
  updateSelectedSectionIndex: () => {},
});


interface DataProviderProps {

  children: React.ReactNode;
}

export const ElfStateProvider = ({ children }: DataProviderProps) => {
  const [state, setElfState] = useState<common.ElfState>({
    program: '', size: 0, interpreter: '', elfHeader: {} as elf.ElfHeader, programHeaders: [] as elf.ProgramHeader[], sectionHeaders: [] as elf.SectionHeader[], selectedSectionIndex: 0
  });

  const updateSelectedSectionIndex = (index: number) => {
    setElfState((prevState) => ({
      ...prevState,
      selectedSectionIndex: index
    }));
  };

  useEffect(() => {
    // Add event listener for received messages
    const messageEventListener = (event: MessageEvent) => {
      const message = event.data as intf.Response;
      responseHandler.handleResponse(message);
    };

    window.addEventListener('message', messageEventListener);


    // Send init message.
    responseHandler.registerHandler("init", (data: string) => {
      try {
        console.log(`Program : ${data}`);
        let state: common.ElfState = {} as common.ElfState;
        state.program = data;
        common.setStatePartial(state);
        const currentState = common.vscode.getState();

         // Update state correctly using the previous state as a base
        setElfState(prevState => ({
          ...prevState,       // Keep existing headers/size/etc.
          program: data       // Update only the program name
        }));
        console.log('ElfState in initialize:', currentState);


        elf.getElf(setElfState, data, responseHandler);
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

    common.vscode.postMessage(msg);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("message", messageEventListener);
    };
  }, []);

  return (
    <ElfStateContext.Provider value={state}>
      <ElfActionContext.Provider value={{ updateSelectedSectionIndex }}>
        {children}
      </ElfActionContext.Provider>
    </ElfStateContext.Provider>
  );
};


