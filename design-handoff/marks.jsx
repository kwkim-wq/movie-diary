// Stars — soft green for accent
const Stars = ({ value = 0, size = 14, color = '#62D26F', max = 5, gap = 1 }) => {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
    stars.push(
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
        <defs>
          <clipPath id={`half-${i}-${size}-${color.replace('#','')}`}><rect x="0" y="0" width="12" height="24" /></clipPath>
        </defs>
        <path d="M12 2 L14.7 8.6 L21.8 9.2 L16.5 13.9 L18.1 21 L12 17.2 L5.9 21 L7.5 13.9 L2.2 9.2 L9.3 8.6 Z" fill="none" stroke={fill === 0 ? 'rgba(156,163,175,0.4)' : color} strokeWidth="1.5" />
        {fill === 1 && <path d="M12 2 L14.7 8.6 L21.8 9.2 L16.5 13.9 L18.1 21 L12 17.2 L5.9 21 L7.5 13.9 L2.2 9.2 L9.3 8.6 Z" fill={color} />}
        {fill === 0.5 && <path d="M12 2 L14.7 8.6 L21.8 9.2 L16.5 13.9 L18.1 21 L12 17.2 L5.9 21 L7.5 13.9 L2.2 9.2 L9.3 8.6 Z" fill={color} clipPath={`url(#half-${i}-${size}-${color.replace('#','')})`} />}
      </svg>
    );
  }
  return <div style={{ display: 'inline-flex', gap }}>{stars}</div>;
};

window.Stars = Stars;
