// client/src/components/Logo.tsx
// Usage:
//   <Logo />                    — wordmark (default)
//   <Logo variant="mark" />     — square RC mark
//   <Logo variant="mark" size={40} />  — custom size

const serif = "'Georgia', 'Times New Roman', serif";

interface LogoProps {
  variant?: "wordmark" | "mark";
  size?: number;
  className?: string;
  onClick?: () => void;
}

export function Logo({ variant = "wordmark", size, className, onClick }: LogoProps) {
  if (variant === "mark") {
    const s = size ?? 36;
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default", flexShrink: 0 }}
      >
        <rect width="200" height="200" fill="#1A1A1B" />
        <rect x="0.5" y="0.5" width="199" height="199" fill="none" stroke="#C05746" strokeWidth="1" />
        <text
          x="100" y="128"
          textAnchor="middle"
          fontSize="96"
          fontWeight="700"
          fill="#F5F2ED"
          fontFamily={serif}
        >R</text>
        <text
          x="148" y="128"
          textAnchor="middle"
          fontSize="96"
          fontWeight="700"
          fill="#C05746"
          fontFamily={serif}
        >C</text>
      </svg>
    );
  }

  // Wordmark
  const height = size ?? 35;
  const scale = height / 100;
  const width = Math.round(480 * scale);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 480 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default", flexShrink: 0 }}
    >
      <rect x="20" y="12" width="3" height="76" fill="#C05746" />
      <text
        x="40" y="54"
        fontSize="42"
        fontWeight="700"
        fill="#F5F2ED"
        fontFamily={serif}
      >Re</text>
      <text
        x="108" y="54"
        fontSize="42"
        fontWeight="700"
        fill="#C05746"
        fontFamily={serif}
      >Content</text>
      <text
        x="42" y="72"
        fontSize="8"
        fill="rgba(245,242,237,0.35)"
        fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="4"
      >CONTENT INFRASTRUCTURE</text>
    </svg>
  );
}
export default Login;