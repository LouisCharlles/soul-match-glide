export function BondingLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main heart shape */}
      <path
        d="M50 85C50 85 15 65 15 40C15 30 20 20 30 20C37 20 43 25 50 32C57 25 63 20 70 20C80 20 85 30 85 40C85 65 50 85 50 85Z"
        fill="#D71D29"
        stroke="#ffffff"
        strokeWidth="2"
      />
      
      {/* Decorative ribbon/bow loops - Left side */}
      <path
        d="M25 35C25 35 20 30 20 25C20 22 22 20 25 20C27 20 28 21 28 23C28 26 26 29 25 35Z"
        fill="#B01520"
        stroke="#ffffff"
        strokeWidth="1"
      />
      
      {/* Decorative ribbon/bow loops - Right side */}
      <path
        d="M75 35C75 35 80 30 80 25C80 22 78 20 75 20C73 20 72 21 72 23C72 26 74 29 75 35Z"
        fill="#B01520"
        stroke="#ffffff"
        strokeWidth="1"
      />
      
      {/* Center bow knot */}
      <ellipse cx="50" cy="25" rx="8" ry="6" fill="#B01520" stroke="#ffffff" strokeWidth="1" />
      
      {/* Ribbon tails - Left */}
      <path
        d="M42 28L35 45C35 45 33 48 30 47C28 46 28 43 30 42L38 30"
        fill="#B01520"
        stroke="#ffffff"
        strokeWidth="1"
      />
      
      {/* Ribbon tails - Right */}
      <path
        d="M58 28L65 45C65 45 67 48 70 47C72 46 72 43 70 42L62 30"
        fill="#B01520"
        stroke="#ffffff"
        strokeWidth="1"
      />
      
      {/* Decorative curves inside heart */}
      <path
        d="M35 45C35 45 40 50 50 60C60 50 65 45 65 45"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
      
      {/* Shine effect */}
      <ellipse 
        cx="35" 
        cy="35" 
        rx="8" 
        ry="12" 
        fill="#ffffff" 
        opacity="0.2" 
        transform="rotate(-30 35 35)"
      />
    </svg>
  );
}

export function BondingLogoSmall({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Simplified version for small sizes */}
      <path
        d="M50 85C50 85 15 65 15 40C15 30 20 20 30 20C37 20 43 25 50 32C57 25 63 20 70 20C80 20 85 30 85 40C85 65 50 85 50 85Z"
        fill="#D71D29"
        stroke="#ffffff"
        strokeWidth="3"
      />
      <ellipse cx="50" cy="25" rx="10" ry="8" fill="#B01520" stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}
