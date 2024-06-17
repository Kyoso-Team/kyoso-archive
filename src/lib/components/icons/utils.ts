import type { SVGAttributes } from 'svelte/elements';

// https://github.com/lucide-icons/lucide/blob/main/packages/lucide-svelte/src/defaultAttributes.ts
export const defaultAttributes: SVGAttributes<SVGSVGElement> = {
  'xmlns': 'http://www.w3.org/2000/svg',
  'width': 24,
  'height': 24,
  'viewBox': '0 0 24 24',
  'fill': 'none',
  'stroke': 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round'
};

export const mergeClasses = <ClassType = string | undefined | null>(
  ...classes: ClassType[]
) => classes.filter((className, index, array) => {
    return Boolean(className) && array.indexOf(className) === index;
  })
  .join(' ');
