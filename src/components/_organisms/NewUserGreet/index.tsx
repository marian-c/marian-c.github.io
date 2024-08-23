'use client';
import type { FunctionComponent } from '@/types';
import { useLocalStorageSimpleState } from '@/hooks/useLocalStorageSimpleState';
import { LayoutSpread } from '@/components/_layouts/LayoutSpread';
import { Button } from '@/components/Button/Button';
import { Icon } from '@/components/icon/icon';
import React from 'react';
import { clsx } from '@/helpers/clsx';
import { anchorCn } from '@/components/_atoms/Anchor';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/_helpers/tooltip';

export const NewUserGreet: FunctionComponent = function () {
  const [hideEmulatorGreeting, setHideEmulatorGreeting] = useLocalStorageSimpleState(
    'hide_emulator_greeting',
    false,
    true,
  );
  if (hideEmulatorGreeting) {
    return;
  }
  return (
    <LayoutSpread dontWrapRight useChild>
      <div className="p-2 mb-2 bg-yellow-300">
        <span>
          New user? Try the &quot;Build and run&quot; button in the toolbar bellow, it should look
          like this:{' '}
          <Tooltip delay={{ open: 1000 }}>
            <TooltipTrigger asChild>
              <Button
                className="mr-2"
                inaccessibleChildren={<Icon src="/static_assets/svg/build-run.svg" />}
              />
            </TooltipTrigger>
            <TooltipContent>
              Not this button though, this is just an example, see below 😅
            </TooltipContent>
          </Tooltip>
        </span>
        <span
          onClick={() => {
            setHideEmulatorGreeting(true);
          }}
          className={clsx(anchorCn, 'text-button-background-hover')}
        >
          close
        </span>
      </div>
    </LayoutSpread>
  );
};
