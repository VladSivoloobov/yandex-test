import { onEvent } from './utils.js';

document.addEventListener('DOMContentLoaded', main);

function main() {
  onObserved('.scrolling-text', async () => {
    const { createScrollingText } = await import('./scrolling-text.js');

    const scrollingTextElements = document.querySelectorAll('.scrolling-text');

    scrollingTextElements.forEach((item) => {
      createScrollingText(item);
    });
  });

  onObserved('.slider', async () => {
    const { Slider } = await import('./slider.js');

    new Slider(document.querySelector('.members-section__members-slider'), {
      navigation: document.querySelector('.members-section__navigation'),
      gap: 20,
      slidePerView: 3,
      pagination: document.querySelector(
        '.members-section__navigation .slider-pagination',
      ),
      draggable: false,
      loop: true,
      auto: {
        delay: 5000,
      },
      breakpoints: {
        '(max-width: 991px)': {
          slidePerView: 1,
        },
      },
    });

    const stepsSlider = new Slider(
      document.querySelector('.steps-section__slider'),
      {
        navigation: null,
        gap: 20,
        slidePerView: 1,
        pagination: null,
        draggable: false,
        loop: false,
        onChange: (slider) => {
          const planeImage = document.querySelector('.step-grid__image');
          planeImage.style.transform = `translateX(${-slider.currentTransform}px)`;
        },
        breakpoints: {
          '(max-width: 991.98px)': {
            ignore: false,
          },
          '(min-width: 992px)': {
            ignore: true,
          },
        },
        pagination: document.querySelector('.steps-section__pagination'),
        navigation: document.querySelector('.steps-section__navigation'),
      },
    );
  });

  addImagesAnimation();
  createHeader();
}

function addImagesAnimation() {
  document
    .querySelectorAll(
      '.support-intro__image, .support-info__image, .step-grid__image',
    )
    .forEach((item) => {
      item.classList.add('visible_none');

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          item.classList.add('opacity-animate');

          observer.disconnect();
        }
      });

      observer.observe(item);
    });
}

function onObserved(selector, callback) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.disconnect();
      }
    });
  });

  document.querySelectorAll(selector).forEach((item) => observer.observe(item));
}

export function createHeader() {
  onEvent(() => {
    const header = document.querySelector('.header');
    const height = header.offsetHeight;

    if (window.scrollY > height) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, 'scroll');
}
