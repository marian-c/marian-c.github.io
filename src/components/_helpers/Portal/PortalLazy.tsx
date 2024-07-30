/**
 * changes dom at render time
 */

import React from 'react';
import ReactDOM from 'react-dom';

let root: HTMLDivElement | null = null;

function getRoot() {
  if (!root) {
    root = window.document.createElement('div');
    root.setAttribute('id', 'mcw-portal-lazy');
    window.document.body.appendChild(root);
  }
  return root;
}

export interface PortalProps {
  children?: React.ReactNode;
}

export default function PortalLazy({ children }: PortalProps) {
  return ReactDOM.createPortal(children, getRoot());
}
