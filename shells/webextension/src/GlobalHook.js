import installGlobalHook from './installGlobalHook';
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/* globals chrome */

// Inject a `__REACT_DEVTOOLS_GLOBAL_HOOK__` global so that React can detect that the
// devtools are installed (and skip its suggestion to install the devtools).

const detectReact = `
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on('renderer', function(evt) {
  window.postMessage({
    source: 'react-devtools-detector',
    reactBuildType: evt.reactBuildType,
  }, '*');
});
`;
const saveNativeValues = `
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeObjectCreate = Object.create;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeMap = Map;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeWeakMap = WeakMap;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeSet = Set;
`;

const js = ';(' + installGlobalHook.toString() + '(window))' + saveNativeValues + detectReact;

// This script runs before the <head> element is created, so we add the script
// to <html> instead.
const script = document.createElement('script');
script.textContent = js;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);
console.info('__REACT_DEVTOOLS_GLOBAL_HOOK__');
