import React from 'react';
import { View } from '@/components/view/view';

type Props<Key extends React.Key> = {
  tabs: { header: React.ReactNode; content: React.ReactNode; key: Key }[];
  _onActiveTabChange: (newValue: Key) => void;
  activeTabKey: Key;
  wrapperCN?: string | undefined;
  contentWrapperCN?: string | undefined;
  grow?: boolean | undefined;
};

export function Tabs<Key extends React.Key>({
  tabs,
  activeTabKey,
  _onActiveTabChange,
  contentWrapperCN,
  wrapperCN,
  grow,
}: Props<Key>) {
  const content = tabs.find((t) => t.key === activeTabKey);
  return (
    <View grow={grow} className={wrapperCN}>
      <div className="border-b border-b-neutral-500 flex pl-1">
        {tabs.map(({ header, key }) => {
          const isActive = key === activeTabKey;
          const extraCn = isActive ? 'border-b-white bg-white mt-[-2px]' : '';
          return (
            <a
              onClick={(e) => {
                e.preventDefault();
                _onActiveTabChange(key);
              }}
              href={`#${key}`}
              className={`block border border-neutral-500 pl-3 pr-3 mb-[-1px]  ${extraCn}`}
              key={key}
            >
              {header}{' '}
            </a>
          );
        })}
      </div>
      <View grow className={`bg-white border border-neutral-500 border-t-0 ${contentWrapperCN}`}>
        {content?.content}
      </View>
    </View>
  );
}
