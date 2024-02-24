import { Conversation, Message } from '@/types/chat';
import { ErrorMessage } from '@/types/error';
import { FolderInterface } from '@/types/folder';
import { ToolLLaMAModel, ToolLLaMAMethodID } from '@/types/toolllama';
import { PluginKey } from '@/types/plugin';
import { Prompt } from '@/types/prompt';


export interface HomeInitialState {
  apiKey: string;
  pluginKeys: PluginKey[];
  loading: boolean;
  lightMode: 'light' | 'dark';
  messageIsStreaming: boolean;
  modelError: ErrorMessage | null;
  // models: OpenAIModel[];
  methods: ToolLLaMAModel[];
  folders: FolderInterface[];
  conversations: Conversation[];
  selectedConversation: Conversation | undefined;
  currentMessage: Message | undefined;
  top_k: number;
  showChatbar: boolean;
  showPromptbar: boolean;
  currentFolder: FolderInterface | undefined;
  messageError: boolean;
  searchTerm: string;
  // defaultModelId: OpenAIModelID | undefined;
  defaultMethodId: ToolLLaMAMethodID | undefined;
  serverSideApiKeyIsSet: boolean;
  // serverSidePluginKeysSet: boolean;
}

export interface Settings {
  name: string;
  schemaElements:SchemaElement[];
  description: string;
}

export interface SchemaElement {
  id: string;
  name: string;
  data_type: string;
  description: string;
  example: string;
}

export const initialState: HomeInitialState = {
  apiKey: '',
  loading: false,
  pluginKeys: [],
  lightMode: 'dark',
  messageIsStreaming: false,
  modelError: null,
  // models: [],
  methods: [ { id: 'TOPGUN', name: 'TOPGUN',method:"", maxLength:16000 }, { id: 'REMAP', name: 'REMAP',method:"", maxLength:16000 }],
  folders: [],
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  top_k: 4,
  showPromptbar: true,
  showChatbar: true,
  currentFolder: undefined,
  messageError: false,
  searchTerm: '',
  // defaultModelId: undefined,
  defaultMethodId: undefined,
  serverSideApiKeyIsSet: true,
  // serverSidePluginKeysSet: false,
};
