
import { Settings } from '@/pages/api/home/home.state';
import { ToolLLaMAModel } from './toolllama';

export interface BaseUsage {
    block_id: string;
    occurence : number;
    type: "tool" | "llm" | "recommendation" | "root";
    ongoing: boolean;
    depth: number;
    children: BaseUsage[];
    parent: BaseUsage | null;
}

export interface IntermediateMessage {
    role: Role;
    content: string;
}
export interface LLMUsage extends BaseUsage {
    type: "llm";
    block_id: string;
    occurence : number;
    messages: IntermediateMessage[];
    response: string;
}


export interface ToolUsage extends BaseUsage {
    type: "tool";
    block_id: string;
    occurence : number;
    action: string;
    status: number;
    tool_name: string;
    tool_description: string;
    tool_input: string;
    output: string;
}

export interface ToolParameters {
  options: any;
  prompt: any;
  required: any;
  type: any;
}
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameters;
}
export interface ToolRecommendation extends BaseUsage {
  type: "recommendation";
  occurence : number;
  block_id: string;
  recommendations: Tool[];
}

export interface Message {
  role: Role;
  content: string;
  tools?: ToolUsage[] | LLMUsage[];
  recommendations?: ToolRecommendation[];
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  method: ToolLLaMAModel;
  messages: Message[];
  top_k: number;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  method: ToolLLaMAModel;
  top_k: number;
  folderId: string | null;
  settings: Settings;
}

