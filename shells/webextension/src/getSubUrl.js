'use strict';

function getSubUrl() {

  function mountFiber(fiber) {
    console.info('mountFiber');
    // Depth-first.
    // Logs mounting of children first, parents later.
    let node = fiber;
    outer: while (true) {
      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      // console.info(node);subtitleUrl
      // console.info(node);
      if (node.memoizedProps && node.memoizedProps.subtitleUrl) {
        console.info('get sub url', node.memoizedProps.subtitleUrl);
        const keys = Object.keys(node.memoizedProps.subtitleUrl);
        console.info('langs', keys);
        keys.forEach( function(lang) {
          console.info('fetching... ' + node.memoizedProps.subtitleUrl[lang]);
          fetch(node.memoizedProps.subtitleUrl[lang])
          .then(function(response) {
            console.info(response.text());
          });
        });
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

        // console.info(node);
        if (node.memoizedProps && node.memoizedProps.subtitleUrl) {
          console.info('get sub url', node.memoizedProps.subtitleUrl);
          const keys = Object.keys(node.memoizedProps.subtitleUrl);
          console.info('langs', keys);
          keys.forEach( function(lang) {
            console.info('fetching... ' + node.memoizedProps.subtitleUrl[lang]);
            fetch(node.memoizedProps.subtitleUrl[lang])
            .then(function(response) {
              console.info(response.text());
            });
          });
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
  console.info('getSubUrl hook', hook);
  for (var rid in hook._renderers) {
    hook.getFiberRoots(rid).forEach(root => {
      mountFiber(root.current);
    });
  }
  console.info('getsubtitle url', hook);
}

module.exports = getSubUrl;
