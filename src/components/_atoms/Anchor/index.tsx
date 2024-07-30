import Link, { type LinkProps } from 'next/link';
import type { FunctionComponentWithChildren } from '@/types';
import { clsx } from '@/helpers/clsx';
import { expectType, type TypeEqual } from 'ts-expect';

type OwnProps = { noStyle?: boolean };
type Props = LinkProps & OwnProps;

export const anchorCn = 'text-button-border-focus hover:underline cursor-pointer';

// TODO: text size inherit from parent
// TODO: external prop, or something to switch from <Link> to <a>
export const Anchor: FunctionComponentWithChildren<Props> = function (props) {
  const { noStyle, children, ...linkProps } = props;
  expectType<TypeEqual<LinkProps, typeof linkProps>>(true);
  return (
    <Link {...props} className={clsx({ [anchorCn]: !noStyle })}>
      {children}
    </Link>
  );
};
