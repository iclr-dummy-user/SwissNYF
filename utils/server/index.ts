import {Message} from '@/types/chat';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

const url = "https://swiss-back.azurewebsites.net/stream_response";

export const ToolLLaMaStream = async (
  messages: Message[],
  top_k: number,
  method: string,
) => {
  // streamed response
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      text: messages[messages.length-1].content,
      // top_k: top_k,
      method: method,
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  //@ts-ignore
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  const convertToReadableStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
        }
      },
    });

    return stream;
  };

  return await convertToReadableStream(reader);
};
