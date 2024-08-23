'use client';
import Image from 'next/image';
import React from 'react';
import { useFloating } from '@floating-ui/react';

export default function PageSample() {
  const { refs, floatingStyles } = useFloating();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  return (
    <>
      <div
        ref={refs.setReference}
        onClick={() => {
          dialogRef.current?.showModal();
        }}
      >
        anchor
      </div>
      <div ref={refs.setFloating} style={floatingStyles}>
        tooltip
      </div>
      <dialog ref={dialogRef}>contents</dialog>
      <Image
        width={16}
        height={16}
        src="/static_assets/svg/play.svg"
        alt=""
        draggable={false}
        aria-hidden={true}
      />
    </>
  );
}
