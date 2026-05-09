import { onEvent } from './utils.js';

/**
 * Initialize header. This
 * function adding scroll handler and
 * add set background to header when it need.
 * @param {HTMLElement} element
 */
export function createHeader(element) {
  onEvent(() => {
    const height = element.offsetHeight;

    if (window.scrollY > height) {
      element.classList.add('scrolled');
    } else {
      element.classList.remove('scrolled');
    }
  }, 'scroll');
}
