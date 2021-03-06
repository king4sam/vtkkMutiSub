/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This function code of mountFiber() is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

function getSubUrl() {
  function sendSubUrl(node) {
    console.info('get sub url', node.memoizedProps.subtitleUrl);
    const keys = Object.keys(node.memoizedProps.subtitleUrl);
    console.info('langs', keys);
    keys.forEach(function(lang) {
      window.postMessage(
        {
          source: 'subUrl',
          lang: lang,
          url: node.memoizedProps.subtitleUrl[lang],
        },
        '*'
      );
    });
  }

  function mountFiber(fiber) {
    // Depth-first.
    // Logs mounting of children first, parents later.
    let node = fiber;
    outer: while (true) {
      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node.memoizedProps && node.memoizedProps.subtitleUrl) {
        sendSubUrl(node);
      }
      if (node == fiber) {
        return;
      }
      if (node.sibling) {
        node.sibling.return = node.return;
        node = node.sibling;
        continue;
      }
      while (node.return) {
        node = node.return;

        if (node.memoizedProps && node.memoizedProps.subtitleUrl) {
          sendSubUrl(node);
        }

        if (node == fiber) {
          return;
        }
        if (node.sibling) {
          node.sibling.return = node.return;
          node = node.sibling;
          continue outer;
        }
      }
      return;
    }
  }

  var hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  for (var rid in hook._renderers) {
    hook.getFiberRoots(rid).forEach(root => {
      mountFiber(root.current);
    });
  }
  console.info('traverse fiber node tree');
}

export default getSubUrl;
