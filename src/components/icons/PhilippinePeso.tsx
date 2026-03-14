interface PhilippinePesoProps {
  size?: number;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

export function PhilippinePeso({ size = 24, style, strokeWidth = 2 }: PhilippinePesoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={style}
    >
      <path d="M20 11H4"/>
      <path d="M20 7H4"/>
      <path d="M7 21V4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 12H7"/>
    </svg>
  );
}
