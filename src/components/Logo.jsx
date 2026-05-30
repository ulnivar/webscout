export default function Logo({ size = 32, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* SVG Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle
          cx="14"
          cy="14"
          r="10"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Inner dot */}
        <circle cx="14" cy="14" r="3.5" fill="#6366f1" />
        {/* Scout line going to top-right */}
        <line
          x1="21"
          y1="21"
          x2="29"
          y2="29"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Signal arcs */}
        <path
          d="M20.5 7.5 A9 9 0 0 1 20.5 20.5"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M23.5 4.5 A13 13 0 0 1 23.5 23.5"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.2"
        />
      </svg>

      {/* Text */}
      {showText && (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '20px',
          letterSpacing: '-0.5px',
          color: 'var(--text)',
          lineHeight: 1,
        }}>
          Web<span style={{ color: 'var(--accent)' }}>Scout</span>
        </span>
      )}
    </div>
  );
}
