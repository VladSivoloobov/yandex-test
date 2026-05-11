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
   *  dragMultiplier: number
   * }} options
   */
  constructor(element, options) {
    this.element = element;
    this.options = options;

    this.currentSlide = 0;
    this.totalSlides = Math.floor(
      element.querySelectorAll('.slider__slide').length / options.slidePerView,
    );
    this.currentTransform = 0;

    this.wrapper = element.querySelector('.slider__inner');
    this.slides = this.wrapper.querySelectorAll('.slider__slide');

    this.nextButton = this.options.navigation.querySelector('.navigate_right');
    this.prevButton = this.options.navigation.querySelector('.navigate_left');

    this.#configure();
  }

  #configure() {
    this.#setChildrenWidth();
    this.#updatePagination();
    this.#setDragEvents();
    this.#setNoDraggableForImgs();

    if (this.options.navigation) {
      this.#createNavigation();
    }
  }

  #setNoDraggableForImgs() {
    const imgs = this.wrapper.querySelectorAll('img');

    imgs.forEach((img) =>
      img.setAttribute('draggable', this.options.draggable ?? false),
    );
  }

  #createNavigation() {
    this.nextButton.addEventListener('click', () => this.nextSlide());
    this.prevButton.addEventListener('click', () => this.prevSlide());
  }

  #updatePagination() {
    if (!this.options.pagination) return;
    const currentCounter = this.options.pagination.querySelector(
      '.slider-pagination__current',
    );
    const totalCounter = this.options.pagination.querySelector(
      '.slider-pagination__total',
    );

    currentCounter.textContent = this.currentSlide + 1;
    totalCounter.textContent = this.totalSlides;
  }

  /**
   * Go to slide
   * @param {number} slideNumber
   */
  changeSlide(slideNumber) {
    if (slideNumber > this.totalSlides - 1) {
      this.currentSlide = this.totalSlides - 1;
    } else if (slideNumber < 0) {
      this.currentSlide = 0;
    } else {
      this.currentSlide = slideNumber;
    }

    console.log(this.currentSlide, this.totalSlides);

    if (this.currentSlide === 0) {
      this.prevButton.setAttribute('disabled', true);
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.currentSlide === this.totalSlides - 1) {
      this.nextButton.setAttribute('disabled', true);
    } else {
      this.nextButton.removeAttribute('disabled');
    }

    this.#updatePagination();
    this.#updateVisibleClasses();

    this.currentTransform =
      -this.currentSlide *
      (this.options.slidePerView * (this.slideWidth + this.options.gap));

    this.wrapper.style.transform = `translateX(${this.currentTransform}px)`;
  }

  #updateVisibleClasses() {
    const slides = Array.from(this.slides);

    const visibleSlides = slides.slice(
      this.currentSlide,
      this.currentSlide + this.options.slidePerView,
    );

    console.log(this.currentSlide);

    this.slides.forEach((item) => item.classList.remove('visible'));
    visibleSlides.forEach((item) => item.classList.add('visible'));
  }

  /**
   * Go to next slide
   */
  nextSlide() {
    this.changeSlide(this.currentSlide + 1);
  }

  /**
   * Go to prev slide
   */
  prevSlide() {
    this.changeSlide(this.currentSlide - 1);
  }

  /**
   * Set equal width for children
   */
  #setChildrenWidth() {
    onEvent(() => {
      const wrapperWidth = this.element.offsetWidth;
      this.slideWidth =
        wrapperWidth / this.options.slidePerView - this.options.gap;

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
    const multiplier = this.options.dragMultiplier || 1;
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
