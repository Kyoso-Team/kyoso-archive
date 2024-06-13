export function disableTabbing(node: HTMLElement, condition: () => boolean) {
  let focusableElements: NodeListOf<Element> | undefined;

  function updateTabindex() {
    focusableElements?.forEach((element) => {
      if (condition()) {
        element.setAttribute('tabindex', '-1');
      } else {
        element.removeAttribute('tabindex');
      }
    });
  }

  function init() {
    focusableElements = node.querySelectorAll(
      'a, button, input, textarea, select, details, [tabindex]'
    );
    updateTabindex();
  }

  init();

  return {
    update(newCondition: () => boolean) {
      condition = newCondition;
      updateTabindex();
    },
    destroy() {
      focusableElements?.forEach((element) => {
        element.removeAttribute('tabindex');
      });
    }
  };
}
