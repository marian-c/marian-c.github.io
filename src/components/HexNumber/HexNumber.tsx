import React from 'react';
import {
  arrow,
  FloatingArrow,
  safePolygon,
  shift,
  useFloating,
  useHover,
  useInteractions,
  flip,
} from '@floating-ui/react';
import { tooltipCN, tooltipFloatingArrowCN } from '@/app/classnames';

// TODO: support padding of zeros
type Props = {
  value: number;
  use: 'hex' | 'dec';
  render?: (value: { decValue: string; hexValue: string }) => React.ReactNode;
};

export const HexNumber: React.FunctionComponent<React.PropsWithChildren<Props>> = ({
  value,
  use,
  render,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const arrowRef = React.useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      flip(),
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

  const hexValue = value.toString(16).toUpperCase();
  const decValue = value.toString(10);

  return (
    <>
      <span
        className="border-b border-black border-dotted whitespace-pre"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {render ? render({ decValue, hexValue }) : use === 'hex' ? `0x${hexValue}` : decValue}
      </span>
      {isOpen && (
        <span
          className={tooltipCN}
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <FloatingArrow className={tooltipFloatingArrowCN} ref={arrowRef} context={context} />{' '}
          {use === 'hex' ? `dec: ${decValue}` : `0x${hexValue}`}{' '}
        </span>
      )}
    </>
  );
};
