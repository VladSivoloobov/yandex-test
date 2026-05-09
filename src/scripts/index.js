import { createHeader } from './header.js';
import { createScrollingText } from './scrolling-text.js';

document.addEventListener('DOMContentLoaded', main);

function main() {
  const scrollingTextElements = document.querySelectorAll('.scrolling-text');

  scrollingTextElements.forEach((item) => {
    createScrollingText(item);
  });

  const header = document.querySelector('.header');
  createHeader(header);
}
