import {
  IconCheck,
  IconCircleMinus,
  IconCirclePlus,
  IconClearAll,
  IconMessageCircle2,
  IconSettings,
} from '@tabler/icons-react';
import { IconTools, IconGavel } from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast, { Toaster } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';

import home from '@/pages/api/home';
import { BACKEND_URL } from '@/pages/api/home/home';
import HomeContext from '@/pages/api/home/home.context';
import { SchemaElement, Settings } from '@/pages/api/home/home.state';

import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from './SystemPrompt';
import { TopKSlider } from './TopK';

import { unstable_useId } from '@mui/material';
import { json } from 'stream/consumers';
import { v4 as uuid } from 'uuid';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      conversations,
      methods,
      apiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
      messageIsStreaming,
      modelError,
      loading,
    },
    handleUpdateMessages,
    handleUpdateSettings,
    messages,
    method,
    setToolGetter,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);
  const [showChatComponent, setShowChatComponent] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(
    null,
  );

  const handleSend = useCallback(
    async (message: Message, deleteCount = 0, plugin: Plugin | null = null) => {
      console.log('sending', message);
      if (selectedConversation) {
        let updatedConversation: Conversation;
        if (deleteCount) {
          const updatedMessages = [...selectedConversation.messages];
          for (let i = 0; i < deleteCount; i++) {
            updatedMessages.pop();
          }
          updatedConversation = {
            ...selectedConversation,
            messages: [...updatedMessages, message],
          };
        } else {
          updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          };
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
        homeDispatch({ field: 'loading', value: true });
        homeDispatch({ field: 'messageIsStreaming', value: true });
        console.log('Set messageIsStreaming to true');

        const chatBody: ChatBody = {
          method: updatedConversation.method,
          messages: updatedConversation.messages,
          top_k: updatedConversation.top_k,
        };
        console.log('updatedConversation', updatedConversation);

        handleUpdateMessages((k) => [...k, message]);

        const endpoint = 'api/chat';
        console.log("method", method)
        const queryBody = {
          query: message.content,
          planner: method.name.toLowerCase(),
        };
        let bodyq;
        bodyq = JSON.stringify(queryBody);
        const controller = new AbortController();
        const response = await fetch(BACKEND_URL + 'stream_response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: bodyq,
        }).catch((err) => {
          return { ok: false, statusText: err.message };
        });

        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          toast.error(response.statusText);

          return;
        }
        //@ts-ignore
        const data = response.body;
        const reader = data!.getReader();
        let concstr = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          concstr += new TextDecoder().decode(value);
          setStreamingMessage({ role: 'assistant', content: concstr });
        }
        console.log(concstr);

        homeDispatch({ field: 'loading', value: false });
        homeDispatch({ field: 'messageIsStreaming', value: false });
        const msg: Message = {
          role: 'assistant',
          content: concstr,
        };
        handleUpdateMessages((k) => [...k, msg]);
        setStreamingMessage(null);
      }
    },
    [
      apiKey,
      conversations,
      pluginKeys,
      selectedConversation,
      stopConversationRef,
      method
    ],
  );

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateMessages([]);
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);

  // useEffect(() => {
  //   console.log('currentMessage', currentMessage);
  //   if (currentMessage) {
  //     handleSend(currentMessage);
  //     homeDispatch({ field: 'currentMessage', value: undefined });
  //   }
  // }, [currentMessage]);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  function displayDefaultScreen(selectedConversation: Conversation) {
    const { conversations } = useContext(HomeContext).state;
    return (
      <>
        <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[600px]">
          <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
            SwissNYF UI
          </div>
          <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
            <ModelSelect />
          </div>
          <Buttons />
        </div>
      </>
    );
  }
  function Buttons() {
    const [loading, setLoading] = useState(false);
    return (
      <div className="flex justify-center text-2xl font-medium text-gray-800 dark:text-gray-100">
        <button
          className="flex justify-center w-[190px] flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-white/20 p-3 m-1 text-white transition-colors duration-200 hover:bg-gray-500/10"
          onClick={() => {
            console.log(selectedConversation)
            if (selectedConversation?.settings) {
              setShowChatComponent(false);
            } else {
              toast.error('Select a tool');
            }
          }}
          disabled={loading}
        >
          <IconTools size={24} />
          Edit Tool
        </button>
        <button
          className="flex justify-center w-[190px] flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-white/20 p-3 m-1 text-white transition-colors duration-200 hover:bg-gray-500/10"
          onClick={() => {
            //all conversations filter settings
            const toolsSTR = JSON.stringify(
              conversations.map((c) => c.settings),
            );
            console.log(toolsSTR);
            setLoading(true);
            fetch(BACKEND_URL + 'build_tools', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: toolsSTR,
            })
              .then((res) => res.json())
              .then((res) => {
                toast.success('Build tools successfully');
                console.log(res);
                setToolGetter(l=>!l)
              })
              .catch((err) => {
                toast.error('Build tools failed');
                console.log(err);
              })
              .finally(() => setLoading(k=>!k));
          }}
          disabled={loading}
        >
          <IconGavel size={24} />
          {loading ? <Spinner /> : 'Build Tools'}
        </button>
      </div>
    );
  }
  // function createSchemaList() {
  //   var schemaJSXList = [];
  //   for (var iterator = 0; iterator < newToolData.schemaElements.length; iterator++) {
  //     schemaJSXList.push(
  //       <div className="w-[90%] flex flex-row mt-4 justify-between text-base">
  //         <div className="w-[45%]">
  //           <div>Schema Element No. {iterator + 1}</div>
  //           <input
  //             className="w-[100%] text-white-600 mt-4 outline-none px-2 bg-transparent border border-white rounded py-2"
  //             type="text"
  //           ></input>
  //         </div>
  //         <div className="w-[45%]">
  //           <div>Data Type </div>
  //           <select className="w-[100%] text-white-600 mt-4 outline-none px-2 bg-transparent border border-white rounded py-2">
  //             <option value="Integer">Integer</option>
  //             <option value="String">String</option>
  //             <option value="Decimal">Decimal</option>
  //             <option value="Boolean">Boolean</option>
  //           </select>
  //         </div>
  //       </div>,
  //     );
  //   }
  //   return schemaJSXList;
  // }

  return (
    <div className="relative flex-1 overflow-x-hidden overflow-y-scroll bg-white dark:bg-[#282830]">
      {showChatComponent === true ? (
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {messages.length === 0 ? (
              selectedConversation && displayDefaultScreen(selectedConversation)
            ) : (
              <>
                <div className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {/* {t('Method')}: {selectedConversation?.method.method} |{' '}
                  {t('Top K')}: {selectedConversation?.top_k} | */}
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={handleSettings}
                  >
                    <IconSettings size={18} />
                  </button>
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                  >
                    <IconClearAll size={18} />
                  </button>
                </div>
                {showSettings && (
                  <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                    <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                      <ModelSelect />
                      <Buttons />
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={index}
                    message={message}
                    messageIndex={index}
                    onEdit={(editedMessage) => {
                      setCurrentMessage(editedMessage);
                      // discard edited message and the ones that come after then resend
                      handleSend(editedMessage, messages.length - index);
                    }}
                  />
                ))}
                {streamingMessage && (
                  <MemoizedChatMessage
                    key={selectedConversation?.messages.length || 1}
                    message={streamingMessage}
                    messageIndex={selectedConversation?.messages.length || 1}
                    onEdit={() => {}}
                  />
                )}

                {/* {loading && <ChatLoader />} */}

                <div
                  className="h-[162px] bg-white dark:bg-[#343541]"
                  ref={messagesEndRef}
                />
              </>
            )}
          </div>

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(message, plugin) => {
              setCurrentMessage(message);
              handleSend(message, 0, plugin);
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={() => {
              if (currentMessage) {
                handleSend(currentMessage, 2, null);
              }
            }}
            showScrollDownButton={showScrollDownButton}
          />
        </>
      ) : (
        <ToolModify
          selectedConversation={selectedConversation}
          setShowChatComponent={setShowChatComponent}
          handleUpdateSettings={handleUpdateSettings}
        ></ToolModify>
      )}
    </div>
  );
});

