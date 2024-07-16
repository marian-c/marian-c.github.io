import React from 'react';
import Image, { type ImageProps } from 'next/image';

export const Icon: React.FunctionComponent<{ src: ImageProps['src'] }> = function ({ src }) {
  return (
    <Image
      // to play nice in a button, next to a label
      className="inline-block"
      width={16}
      height={16}
      src={src}
      alt="hidden icon"
      draggable={false}
      aria-hidden={true}
    />
  );
};
