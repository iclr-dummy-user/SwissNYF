import { FC, useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { DEFAULT_TOP_K } from '@/utils/app/const';

import HomeContext from '@/pages/api/home/home.context';

interface Props {
  label: string;
  onChangeTopK: (top_k: number) => void;
}

export const TopKSlider: FC<Props> = ({
  label,
  onChangeTopK,
}) => {
  const {
    state: { conversations },
  } = useContext(HomeContext);
  const lastConversation = conversations[conversations.length - 1];
  const [topK, setTopK] = useState(
    lastConversation?.top_k ?? DEFAULT_TOP_K,
  );
  const { t } = useTranslation('chat');
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    setTopK(newValue);
    onChangeTopK(newValue);
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {label}
      </label>
      <span className="text-[12px] text-black/50 dark:text-white/50 text-sm">
        {t(
          'Select the number of tools you would like the model to consider',
        )}
      </span>
      <span className="mt-2 mb-1 text-center text-neutral-900 dark:text-neutral-100">
        {topK}
      </span>
      <input
        className="cursor-pointer"
        type="range"
        min={1}
        max={100}
        step={1}
        value={topK}
        onChange={handleChange}
      />
      {/*<ul className="w mt-2 pb-8 flex justify-between px-[24px] text-neutral-900 dark:text-neutral-100">*/}
      {/*  <li className="flex justify-center">*/}
      {/*    <span className="absolute">{t('Precise')}</span>*/}
      {/*  </li>*/}
      {/*  <li className="flex justify-center">*/}
      {/*    <span className="absolute">{t('Neutral')}</span>*/}
      {/*  </li>*/}
      {/*  <li className="flex justify-center">*/}
      {/*    <span className="absolute">{t('Creative')}</span>*/}
      {/*  </li>*/}
      {/*</ul>*/}
    </div>
  );
};
