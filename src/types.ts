import React from 'react';

export type LayoutValue = {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  top: number;
};

export type LayoutEvent<T extends HTMLElement = HTMLElement> = {
  nativeEvent: {
    layout: LayoutValue;
    target: T;
  };
  timeStamp: number;
};

export type ReactLayoutHandler<T extends HTMLElement = HTMLElement> = (
  layoutEvent: LayoutEvent<T>,
) => void;

export enum GenericResultKind {
  success,
  error,
}

export type GenericResultSuccess<T> = { kind: GenericResultKind.success; result: T };
export type GenericResultError<T> = {
  kind: GenericResultKind.error;
  errors: T[];
};

// TODO: if Err is array, use `errors`, but use `error` otherwise
// TODO: if Succ is itself a generic result, extract the success type
// useful for when a function returns the result of another function
export type GenericResult<Err, Succ> = GenericResultError<Err> | GenericResultSuccess<Succ>;

export type ExtractSuccessType<GR> = GR extends { kind: GenericResultKind.success; result: infer R }
  ? R
  : never;

export type FunctionComponentWithChildren<P = unknown> = React.FunctionComponent<
  React.PropsWithChildren<P>
>;
export type FunctionComponent<P = unknown> = React.FunctionComponent<P>;
