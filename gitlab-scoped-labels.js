// ==UserScript==
// @name     GitLab scoped labels (view only)
// @version  14
// @grant    none
// @include  https://git.octocat.lab/*
// @license  GPL-3.0 License; https://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==

function convertToScoped(label) {
  label.classList.add("gl-label-scoped")
  label.firstChild.innerHTML = label.firstChild.innerText.replace(/([^:]*)::([^:]*)/, "<span class='gl-label-text'>$1</span> <span class='gl-label-text-scoped'>$2</span>");
  if (label.classList.contains("js-no-trigger")) { // Label filter label edge case
    return;
  }
  // Apply light/dark attribute onto the child if the css definition is needed. (Mostly in the Activity area)
  if (label.classList.contains("gl-label-text-light")) {
    label.firstChild.firstChild.classList.add("gl-label-text-light");
  }
  if (label.classList.contains("gl-label-text-dark")) {
    label.firstChild.firstChild.classList.add("gl-label-text-dark");
  }
}

function extractColor(label) {
  const rgbValueMatch = label.innerHTML.match(/.*background-color: rgb\((.*)\).*/)
  if (rgbValueMatch) {
    return `rgb(${rgbValueMatch[1]})`;
  }
  const hexValueMatch = label.innerHTML.match(/.*background-color: #([0-9a-zA-Z]*).*/)
  if (hexValueMatch) {
    return `#${hexValueMatch[1]}`;
  }
  return false;
}

function convertToScopedExtractColor(label) {
  const color = extractColor(label);
  if (!color) {
    return;
  }
  label.setAttribute("style", "--label-background-color: " + color + "; --label-inset-border: inset 0 0 0 2px " + color + ";")
  label.firstChild.classList.remove("gfm");
  label.firstChild.classList.remove("gfm-label");
  label.firstChild.classList.add("gl-label-link-underline");
  label.firstChild.classList.add("has-tooltip");
  if (label.classList.contains("js-no-trigger")) { // Label filter label edge case
    return;
  }
  // Some labels still store text light/dark attribute on the child. So we move to the parent so that we don't lose it.
  if (label.firstChild.firstChild.classList.contains("gl-label-text-light")) {
    label.classList.add("gl-label-text-light");
  }
  if (label.firstChild.firstChild.classList.contains("gl-label-text-dark")) {
    label.classList.add("gl-label-text-dark");
  }
}

const callback = function(mutations, observer) {
  for(const mutation of mutations) {
    if (mutation.type === "attributes"
        && mutation.attributeName === "class") {
      /* Watch class attribute mutations to support labels in filter dropdown. But Gitlab does some javascript stuff
       * that messes with our first pass.
       */
      if (mutation.target.classList.contains("gl-filtered-search-token-segment")) {
        const labels = mutation.target.querySelectorAll("span.gl-label");
        for(const label of labels) {
          if(label.firstChild.firstChild.innerText.includes("::")) {
            convertToScoped(label);
          }
        }
      }
      else if (mutation.target.classList.contains("gl-label")
          && mutation.target.classList.contains("js-no-trigger")
          && !mutation.target.classList.contains("gl-label-scoped")) {
        // Brute force solution to make sure that Gitlab does not stomp on us.
        mutation.target.classList.add("gl-label-scoped");
      }
    }
    const labels = document.querySelectorAll("span.gl-label");
    for(const label of labels) {
      if(label.innerText.includes("::")) {
        convertToScopedExtractColor(label);
        convertToScoped(label);
      }
    }
  }
}
const observer = new MutationObserver(callback);
observer.observe(document, { childList: true, subtree: true, attributes: true });