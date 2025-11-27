import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const ClockIcon = () => {
  return (
    <Svg width="40" height="40" viewBox="0 0 30 30" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.51501 14.9084C3.51501 23.4901 6.3647 26.3515 14.9113 26.3515C23.4579 26.3515 26.3076 23.4901 26.3076 14.9084C26.3076 6.32677 23.4579 3.46539 14.9113 3.46539C6.3647 3.46539 3.51501 6.32677 3.51501 14.9084Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M19.088 17.4049L14.9102 14.9023V9.50739" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};
