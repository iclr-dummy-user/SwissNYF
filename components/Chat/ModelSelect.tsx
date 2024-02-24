import { IconExternalLink } from '@tabler/icons-react';
import { useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { OpenAIModel, ToolLLaMAModel } from '@/types/toolllama';

import HomeContext from '@/pages/api/home/home.context';

export const ModelSelect = () => {
  const { t } = useTranslation('chat');

  const {
    state: { selectedConversation, methods, defaultMethodId },
    handleUpdateConversation,
    method,
    setMethod,
    dispatch: homeDispatch,

  } = useContext(HomeContext);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value)
    setMethod(methods.find((m) => m.id === e.target.value) as ToolLLaMAModel);
      
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {t('Planner Name')}
      </label>
      <div className="w-full rounded-lg border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        <select
          className="w-full bg-transparent p-2"
          placeholder={t('Select a model') || ''}
          value={method.id}
          onChange={handleChange}
        >
          {methods.map((method) => (
            <option
              key={method.id}
              value={method.id}
              className="dark:bg-[#343541] dark:text-white"
            >
              {method.id === defaultMethodId
                ? `Default (${method.name})`
                : method.name}
            </option>
          ))}
        </select>
      </div>
      {/*<div className="w-full mt-3 text-left text-neutral-700 dark:text-neutral-400 flex items-center">*/}
      {/*  <a*/}
      {/*    href="https://platform.openai.com/account/usage"*/}
      {/*    target="_blank"*/}
      {/*    className="flex items-center"*/}
      {/*  >*/}
      {/*    <IconExternalLink size={18} className={'inline mr-1'} />*/}
      {/*    {t('View Account Usage')}*/}
      {/*  </a>*/}
      {/*</div>*/}
    </div>
  );
};
