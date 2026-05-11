/**
 * @fileoverview
 * This file is implementing the adaptive infinite
 * slider with text.
 *
 * This slider can adaptive to any screen resolution
 * and add more items or remove them depending on
 * screen size in realtime.
 */

import { onEvent } from './utils.js';

/**
 * Return children that not duplicate
 * @param {HTMLUListElement} scrollingTextElement
 */
const getOriginalItems = (scrollingTextElement) =>
  scrollingTextElement.querySelectorAll(
    '.scrolling-text__item:not(.duplicate)',
  );

const getDuplicateItems = (scrollingTextElement) =>
  scrollingTextElement.querySelectorAll('.scrolling-text__item.duplicate');

/**
 * Add duplicate class to all input
 * items in classList.
 * @param {HTMLElement} element
 */
const addDuplicateClassToItems = (elements) =>
  elements.forEach((element) => element.classList.add('duplicate'));

/**
 * Calculate sum of all items in slider,
 * or input items.
 * @param {HTMLUListElement} scrollingTextElement
 * @param {HTMLElement[]?} items
 */
function calculateScrollingTextItemsWidth(scrollingTextElement, items) {
  const elements = items || getOriginalItems(scrollingTextElement);

  const style = getComputedStyle(scrollingTextElement);

  return Array.from(elements).reduce((accum, element) => {
    return accum + element.offsetWidth + parseFloat(style.gap || 0);
  }, 0);
}

/**
 * It's duplicate all children items in
 * scrollingTextElement, or duplicate
 * input items and append it to scrollingTextElement
 * @param {HTMLUListElement} scrollingTextElement
 * @param {HTMLLIElement?} items
 */
function duplicateAndAppend(scrollingTextElement, items) {
  const children = getOriginalItems(scrollingTextElement);
  const duplicates = Array.from(items || children).map((item) =>
    item.cloneNode(true),
  );

  duplicates.forEach((item) => item.classList.remove('init'));

  scrollingTextElement.append(...duplicates);

  return duplicates;
}

/**
 * Filling wrapper with children duplicates by screen size.
 * @param {HTMLUListElement} scrollingTextElement
 * @param {number} groupItemsCount
 */
function fillScrollingTextByWindowSize(scrollingTextElement, groupItemsCount) {
  const wrapper = scrollingTextElement.closest('.scrolling-text-wrapper');
  if (!wrapper) return;

  const wrapperWidth = wrapper.offsetWidth;
  const originalItems = Array.from(getOriginalItems(scrollingTextElement));

  if (originalItems.length === 0) return;

  scrollingTextElement
    .querySelectorAll('.duplicate')
    .forEach((el) => el.remove());

  const groupWidth = calculateScrollingTextItemsWidth(
    scrollingTextElement,
    originalItems,
  );
  if (groupWidth === 0) return;

  const copiesNeeded = Math.ceil(wrapperWidth / groupWidth);

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < copiesNeeded; i++) {
    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.classList.add('duplicate');
      clone.classList.remove('init');
      fragment.appendChild(clone);
    });
  }

  scrollingTextElement.appendChild(fragment);
}

/**
 * Create infinite slider for running text
 * effect. It's adaptive for width.
 * @param {HTMLUListElement} scrollingTextElement
 */
export function createScrollingText(scrollingTextElement) {
  const children = scrollingTextElement.children;

  Array.from(children).forEach((item) => item.classList.add('init'));

  const initSizeOfGroup = calculateScrollingTextItemsWidth(
    scrollingTextElement,
    children,
  );
  const groupItemsCount = children.length;

  onEvent(
    () =>
      fillScrollingTextByWindowSize(
        scrollingTextElement,
        initSizeOfGroup,
        groupItemsCount,
      ),
    'resize',
  );
}
