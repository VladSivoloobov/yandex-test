document.addEventListener('DOMContentLoaded', main);

function main() {
  onObserved('.scrolling-text', async () => {
    const { createScrollingText } = await import('./scrolling-text.js');

    const scrollingTextElements = document.querySelectorAll('.scrolling-text');

    scrollingTextElements.forEach((item) => {
      createScrollingText(item);
    });
  });

  window.addEventListener(
    'scroll',
    async () => {
      const header = document.querySelector('.header');
      const { createHeader } = await import('./header.js');

      createHeader(header);
    },
    { once: true },
  );

  onObserved('.members-section__members-slider', async () => {
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
    });
  });

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
