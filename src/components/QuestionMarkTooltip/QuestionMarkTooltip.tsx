import React from 'react';
import { Icon } from '@/components/icon/icon';
import {
  useFloating,
  useHover,
  useInteractions,
  shift,
  FloatingArrow,
  arrow,
  safePolygon,
} from '@floating-ui/react';
import { tooltipCN, tooltipFloatingArrowCN } from '@/app/classnames';

const buttonWrapperCN = `
inline-block
leading-none
border 
border-button-border

rounded-2xl
 
p-1 
outline-none

hover:bg-button-background-hover
hover:border-button-border-hover 
`;

type Props = {
  title: string;
  'aria-label'?: string | undefined;
  disabled?: boolean | undefined;
};

export const QuestionMarkTooltip: React.FunctionComponent<React.PropsWithChildren<Props>> =
  function ({ title, 'aria-label': ariaLabel }) {
    const labelForAria = ariaLabel ?? title;

    const [isOpen, setIsOpen] = React.useState(false);
    const arrowRef = React.useRef(null);

    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange: setIsOpen,
      middleware: [
        shift(),
        arrow({
          element: arrowRef,
        }),
      ],
    });

    const hover = useHover(context, {
      // delay: {open: 0, close: 200},
      handleClose: safePolygon(),
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return (
      <>
        <span className="inline-block" ref={refs.setReference} {...getReferenceProps()}>
          <span className={`${buttonWrapperCN}`} aria-label={labelForAria}>
            <Icon src="/static_assets/svg/question.svg" />
          </span>
        </span>
        {isOpen && (
          <div
            className={tooltipCN}
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <FloatingArrow className={tooltipFloatingArrowCN} ref={arrowRef} context={context} />
            {title}
          </div>
        )}
      </>
    );
  };
