import React from 'react';
import type { FunctionComponentWithChildren } from '@/types';
import { assertIsReactElementBase, isReactElementBase } from '@/utils';
import { mergeClassNameFirstPriority } from '@/helpers/properties';

type Props = {
  useChild?: boolean;
  dontWrapLeft?: boolean;
  dontWrapRight?: boolean;
  inline?: boolean;
};

export const LayoutSpread: FunctionComponentWithChildren<Props> = function ({
  useChild,
  children,
  dontWrapLeft,
  dontWrapRight,
  inline,
}) {
  if (useChild && React.Children.count(children) !== 1) {
    throw new Error('Expected only one child when useChild is set');
  }

  const rootCn = `${inline ? 'inline-flex' : 'flex'} justify-between`;

  const childrenArr = React.Children.toArray(children);
  const firstChild = childrenArr[0];
  if (useChild) {
    assertIsReactElementBase(firstChild);

    const [left, right] = React.Children.toArray(firstChild.props.children);

    const l = isReactElementBase(left) || dontWrapLeft ? left : <div key="l">{left}</div>;
    const r = isReactElementBase(right) || dontWrapRight ? right : <div key="r">{right}</div>;

    return React.cloneElement(
      firstChild,
      mergeClassNameFirstPriority({ ...firstChild.props, children: [l, r] }, rootCn),
    );
  }

  const [left, right] = React.Children.toArray(children);

  const l = isReactElementBase(left) || dontWrapLeft ? left : <div key="l">{left}</div>;
  const r = isReactElementBase(right) || dontWrapRight ? right : <div key="r">{right}</div>;

  return (
    <div className="flex justify-between">
      {l}
      {r}
    </div>
  );
};