function ToolModify({
  selectedConversation,
  setShowChatComponent,
  handleUpdateSettings,
}: {
  selectedConversation: Conversation | undefined;
  setShowChatComponent: Function;
  handleUpdateSettings: Function;
}) {
  const [settings, setSettings] = useState<Settings>(
    selectedConversation?.settings!,
  );
  if (!settings) {
    setShowChatComponent(true);
    return null;
  }
  return (
    <>
      <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[900px] overflow-y-auto">
        <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
          SwissNYF UI
        </div>

        <form
          className="flex flex-col text-xl"
          onSubmit={(e) => {
            e.preventDefault();
          }}
          //</div>onSubmit={handleSubmit}
        >
          <div className="flex justify-between pr-2">
            <div className="text-md pt-4">Name</div>
          </div>

          <input
            className="w-[90%] text-white-800 mt-2 outline-none px-2 bg-transparent border border-white rounded py-1"
            type="text"
            name="toolName"
            placeholder="name"
            value={settings.name}
            onChange={(e) => {
              setSettings({
                ...settings,
                name: e.target.value,
              });
            }}
          />

          <SchemaElements
            settingObj={settings}
            handleSettingObj={setSettings}
          />

          <div className="text-md pt-4">Description</div>
          <textarea
            className="w-[90%] text-white-800 mt-2 outline-none px-2 bg-transparent border border-white rounded py-1 resize-y"
            name="toolDescription"
            value={settings.description}
            placeholder="description"
            onChange={(e) => {
              setSettings({
                ...settings,
                description: e.target.value,
              });
            }}
          ></textarea>

          <div className="flex justify-center text-lg font-medium text-gray-800 dark:text-gray-100 gap-4 pt-2 mt-2">
            <button
              className="flex justify-center flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-white/20 px-3 py-1 text-white transition-colors duration-200 hover:bg-gray-500/10 text-lg"
              onClick={() => {
                handleUpdateSettings(selectedConversation, settings);
                setShowChatComponent(true);
                toast.success('Changes saved');
              }}
            >
              <IconCheck size={16} />
              Save Changes
            </button>
            <button
              className="flex justify-center flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-white/20 px-3 py-1 text-white transition-colors duration-200 hover:bg-gray-500/10 text-lg"
              onClick={() => {
                setShowChatComponent(true);
                if (settings !== selectedConversation?.settings) {
                  toast.error('Changes discarded');
                }
              }}
            >
              <IconMessageCircle2 size={16} />
              Return to Chat
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

Chat.displayName = 'Chat';

const SchemaElements = ({
  settingObj,
  handleSettingObj,
}: {
  settingObj: Settings;
  handleSettingObj: Function;
}) => {
  const addSchemaElement = () => {
    const newElement: SchemaElement = {
      id: Date.now().toString(),
      name: '',
      data_type: 'Integer',
      description: '',
      example: '',
    };
    handleSettingObj({
      ...settingObj,
      schemaElements: [...settingObj.schemaElements, newElement],
    });
  };

  const deleteSchemaElement = (id: string) => {
    if (settingObj.schemaElements.length === 1) {
      toast.error('At least one schema element is required in a tool.');
      return;
    }

    handleSettingObj({
      ...settingObj,
      schemaElements: settingObj.schemaElements.filter(
        (element) => element.id !== id,
      ),
    });
  };

  const handleSchemaElemChange = (id: string, prop: string, value: string) => {
    const updatedElements = settingObj.schemaElements.map((element) =>
      element.id === id ? { ...element, [prop]: value } : element,
    );
    handleSettingObj({ ...settingObj, schemaElements: updatedElements });
  };

  return (
    <>
      <div className="w-[90%]">
        <div className="flex justify-between pr-2">
          <div className="text-md pt-4">Schema Elements</div>
          <div onClick={addSchemaElement} className="pt-4 cursor-pointer">
            <IconCirclePlus />
          </div>
        </div>
      </div>

      {settingObj.schemaElements.map((element, index) => (
        <div
          key={element.id}
          className="w-[90%] flex flex-row mt-3 justify-between text-base border border-white rounded-lg py-1"
        >
          <div className="w-[30%] px-2">
            <div className="text-sm">Element {index + 1}</div>
            <input
              className="w-[100%] text-white-600 outline-none bg-transparent border border-white rounded px-2 py-1 my-1 border-opacity-50"
              type="text"
              placeholder="name"
              value={element.name}
              onChange={(e) =>
                handleSchemaElemChange(element.id, 'name', e.target.value)
              }
            />
          </div>
          <div className="w-[30%] px-2">
            <div className="text-sm">Data Type</div>
            <select
              className="w-[100%] text-white-600 outline-none bg-transparent border border-white rounded px-2 py-[5px] my-1 border-opacity-50"
              value={element.data_type}
              onChange={(e) =>
                handleSchemaElemChange(element.id, 'data_type', e.target.value)
              }
            >
              <option value="Integer" className="bg-[#343541]">
                Integer
              </option>
              <option value="String" className="bg-[#343541]">
                String
              </option>
              <option value="Decimal" className="bg-[#343541]">
                Decimal
              </option>
              <option value="Boolean" className="bg-[#343541]">
                Boolean
              </option>
              <option value="Integer List" className="bg-[#343541]">
                Integer List
              </option>
              <option value="String List" className="bg-[#343541]">
                String List
              </option>
              <option value="Decimal List" className="bg-[#343541]">
                Decimal List
              </option>
              <option value="Boolean List" className="bg-[#343541]">
                Boolean List
              </option>
            </select>
          </div>
          <div className="w-[30%] px-2">
            <div className="text-sm">Description</div>
            <input
              className="w-[100%] text-white-600 outline-none bg-transparent border border-white rounded px-2 py-1 my-1 border-opacity-50"
              type="text"
              value={element.description}
              placeholder="description"
              onChange={(e) =>
                handleSchemaElemChange(
                  element.id,
                  'description',
                  e.target.value,
                )
              }
            />
          </div>
          <div className="w-[30%] px-2">
            <div className="text-sm">Example</div>
            <input
              className="w-[100%] text-white-600 outline-none bg-transparent border border-white rounded px-2 py-1 my-1 border-opacity-50"
              type="text"
              placeholder="example"
              value={element.example}
              onChange={(e) =>
                handleSchemaElemChange(element.id, 'example', e.target.value)
              }
            />
          </div>
          <div
            className="w-[10%] flex justify-center items-center cursor-pointer"
            onClick={() => deleteSchemaElement(element.id)}
          >
            <IconCircleMinus />
          </div>
        </div>
      ))}
    </>
  );
};
