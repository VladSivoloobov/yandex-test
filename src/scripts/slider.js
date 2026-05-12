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
   *  onChange: (slider: Slider) => void,
   *  breakpoints: Record<string, { ignore?: boolean, slidePerView?: number, gap?: number }>
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
      onChange,
      breakpoints,
    },
  ) {
    this.element = element;
    this.navigation = navigation;
    this.pagination = pagination;
    this.gap = gap ?? 0;
    this.defaultGap = this.gap;
    this.defaultSlidePerView = slidePerView;
    this.slidePerView = slidePerView;
    this.dragMultiplier = dragMultiplier;
    this.draggable = draggable;
    this.loop = loop;
    this.auto = auto;
    this.onChange = onChange;
    this.breakpoints = breakpoints;

    this.wrapper = null;
    this.slides = [];
    this.dots = [];
    this.nextButton = null;
    this.prevButton = null;

    this.currentSlide = 0;
    this.currentTransform = 0;
    this.slideWidth = 0;
    this.totalSlides = 0;

    this.initialized = false;
    this.autoTimer = null;
    this.mediaQueries = [];
    this.currentBreakpointKey = null;

    this.cloneCount = 0;
    this.isTransitioning = false;
    this.transitionUnlockTimer = null;
    this.loopTransitionHandler = null;
    this.loopFallbackTimer = null;

    this.onResize = this.#handleResize.bind(this);
    this.onPointerMove = this.#handlePointerMove.bind(this);
    this.onPointerDown = this.#handlePointerDown.bind(this);
    this.onPointerUp = this.#handlePointerUp.bind(this);
    this.onNextClick = this.nextSlide.bind(this);
    this.onPrevClick = this.prevSlide.bind(this);

    this.#initNavigation();

    if (this.breakpoints) {
      this.#createMediaQueries();
    } else {
      this.#initialize();
    }
  }

  #getActiveBreakpoint() {
    return this.mediaQueries.find(({ media }) => media.matches) || null;
  }

  #applyBreakpoint() {
    const activeBreakpoint = this.#getActiveBreakpoint();
    const breakpoint = activeBreakpoint?.config || null;

    if (!breakpoint) {
      if (!this.initialized) {
        this.slidePerView = this.defaultSlidePerView;
        this.gap = this.defaultGap;
        this.currentBreakpointKey = null;
        this.#initialize();
      } else if (this.currentBreakpointKey !== null) {
        this.slidePerView = this.defaultSlidePerView;
        this.gap = this.defaultGap;
        this.currentBreakpointKey = null;
        this.#destroy();
        this.#initialize();
      }
      return;
    }

    if (breakpoint.ignore) {
      this.#destroy();
      this.currentBreakpointKey = activeBreakpoint.query;
      return;
    }

    const requestedSlidePerView =
      breakpoint.slidePerView ?? this.defaultSlidePerView;
    const requestedGap = breakpoint.gap ?? this.gap;
    const breakpointKey = activeBreakpoint.query;

    const needsReinit =
      !this.initialized ||
      this.currentBreakpointKey !== breakpointKey ||
      this.slidePerView !== requestedSlidePerView ||
      this.gap !== requestedGap;

    if (!needsReinit) {
      return;
    }

    this.slidePerView = requestedSlidePerView;
    this.gap = requestedGap;
    this.currentBreakpointKey = breakpointKey;

    if (this.initialized) {
      this.#destroy();
    }

    this.#initialize();
  }

  #createMediaQueries() {
    Object.entries(this.breakpoints).forEach(([query, config]) => {
      const media = window.matchMedia(query);
      const listener = () => this.#applyBreakpoint();

      media.addEventListener('change', listener);
      this.mediaQueries.push({ media, config, query });
    });

    this.#applyBreakpoint();
  }

  #destroy() {
    if (!this.initialized) {
      return;
    }

    window.removeEventListener('resize', this.onResize);
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerUp);

    if (this.nextButton) {
      this.nextButton.removeEventListener('click', this.onNextClick);
    }

    if (this.prevButton) {
      this.prevButton.removeEventListener('click', this.onPrevClick);
    }

    if (this.autoTimer) {
      window.clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }

    if (this.loopTransitionHandler && this.wrapper) {
      this.wrapper.removeEventListener(
        'transitionend',
        this.loopTransitionHandler,
      );
    }
    this.loopTransitionHandler = null;
    if (this.loopFallbackTimer) {
      window.clearTimeout(this.loopFallbackTimer);
      this.loopFallbackTimer = null;
    }
    if (this.transitionUnlockTimer) {
      window.clearTimeout(this.transitionUnlockTimer);
      this.transitionUnlockTimer = null;
    }
    this.isTransitioning = false;

    if (this.wrapper) {
      const clones = this.wrapper.querySelectorAll('.slider__slide_clone');
      clones.forEach((clone) => clone.remove());
      this.wrapper.style.transform = '';
      this.wrapper.style.transition = '';
    }
    this.cloneCount = 0;

    this.slides.forEach((slide) => {
      slide.style.width = '';
      slide.classList.remove('visible');
    });

    if (this.pagination) {
      const sliderDotsWrapper = this.pagination.querySelector(
        '.slider-pagination__dots',
      );

      if (sliderDotsWrapper) {
        sliderDotsWrapper.innerHTML = '';
      }

      const currentCounter = this.pagination.querySelector(
        '.slider-pagination__current',
      );
      const totalCounter = this.pagination.querySelector(
        '.slider-pagination__total',
      );

      if (currentCounter) {
        currentCounter.textContent = '';
      }

      if (totalCounter) {
        totalCounter.textContent = '';
      }
    }

    this.element.classList.remove('is_grabbed');
    this.currentSlide = 0;
    this.currentTransform = 0;
    this.initialized = false;
  }

  #initNavigation() {
    if (!this.navigation) {
      return;
    }

    this.nextButton = this.navigation.querySelector('.navigate_right');
    this.prevButton = this.navigation.querySelector('.navigate_left');
  }

  #startAutoSlide() {
    if (!this.auto?.delay) {
      return;
    }
    this.#scheduleAutoSlide();
  }

  #scheduleAutoSlide() {
    if (!this.auto?.delay) {
      return;
    }
    if (this.autoTimer) {
      window.clearTimeout(this.autoTimer);
    }
    this.autoTimer = window.setTimeout(() => {
      this.autoTimer = null;
      this.nextSlide();
    }, this.auto.delay);
  }

  #beginTransitionLock(duration) {
    this.isTransitioning = true;
    if (this.transitionUnlockTimer) {
      clearTimeout(this.transitionUnlockTimer);
    }
    this.transitionUnlockTimer = window.setTimeout(() => {
      this.transitionUnlockTimer = null;
      this.isTransitioning = false;
    }, duration);
  }

  #initialize() {
    if (this.initialized) {
      return;
    }

    this.wrapper = this.element.querySelector('.slider__inner');
    this.groupIncludes = Array.from(
      this.element.querySelectorAll('.group_include'),
    );

    this.totalSlides = Math.max(
      1,
      Math.ceil(
        this.element.querySelectorAll(
          '.slider__slide:not(.group_included):not(.slider__slide_clone)',
        ).length / this.slidePerView,
      ),
    );

    this.cloneCount = 0;
    if (this.loop && this.wrapper && this.totalSlides > 1) {
      this.#createLoopClones();
    }

    this.slides =
      this.wrapper?.querySelectorAll(
        '.slider__slide:not(.slider__slide_clone)',
      ) ?? [];

    this.#initializeSlideWidths();
    this.#attachDragEvents();
    this.#disableImageDrag();
    this.#createPaginationDots();
    this.#updatePagination();

    if (this.navigation) {
      this.#createNavigation();
    }

    if (this.auto?.delay) {
      this.#startAutoSlide();
    }

    this.initialized = true;
  }

  #createLoopClones() {
    const realSlides = Array.from(
      this.wrapper.querySelectorAll('.slider__slide:not(.slider__slide_clone)'),
    );

    if (realSlides.length === 0) {
      return;
    }

    const count = Math.min(this.slidePerView, realSlides.length);
    this.cloneCount = count;

    const headSource = realSlides.slice(-count);
    const tailSource = realSlides.slice(0, count);

    const fragmentHead = document.createDocumentFragment();
    headSource.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.classList.add('slider__slide_clone');
      clone.setAttribute('aria-hidden', 'true');
      fragmentHead.appendChild(clone);
    });
    this.wrapper.prepend(fragmentHead);

    const fragmentTail = document.createDocumentFragment();
    tailSource.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.classList.add('slider__slide_clone');
      clone.setAttribute('aria-hidden', 'true');
      fragmentTail.appendChild(clone);
    });
    this.wrapper.appendChild(fragmentTail);
  }

  #disableImageDrag() {
    if (!this.wrapper) {
      return;
    }

    const imgs = this.wrapper.querySelectorAll('img');

    imgs.forEach((img) => {
      img.setAttribute('draggable', this.draggable ?? false);
    });
  }

  #createNavigation() {
    if (!this.nextButton || !this.prevButton) {
      return;
    }

    this.nextButton.addEventListener('click', this.onNextClick);
    this.prevButton.addEventListener('click', this.onPrevClick);
  }

  #updatePagination() {
    if (!this.pagination) {
      return;
    }

    const currentCounter = this.pagination.querySelector(
      '.slider-pagination__current',
    );
    const totalCounter = this.pagination.querySelector(
      '.slider-pagination__total',
    );

    this.#updateDots();

    if (currentCounter) {
      currentCounter.textContent = String(this.currentSlide + 1);
    }

    if (totalCounter) {
      totalCounter.textContent = String(this.totalSlides);
    }
  }

  #updateDots() {
    if (!this.dots?.length) {
      return;
    }

    this.dots.forEach((item) => item.classList.remove('active'));
    const dot = this.dots[this.currentSlide];

    if (dot) {
      dot.classList.add('active');
    }
  }

  #createPaginationDots() {
    if (!this.pagination) {
      return;
    }

    const sliderDotsWrapper = this.pagination.querySelector(
      '.slider-pagination__dots',
    );

    if (!sliderDotsWrapper) {
      return;
    }

    sliderDotsWrapper.innerHTML = '';
    this.dots = Array.from({ length: this.totalSlides }, () => {
      const element = document.createElement('div');
      element.classList.add('slider-pagination__dot');
      return element;
    });

    sliderDotsWrapper.append(...this.dots);
  }

  /**
   * @param {number} conditionNumber
   * @param {HTMLElement} button
   */
  #updateButtonState(conditionNumber, button) {
    if (!this.navigation || !button) {
      return;
    }

    if (!this.loop && this.currentSlide === conditionNumber) {
      button.setAttribute('disabled', 'true');
    } else {
      button.removeAttribute('disabled');
    }
  }

  changeSlide(slideNumber) {
    const previousSlide = this.currentSlide;

    if (slideNumber > this.totalSlides - 1) {
      this.currentSlide = this.totalSlides - 1;
    } else if (slideNumber < 0) {
      this.currentSlide = 0;
    } else {
      this.currentSlide = slideNumber;
    }

    if (previousSlide !== this.currentSlide) {
      this.#beginTransitionLock(320);
      if (this.auto?.delay) {
        this.#scheduleAutoSlide();
      }
    }

    this.#updateButtonState(0, this.prevButton);
    this.#updateButtonState(this.totalSlides - 1, this.nextButton);
    this.#updatePagination();
    this.#updateVisibleClasses();

    const pageWidth = this.slidePerView * (this.slideWidth + this.gap);
    const loopOffset =
      this.cloneCount > 0 ? this.cloneCount * (this.slideWidth + this.gap) : 0;
    this.currentTransform = -loopOffset - this.currentSlide * pageWidth;

    if (this.onChange) {
      this.onChange(this);
    }

    if (this.wrapper) {
      this.wrapper.style.transform = `translateX(${this.currentTransform}px)`;
    }
  }

  #updateVisibleClasses() {
    if (!this.slides.length) {
      return;
    }

    const slides = Array.from(this.slides);
    const visibleSlides = slides.slice(
      this.currentSlide,
      this.currentSlide + this.slidePerView,
    );

    this.slides.forEach((item) => item.classList.remove('visible'));
    visibleSlides.forEach((item) => item.classList.add('visible'));
  }

  nextSlide() {
    if (this.isTransitioning) {
      return;
    }
    if (this.#shouldLoopAdvance(1)) {
      this.#loopAdvance(1);
      return;
    }
    this.changeSlide(this.currentSlide + 1);
  }

  prevSlide() {
    if (this.isTransitioning) {
      return;
    }
    if (this.#shouldLoopAdvance(-1)) {
      this.#loopAdvance(-1);
      return;
    }
    this.changeSlide(this.currentSlide - 1);
  }

  #shouldLoopAdvance(direction) {
    if (
      !this.loop ||
      this.cloneCount === 0 ||
      this.totalSlides <= 1 ||
      !this.wrapper
    ) {
      return false;
    }
    return direction > 0
      ? this.currentSlide === this.totalSlides - 1
      : this.currentSlide === 0;
  }

  #loopAdvance(direction) {
    this.isTransitioning = true;
    if (this.transitionUnlockTimer) {
      window.clearTimeout(this.transitionUnlockTimer);
      this.transitionUnlockTimer = null;
    }

    if (this.auto?.delay) {
      this.#scheduleAutoSlide();
    }

    const pageWidth = this.slidePerView * (this.slideWidth + this.gap);
    const loopOffset = this.cloneCount * (this.slideWidth + this.gap);

    const phantomSlide = direction > 0 ? this.totalSlides : -1;
    const phantomTransform = -loopOffset - phantomSlide * pageWidth;

    const targetSlide = direction > 0 ? 0 : this.totalSlides - 1;
    const targetTransform = -loopOffset - targetSlide * pageWidth;

    this.currentSlide = targetSlide;
    this.#updateButtonState(0, this.prevButton);
    this.#updateButtonState(this.totalSlides - 1, this.nextButton);
    this.#updatePagination();
    this.#updateVisibleClasses();

    this.wrapper.style.transition = 'transform 0.3s ease';
    this.wrapper.style.transform = `translateX(${phantomTransform}px)`;
    this.currentTransform = phantomTransform;

    if (this.onChange) {
      this.onChange(this);
    }

    let finished = false;
    const finish = (event) => {
      if (event && event.propertyName && event.propertyName !== 'transform') {
        return;
      }
      if (finished) {
        return;
      }
      finished = true;

      if (this.loopTransitionHandler) {
        this.wrapper.removeEventListener(
          'transitionend',
          this.loopTransitionHandler,
        );
        this.loopTransitionHandler = null;
      }
      if (this.loopFallbackTimer) {
        window.clearTimeout(this.loopFallbackTimer);
        this.loopFallbackTimer = null;
      }

      this.wrapper.style.transition = 'none';
      this.wrapper.style.transform = `translateX(${targetTransform}px)`;
      this.currentTransform = targetTransform;
      void this.wrapper.offsetWidth;
      this.wrapper.style.transition = '';
      this.isTransitioning = false;
    };

    this.loopTransitionHandler = finish;
    this.wrapper.addEventListener('transitionend', finish);
    this.loopFallbackTimer = window.setTimeout(() => finish(), 450);
  }

  #handleResize() {
    if (!this.wrapper || !this.slides.length) {
      return;
    }

    const wrapperWidth = this.element.offsetWidth;
    this.slideWidth = wrapperWidth / this.slidePerView;

    const allSlides = this.wrapper.querySelectorAll('.slider__slide');
    for (const slide of allSlides) {
      slide.style.width = `${this.slideWidth}px`;
    }

    this.changeSlide(this.currentSlide);
  }

  #initializeSlideWidths() {
    this.#handleResize();
    window.addEventListener('resize', this.onResize);
  }

  #handlePointerMove(event) {
    const pointerOffset =
      (this.pointerStart - event.clientX) * (this.dragMultiplier || 1);

    const moveX = this.currentTransform - pointerOffset;
    if (this.wrapper) {
      this.wrapper.style.transform = `translateX(${moveX}px)`;
      this.wrapper.style.transition = 'none';
    }

    this.pointerOffset = pointerOffset;
  }

  #handlePointerDown(event) {
    this.element.setPointerCapture(event.pointerId);
    this.pointerStart = event.clientX;
    this.pointerOffset = 0;

    this.element.classList.add('is_grabbed');
    this.element.addEventListener('pointermove', this.onPointerMove);
  }

  #handlePointerUp(event) {
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.classList.remove('is_grabbed');

    if (this.wrapper) {
      this.wrapper.style.transition = 'transform 0.3s ease';
    }

    if (this.pointerOffset > 100) {
      this.nextSlide();
    } else if (this.pointerOffset < -100) {
      this.prevSlide();
    } else {
      this.changeSlide(this.currentSlide);
    }

    this.pointerOffset = 0;
    this.element.releasePointerCapture(event.pointerId);
  }

  #attachDragEvents() {
    this.element.addEventListener('pointerdown', this.onPointerDown);
    this.element.addEventListener('pointerup', this.onPointerUp);
    this.element.addEventListener('pointercancel', this.onPointerUp);
  }
}
