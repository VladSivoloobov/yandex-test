/**
 * Calculate sum of all items in slider
 * @param {HTMLUListElement} scrollingTextElement
 */
function calculateScrollingTextItemsWidth(scrollingTextElement) {
  const elements = scrollingTextElement.querySelectorAll(
    '.scrolling-text__item',
  );

  return Array.from(elements).reduce((accum, element) => {
    return accum + element.offsetWidth + parseFloat(style.gap);
  }, 0);
}

/**
 * Create infinite slider for running text
 * effect. It's adaptive for width.
 * @param {HTMLUListElement} scrollingTextElement
 */
export function createScrollingText(scrollingTextElement) {
  window.addEventListener(
    'resize',
    () => createScrollingText(scrollingTextElement),
    {
      once: true,
    },
  );

  const style = getComputedStyle(scrollingTextElement);

  const width = scrollingTextElement.offsetWidth;
}

createScrollingText(document.querySelector('.scrolling-text'));
