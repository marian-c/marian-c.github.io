// FROM: https://github.com/necolas/react-native-web/blob/0.19.11/packages/react-native-web/src/exports/UIManager/index.js
/**
 * Copyright (c) Nicolas Gallagher.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

type MeasurementCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  left: number,
  top: number,
) => void;

const getRect = (node: HTMLElement) => {
  const height = node.offsetHeight;
  const width = node.offsetWidth;
  let left = node.offsetLeft;
  let top = node.offsetTop;

  let parent = node.offsetParent as HTMLElement | Element | null;

  while (parent && parent.nodeType === Node.ELEMENT_NODE) {
    left +=
      ('offsetLeft' in parent ? parent.offsetLeft : 0) + parent.clientLeft - parent.scrollLeft;
    top += ('offsetTop' in parent ? parent.offsetTop : 0) + parent.clientTop - parent.scrollTop;
    parent = 'offsetParent' in parent ? parent.offsetParent : null;
  }

  top -= window.scrollY;
  left -= window.scrollX;

  return { width, height, top, left };
};

const measureLayout = (node: HTMLElement, callback: MeasurementCallback) => {
  const relativeNode = node.parentNode as HTMLElement | null;
  if (node && relativeNode) {
    setTimeout(() => {
      if (node.isConnected && relativeNode.isConnected) {
        const relativeRect = getRect(relativeNode);
        const { height, left, top, width } = getRect(node);
        const x = left - relativeRect.left;
        const y = top - relativeRect.top;
        callback(x, y, width, height, left, top);
      }
    }, 0);
  }
};

export const UIManager = {
  measure(node: HTMLElement, callback: MeasurementCallback) {
    measureLayout(node, callback);
  },
};
