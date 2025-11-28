export function VineDecoration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main vine stem */}
      <path
        d="M100 0 C 100 50, 80 80, 90 120 C 100 160, 120 180, 110 220 C 100 260, 80 280, 90 320 C 100 360, 110 380, 100 400"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      
      {/* Left branches */}
      <path
        d="M90 60 C 70 55, 50 60, 30 50"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M85 140 C 60 135, 40 145, 20 130"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M88 240 C 65 238, 45 250, 25 240"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M92 340 C 70 335, 50 345, 30 335"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* Right branches */}
      <path
        d="M95 100 C 120 95, 140 105, 165 95"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M115 190 C 140 185, 160 195, 180 185"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M105 280 C 130 275, 150 285, 175 275"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M95 370 C 120 365, 145 375, 170 365"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* Leaves - left side */}
      <ellipse cx="25" cy="48" rx="12" ry="6" fill="currentColor" opacity="0.3" transform="rotate(-20 25 48)" />
      <ellipse cx="15" cy="128" rx="10" ry="5" fill="currentColor" opacity="0.25" transform="rotate(-15 15 128)" />
      <ellipse cx="20" cy="238" rx="11" ry="5.5" fill="currentColor" opacity="0.3" transform="rotate(-25 20 238)" />
      <ellipse cx="25" cy="333" rx="10" ry="5" fill="currentColor" opacity="0.25" transform="rotate(-10 25 333)" />

      {/* Leaves - right side */}
      <ellipse cx="170" cy="93" rx="12" ry="6" fill="currentColor" opacity="0.3" transform="rotate(20 170 93)" />
      <ellipse cx="185" cy="183" rx="10" ry="5" fill="currentColor" opacity="0.25" transform="rotate(15 185 183)" />
      <ellipse cx="180" cy="273" rx="11" ry="5.5" fill="currentColor" opacity="0.3" transform="rotate(25 180 273)" />
      <ellipse cx="175" cy="363" rx="10" ry="5" fill="currentColor" opacity="0.25" transform="rotate(10 175 363)" />

      {/* Small accent leaves on main stem */}
      <ellipse cx="95" cy="40" rx="6" ry="3" fill="currentColor" opacity="0.4" transform="rotate(-30 95 40)" />
      <ellipse cx="105" cy="160" rx="6" ry="3" fill="currentColor" opacity="0.4" transform="rotate(30 105 160)" />
      <ellipse cx="95" cy="300" rx="6" ry="3" fill="currentColor" opacity="0.4" transform="rotate(-30 95 300)" />
    </svg>
  )
}

export function VineCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 150 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Corner vine */}
      <path
        d="M0 80 C 30 75, 50 60, 70 40 C 85 25, 95 15, 120 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M0 120 C 40 115, 70 100, 90 70 C 105 50, 115 30, 140 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      
      {/* Leaves */}
      <ellipse cx="50" cy="55" rx="10" ry="5" fill="currentColor" opacity="0.3" transform="rotate(-35 50 55)" />
      <ellipse cx="95" cy="25" rx="8" ry="4" fill="currentColor" opacity="0.25" transform="rotate(-50 95 25)" />
      <ellipse cx="30" cy="100" rx="9" ry="4.5" fill="currentColor" opacity="0.3" transform="rotate(-25 30 100)" />
      <ellipse cx="75" cy="60" rx="7" ry="3.5" fill="currentColor" opacity="0.35" transform="rotate(-40 75 60)" />
    </svg>
  )
}
