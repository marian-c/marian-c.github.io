/**
 * changes dom at parse time (top level of the module)
 */
import React from 'react';
import ReactDOM from 'react-dom';

function getRoot() {
  const root = window.document.createElement('div');
  root.setAttribute('id', 'mcw-portal');
  window.document.body.appendChild(root);
  return root;
}

let root = getRoot();

export interface PortalProps {
  children?: React.ReactNode;
}

export default function Portal({ children }: PortalProps) {
  return ReactDOM.createPortal(children, root);
}
