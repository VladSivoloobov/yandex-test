export class Slider {
  /**
   * @param {HTMLElement} element
   * @param {{
   *  navigation: HTMLElement,
   *  pagination: HTMLElement,
   *  gap: number
   * }} options
   */
  constructor(element, options) {
    this.element = element;
    this.options = options;

    this.slideWidth = element.querySelector('.slider__slide').offsetWidth;
    this.currentSlide = 1;
    this.totalSlides = element.querySelectorAll('.slider__slide').length;

    this.wrapper = element.querySelector('.slider__inner');

    this.#createNavigation();
  }

  #createNavigation() {
    const nextButton = this.options.navigation.querySelector('.navigate_right');
    const prevButton = this.options.navigation.querySelector('.navigate_left');

    nextButton.addEventListener('click', () =>
      this.changeSlide(this.currentSlide + 1),
    );

    prevButton.addEventListener('click', () => {
      this.changeSlide(this.currentSlide - 1);
    });
  }

  /**
   * Go to slide
   * @param {number} slideNumber
   */
  changeSlide(slideNumber) {
    if (slideNumber > this.totalSlides) {
      this.currentSlide = this.totalSlides;
    } else if (slideNumber < 1) {
      this.currentSlide = 1;
    }

    console.log(this.currentSlide);

    console.log(this.currentSlide * (this.slideWidth + this.options.gap));
    this.wrapper.style.transform = `translateX(-${this.currentSlide * (this.slideWidth + this.options.gap)}px)`;
  }
}
