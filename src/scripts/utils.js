/**
 * This function call callback now
 * and add it to event listeners.
 * @param {() => void} callback
 * @param {K extends of keyof WindowEventMap} event
 */
export function onEvent(callback, event) {
  callback();
  window.addEventListener(event, callback);
}
