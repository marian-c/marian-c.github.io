import React from 'react';

const buttonWrapperCN = `
leading-none
border 
border-button-border
p-1 
outline-none 
bg-button-background

`;

const buttonWrapperCNDisabled = `
opacity-50
`;

const buttonWrapperCNEnabled = `
hover:bg-button-background-hover
focus:border-button-border-focus
hover:border-button-border-hover
opacity-100
`;

type Props = {
  title?: string | undefined;
  inaccessibleChildren?: React.ReactNode | undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  'aria-label'?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  theRef?: React.Ref<HTMLButtonElement>;
};

export const Button: React.FunctionComponent<React.PropsWithChildren<Props>> = function ({
  children,
  title,
  inaccessibleChildren,
  onClick,
  'aria-label': ariaLabel,
  disabled,
  className,
  theRef,
}) {
  const labelForAria = ariaLabel ?? title;
  return (
    <button
      ref={theRef}
      className={`${buttonWrapperCN} ${disabled ? buttonWrapperCNDisabled : buttonWrapperCNEnabled} ${className ?? ''}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={labelForAria}
    >
      {inaccessibleChildren}
      {children}
    </button>
  );
};
