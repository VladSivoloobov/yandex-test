import { onEvent } from './utils.js';

export class Slider {
  /**
   * @param {HTMLElement} element
   * @param {{
   *  navigation: HTMLElement,
   *  pagination: HTMLElement,
   *  gap: number,
   *  slidePerView: number,
   *  draggable: boolean,
   *  dragMultiplier: number,
   *  loop: boolean,
   *  auto: {
   *    delay: number
   *  }
   * }} options
   */
  constructor(
    element,
    {
      navigation,
      pagination,
      gap,
      slidePerView = 1,
      dragMultiplier = 1,
      draggable,
      loop = false,
      auto,
    },
  ) {
    this.element = element;
    this.navigation = navigation;
    this.wrapper = this.element.querySelector('.slider__inner');

    const styles = getComputedStyle(this.wrapper);
    const computedGap = parseFloat(styles.gap) || 0;

    this.slides = this.wrapper.querySelectorAll('.slider__slide');
    this.nextButton = this.navigation.querySelector('.navigate_right');
    this.prevButton = this.navigation.querySelector('.navigate_left');

    this.pagination = pagination;
    this.gap = gap || computedGap;
    this.slidePerView = slidePerView;
    this.dragMultiplier = dragMultiplier;
    this.draggable = draggable;
    this.loop = loop;
    this.auto = auto;

    this.currentSlide = 0;
    this.totalSlides = Math.floor(
      element.querySelectorAll('.slider__slide').length / this.slidePerView,
    );
    this.currentTransform = 0;

    this.#init();
  }

  #setAutoSlider() {
    setInterval(() => {
      this.nextSlide();
    }, this.auto.delay);
  }

  #init() {
    this.#setChildrenWidth();
    this.#updatePagination();
    this.#setDragEvents();
    this.#setNoDraggableForImgs();

    if (this.navigation) this.#createNavigation();

    if (this.auto?.delay) this.#setAutoSlider();
  }

  #setNoDraggableForImgs() {
    const imgs = this.wrapper.querySelectorAll('img');

    imgs.forEach((img) =>
      img.setAttribute('draggable', this.draggable ?? false),
    );
  }

  #createNavigation() {
    this.nextButton.addEventListener('click', () => this.nextSlide());
    this.prevButton.addEventListener('click', () => this.prevSlide());
  }

  #updatePagination() {
    if (!this.pagination) return;
    const currentCounter = this.pagination.querySelector(
      '.slider-pagination__current',
    );
    const totalCounter = this.pagination.querySelector(
      '.slider-pagination__total',
    );

    currentCounter.textContent = this.currentSlide + 1;
    totalCounter.textContent = this.totalSlides;
  }

  /**
   * @param {number} conditionNumber
   * @param {HTMLElement} button
   */
  #setButtonState = (conditionNumber, button) => {
    if (this.currentSlide === conditionNumber) {
      button.setAttribute('disabled', true);
    } else {
      button.removeAttribute('disabled');
    }
  };

  changeSlide(slideNumber) {
    if (slideNumber > this.totalSlides - 1) {
      this.currentSlide = this.totalSlides - 1;
    } else if (slideNumber < 0) {
      this.currentSlide = 0;
    } else {
      this.currentSlide = slideNumber;
    }

    this.#setButtonState(0, this.prevButton);
    this.#setButtonState(this.totalSlides - 1, this.nextButton);

    this.#updatePagination();
    this.#updateVisibleClasses();

    this.currentTransform =
      -this.currentSlide * (this.slidePerView * (this.slideWidth + this.gap));

    this.wrapper.style.transform = `translateX(${this.currentTransform}px)`;
  }

  #updateVisibleClasses() {
    const slides = Array.from(this.slides);

    const visibleSlides = slides.slice(
      this.currentSlide,
      this.currentSlide + this.slidePerView,
    );

    this.slides.forEach((item) => item.classList.remove('visible'));
    visibleSlides.forEach((item) => item.classList.add('visible'));
  }

  nextSlide() {
    this.changeSlide(this.currentSlide + 1);
  }

  prevSlide() {
    this.changeSlide(this.currentSlide - 1);
  }

  #setChildrenWidth() {
    onEvent(() => {
      const wrapperWidth = this.element.offsetWidth;
      this.slideWidth = wrapperWidth / this.slidePerView - this.gap;

      const maxHeight = Math.max(
        Array.from(this.slides).map((item) => item.offsetHeight),
      );

      for (const slide of this.slides) {
        slide.style.width = `${this.slideWidth}px`;
      }

      this.changeSlide(this.currentSlide);
    }, 'resize');
  }

  #setDragEvents() {
    let pointerStart = 0;
    let pointerOffset = 0;
    const multiplier = this.dragMultiplier || 1;
    const threshold = 100;

    const onPointerMove = (e) => {
      pointerOffset = (pointerStart - e.clientX) * multiplier;

      const moveX = this.currentTransform - pointerOffset;
      this.wrapper.style.transform = `translateX(${moveX}px)`;
      this.wrapper.style.transition = 'none';
    };

    this.element.addEventListener('pointerdown', (e) => {
      this.element.setPointerCapture(e.pointerId);
      pointerStart = e.clientX;

      this.element.classList.add('is_grabbed');
      this.element.addEventListener('pointermove', onPointerMove);
    });

    this.element.addEventListener('pointerup', (e) => {
      this.element.removeEventListener('pointermove', onPointerMove);
      this.element.classList.remove('is_grabbed');

      this.wrapper.style.transition = 'transform 0.3s ease';

      if (pointerOffset > threshold) {
        this.nextSlide();
      } else if (pointerOffset < -threshold) {
        this.prevSlide();
      } else {
        this.changeSlide(this.currentSlide);
      }

      pointerOffset = 0;
    });
  }
}
