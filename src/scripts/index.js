import { createHeader } from './header.js';
import { createScrollingText } from './scrolling-text.js';
import { Slider } from './slider.js';

document.addEventListener('DOMContentLoaded', main);

function main() {
  const scrollingTextElements = document.querySelectorAll('.scrolling-text');

  scrollingTextElements.forEach((item) => {
    createScrollingText(item);
  });

  const header = document.querySelector('.header');
  createHeader(header);
  new Slider(document.querySelector('.members-section__members-slider'), {
    navigation: document.querySelector('.members-section__navigation'),
    gap: 20,
    slidePerView: 3,
    pagination: document.querySelector(
      '.members-section__navigation .slider-pagination',
    ),
    draggable: false,
  });
}
