import { onEvent } from './utils.js';

/**
 * @param {HTMLUListElement} scrollingTextElement
 */
const getOriginalItems = (scrollingTextElement) =>
  scrollingTextElement.querySelectorAll(
    '.scrolling-text__item:not(.duplicate)',
  );

const getDuplicateItems = (scrollingTextElement) =>
  scrollingTextElement.querySelectorAll('.scrolling-text__item.duplicate');

/**
 * @param {HTMLElement} element
 */
const addDuplicateClassToItems = (elements) =>
  elements.forEach((element) => element.classList.add('duplicate'));

/**
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
