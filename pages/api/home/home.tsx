import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import useErrorService from '@/services/errorService';
import useApiService from '@/services/useApiService';

import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import { DEFAULT_TOP_K } from '@/utils/app/const';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { savePrompts } from '@/utils/app/prompts';
import { getSettings } from '@/utils/app/settings';

import { Conversation, Message } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderInterface, FolderType } from '@/types/folder';
import { Prompt } from '@/types/prompt';
import {
  ToolLLaMAMethodID,
  ToolLLaMAMethods,
  ToolLLaMAModel,
  fallbackMethodID,
} from '@/types/toolllama';

import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Navbar } from '@/components/Mobile/Navbar';

// import Promptbar from '@/components/Promptbar';
import HomeContext from './home.context';
import { HomeInitialState, Settings, initialState } from './home.state';

import { v4 as uuidv4 } from 'uuid';

export const BACKEND_URL = 'https://swiss-back.azurewebsites.net/';

interface Props {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  defaultMethodId: ToolLLaMAMethodID;
}

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultMethodId,
}: Props) => {
  const { t } = useTranslation('chat');
  const { getModels } = useApiService();
  const { getModelsError } = useErrorService();
  const [initialRender, setInitialRender] = useState<boolean>(true);

  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  });

  const {
    state: {
      apiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      top_k,
      methods,
    },
    dispatch,
  } = contextValue;

  const stopConversationRef = useRef<boolean>(false);

  const { data, error, refetch } = useQuery(
    ['GetModels', apiKey, serverSideApiKeyIsSet],
    ({ signal }) => {
      if (!apiKey && !serverSideApiKeyIsSet) return null;

      return getModels(
        {
          key: apiKey,
        },
        signal,
      );
    },
    { enabled: true, refetchOnMount: false },
  );

  useEffect(() => {
    if (data) dispatch({ field: 'methods', value: data });
  }, [data, dispatch]);

  useEffect(() => {
    dispatch({ field: 'modelError', value: getModelsError(error) });
  }, [dispatch, error, getModelsError]);

  // FETCH MODELS ----------------------------------------------

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    });

    saveConversation(conversation);
  };

  // FOLDER OPERATIONS  --------------------------------------------

  const handleCreateFolder = (name: string, type: FolderType) => {
    const newFolder: FolderInterface = {
      id: uuidv4(),
      name,
      type,
    };

    const updatedFolders = [...folders, newFolder];

    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);
  };

  const handleDeleteFolder = (folderId: string) => {
    const prompts: Prompt[] = [];
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null,
        };
      }

      return c;
    });

    dispatch({ field: 'conversations', value: updatedConversations });
    saveConversations(updatedConversations);

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null,
        };
      }

      return p;
    });

    // dispatch({ field: 'prompts', value: updatedPrompts });
    savePrompts(updatedPrompts);
  };

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        };
      }

      return f;
    });

    dispatch({ field: 'folders', value: updatedFolders });

    saveFolders(updatedFolders);
  };

  // CONVERSATION OPERATIONS  --------------------------------------------

  const getDefaultSettings = function (): Settings {
    return {
      name: 'New tool',
      schemaElements: [],
      description: 'desc of tool',
    };
  };

  function getNewConversation(settings?: Settings): Conversation {
    return {
      id: uuidv4(),
      name: settings?.name || 'New Tool',
      messages: [],
      method: {
        name: ToolLLaMAMethods[defaultMethodId].name,
        id: ToolLLaMAMethods[defaultMethodId].id,
        method: ToolLLaMAMethods[defaultMethodId].method,
        maxLength: ToolLLaMAMethods[defaultMethodId].maxLength,
      },
      top_k: DEFAULT_TOP_K,
      folderId: null,
      settings: settings || getDefaultSettings(),
    };
  }

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];

    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Tool'),
      messages: [],
      method: lastConversation?.method || {
        id: ToolLLaMAMethods[defaultMethodId].id,
        method: ToolLLaMAMethods[defaultMethodId].method,
        maxLength: ToolLLaMAMethods[defaultMethodId].maxLength,
      },
      top_k: lastConversation?.top_k ?? DEFAULT_TOP_K,
      folderId: null,
      settings: getDefaultSettings(),
    };

    const updatedConversations = [...conversations, newConversation];

    dispatch({ field: 'selectedConversation', value: newConversation });
    dispatch({ field: 'conversations', value: updatedConversations });

    saveConversation(newConversation);
    saveConversations(updatedConversations);

    dispatch({ field: 'loading', value: false });
  };

  const addNewConservation = (name: string, settings: Settings | undefined) => {
    const lastConversation = conversations[conversations.length - 1];

    const newConversation: Conversation = getNewConversation();

    const updatedConversations = [...conversations, newConversation];

    dispatch({ field: 'selectedConversation', value: newConversation });
    dispatch({ field: 'conversations', value: updatedConversations });

    saveConversation(newConversation);
    saveConversations(updatedConversations);

    dispatch({ field: 'loading', value: false });
  };

  const handleUpdateSettings = (
    conversation: Conversation,
    settings: Settings,
  ) => {
    const updatedConversation = {
      ...conversation,
      settings: settings,
      name: settings.name,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );

    dispatch({ field: 'selectedConversation', value: single });
    dispatch({ field: 'conversations', value: all });
  };

  const [messages, handleUpdateMessages] = useState<Message[]>([]);
  const [method, setMethod] = useState<ToolLLaMAModel>(methods[0]);

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );

    dispatch({ field: 'selectedConversation', value: single });
    dispatch({ field: 'conversations', value: all });
  };

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
    }
  }, [selectedConversation]);

  useEffect(() => {
    defaultMethodId &&
      dispatch({ field: 'defaultMethodId', value: defaultMethodId });
    serverSideApiKeyIsSet &&
      dispatch({
        field: 'serverSideApiKeyIsSet',
        value: serverSideApiKeyIsSet,
      });
    // serverSidePluginKeysSet &&
    //   dispatch({
    //     field: 'serverSidePluginKeysSet',
    //     value: serverSidePluginKeysSet,
    //   });
  }, [defaultMethodId, serverSideApiKeyIsSet]); // serverSidePluginKeysSet

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const settings = getSettings();
    if (settings.theme) {
      dispatch({
        field: 'lightMode',
        value: settings.theme,
      });
    }

    const apiKey = localStorage.getItem('apiKey');

    if (serverSideApiKeyIsSet) {
      dispatch({ field: 'apiKey', value: '' });

      localStorage.removeItem('apiKey');
    } else if (apiKey) {
      dispatch({ field: 'apiKey', value: apiKey });
    }

    const pluginKeys = localStorage.getItem('pluginKeys');
    if (serverSidePluginKeysSet) {
      dispatch({ field: 'pluginKeys', value: [] });
      localStorage.removeItem('pluginKeys');
    } else if (pluginKeys) {
      dispatch({ field: 'pluginKeys', value: pluginKeys });
    }

    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
      dispatch({ field: 'showPromptbar', value: false });
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({ field: 'showChatbar', value: showChatbar === 'true' });
    }

    const showPromptbar = localStorage.getItem('showPromptbar');
    if (showPromptbar) {
      dispatch({ field: 'showPromptbar', value: showPromptbar === 'true' });
    }

    const folders = localStorage.getItem('folders');
    if (folders) {
      dispatch({ field: 'folders', value: JSON.parse(folders) });
    }

    const prompts: Prompt[] = []; //localStorage.getItem('prompts');
    // if (prompts) {
    //   dispatch({ field: 'prompts', value: JSON.parse(prompts) });
    // }

    const selectedConversation = null; //localStorage.getItem('selectedConversation');
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation);
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      );

      dispatch({
        field: 'selectedConversation',
        value: cleanedSelectedConversation,
      });
    } else {
      const lastConversation = conversations[conversations.length - 1];
      dispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: t('New Tool'),
          messages: [],
          method: ToolLLaMAMethods[defaultMethodId],
          top_k: lastConversation?.top_k ?? DEFAULT_TOP_K,
          folderId: null,
        },
      });
    }
  }, [
    defaultMethodId,
    dispatch,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
  ]);
  function saveTools(tools: Settings[]) {
    dispatch({
      field: 'conversations',
      value: tools.map((tool: Settings) => {
        return getNewConversation(tool);
      }),
    });
  }

  const [toolGetter, setToolGetter] = useState(false);
  useEffect(() => {
    // for testing
    // saveTools(
    //   JSON.parse(
    //     `[{"name":"${Math.random()}","schemaElements":[],"description":"desc of tool"},{"name":"a","schemaElements":[{"id":"1703177588187","name":"","data_type":"","description":"","example":""},{"id":"1703177634890","name":"","data_type":"","description":"","example":""}],"description":"desc of tool"}]`,
    //   ),
    // );
    let controller = new AbortController();
    fetch(BACKEND_URL + 'get_tools', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((tools) => {
        if (tools.length) {
          saveTools(tools);
        }
      })
      .catch((err) => console.log(err));
    return () => {
      controller.abort();
    }
  }, [toolGetter]);

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        addNewConservation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
        handleUpdateSettings,
        handleUpdateMessages,
        messages,
        method,
        setMethod,
        setToolGetter,
      }}
    >
      <Head>
        <title>SwissNYF UI</title>
        <meta name="description" content="Advanced tool usage." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            <Chatbar />

            <div className="flex flex-1">
              <Chat stopConversationRef={stopConversationRef} />
            </div>

            {/*<Promptbar />*/}
          </div>
        </main>
      )}
    </HomeContext.Provider>
  );
};
export default Home;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const defaultMethodId =
    (process.env.DEFAULT_METHOD &&
      Object.values(ToolLLaMAMethodID).includes(
        process.env.DEFAULT_METHOD as ToolLLaMAMethodID,
      ) &&
      process.env.DEFAULT_METHOD) ||
    fallbackMethodID;

  let serverSidePluginKeysSet = true;

  // const googleApiKey = process.env.GOOGLE_API_KEY;
  // const googleCSEId = process.env.GOOGLE_CSE_ID;
  //
  // if (googleApiKey && googleCSEId) {
  //   serverSidePluginKeysSet = true;
  // }

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      defaultMethodId,
      serverSidePluginKeysSet,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
        'settings',
      ])),
    },
  };
};
