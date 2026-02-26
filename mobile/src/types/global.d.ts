// ══════════════════════════════════════════════════════════════
// Dressly — Global Type Declarations
// ══════════════════════════════════════════════════════════════

declare const __DEV__: boolean;

declare module '*.png' {
  const value: number;
  export default value;
}

declare module '*.jpg' {
  const value: number;
  export default value;
}

declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';
  const SVGComponent: React.FC<SvgProps>;
  export default SVGComponent;
}
