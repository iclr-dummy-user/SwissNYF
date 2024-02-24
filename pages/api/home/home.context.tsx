import { Dispatch, MutableRefObject, SetStateAction, createContext } from 'react';



import { ActionType } from '@/hooks/useCreateReducer';



import { Conversation, Message } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderType } from '@/types/folder';
import { ToolLLaMAModel } from '@/types/toolllama';



import { HomeInitialState, Settings } from './home.state';


export interface HomeContextProps {
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;
  handleNewConversation: () => void;
  addNewConservation: (name: string, settings: Settings | undefined) => void;
  handleCreateFolder: (name: string, type: FolderType) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleUpdateFolder: (folderId: string, name: string) => void;
  handleSelectConversation: (conversation: Conversation) => void;
  handleUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  handleUpdateSettings: (
    conversation: Conversation,
    settings: Settings,
  ) => void;
  handleUpdateMessages: Dispatch<SetStateAction<Message[]>>;
  messages: Message[];
  method: ToolLLaMAModel;
  setMethod: Dispatch<SetStateAction<ToolLLaMAModel>>;
  setToolGetter: Dispatch<SetStateAction<boolean>>;
}

const HomeContext = createContext<HomeContextProps>(undefined!);

export default HomeContext;