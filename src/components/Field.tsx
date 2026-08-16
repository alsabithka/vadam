// The Onam paddy-field stage: golden-hour sky, a dense tropical tree line,
// coconut palms and banana leaves framing the edges, and a wet muddy ground
// with clay streaks and shimmering puddles.
export default function Field() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* golden-hour sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #f7c66b 0%, #f0a54e 32%, #d98a44 52%, #7a8a3a 62%)",
        }}
      />
      {/* hazy sun glow */}
      <div
        className="absolute"
        style={{
          top: "4%",
          left: "50%",
          width: "46vmax",
          height: "46vmax",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle, rgba(255,240,200,0.9), rgba(255,220,150,0) 60%)",
        }}
      />

      {/* distant tree line */}
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="absolute"
        style={{ top: "46%", left: 0, width: "100%", height: "22%" }}
      >
        <path
          d="M0 120 Q120 40 240 90 T520 70 Q680 20 820 80 T1120 60 Q1300 30 1440 90 L1440 200 L0 200 Z"
          fill="#2f5518"
          opacity="0.92"
        />
        <path
          d="M0 150 Q200 90 420 130 T900 120 T1440 140 L1440 200 L0 200 Z"
          fill="#1c3d16"
        />
      </svg>

      {/* muddy paddy ground */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "46%",
          background:
            "linear-gradient(180deg, #7a4a25 0%, #6b3f22 40%, #55321a 100%)",
        }}
      >
        {/* wet clay streaks */}
        <div
          className="absolute inset-0 opacity-70 mix-blend-multiply"
          style={{
            backgroundImage:
              "repeating-linear-gradient(96deg, rgba(74,41,21,0.5) 0 3px, transparent 3px 26px), repeating-linear-gradient(84deg, rgba(154,90,48,0.4) 0 2px, transparent 2px 34px)",
          }}
        />
        {/* reddish clay tint patches */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 25% 30%, rgba(140,60,30,0.5), transparent 45%), radial-gradient(ellipse at 72% 55%, rgba(120,55,28,0.45), transparent 40%)",
          }}
        />
        {/* puddle highlights */}
        <div
          className="absolute rounded-[50%]"
          style={{
            left: "18%",
            top: "55%",
            width: "160px",
            height: "34px",
            background:
              "radial-gradient(ellipse, rgba(247,220,150,0.55), transparent 70%)",
            animation: "puddle-shimmer 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-[50%]"
          style={{
            right: "22%",
            top: "42%",
            width: "130px",
            height: "26px",
            background:
              "radial-gradient(ellipse, rgba(247,220,150,0.45), transparent 70%)",
            animation: "puddle-shimmer 5.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* ---- framing greenery: banana + coconut palm leaves ---- */}
      {/* top-left banana leaves */}
      <svg
        viewBox="0 0 300 300"
        className="absolute"
        style={{
          top: "-40px",
          left: "-30px",
          width: "32vw",
          maxWidth: 380,
          transformOrigin: "top left",
          animation: "leaf-sway 6s ease-in-out infinite",
          ["--sway-from" as string]: "-3deg",
          ["--sway-to" as string]: "2deg",
        }}
      >
        <g fill="#2f5518">
          <path d="M40 0 Q60 120 30 240 Q90 150 120 20 Z" />
          <path d="M90 0 Q130 110 120 250 Q160 130 170 10 Z" fill="#3c6b1f" />
          <path d="M150 0 Q210 90 240 200 Q220 90 210 0 Z" fill="#245214" />
        </g>
        <path
          d="M40 0 Q55 120 30 235"
          stroke="#7fae4a"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* top-right coconut palm fronds */}
      <svg
        viewBox="0 0 320 300"
        className="absolute"
        style={{
          top: "-30px",
          right: "-40px",
          width: "34vw",
          maxWidth: 400,
          transformOrigin: "top right",
          animation: "leaf-sway 7s ease-in-out infinite",
          ["--sway-from" as string]: "2deg",
          ["--sway-to" as string]: "-3deg",
        }}
      >
        <g stroke="#245214" strokeWidth="4" fill="none" opacity="0.95">
          <path d="M300 0 Q180 40 60 30" />
          <path d="M300 0 Q190 90 70 110" />
          <path d="M300 0 Q210 130 120 190" />
          <path d="M300 0 Q250 120 210 230" />
        </g>
        <g fill="#3c6b1f">
          <path d="M300 0 Q180 40 60 30 Q180 55 300 20 Z" />
          <path d="M300 0 Q190 90 70 110 Q190 100 300 25 Z" />
          <path d="M300 0 Q210 130 120 190 Q220 130 300 30 Z" />
        </g>
      </svg>

      {/* bottom corners: broad leaves */}
      <svg
        viewBox="0 0 260 200"
        className="absolute"
        style={{
          bottom: "-10px",
          left: "-20px",
          width: "22vw",
          maxWidth: 260,
          transformOrigin: "bottom left",
          animation: "leaf-sway 8s ease-in-out infinite",
          ["--sway-from" as string]: "-2deg",
          ["--sway-to" as string]: "2deg",
        }}
      >
        <path d="M0 200 Q40 80 160 40 Q60 120 90 200 Z" fill="#1c3d16" />
        <path d="M0 200 Q80 120 200 100 Q100 160 120 200 Z" fill="#2f5518" />
      </svg>
      <svg
        viewBox="0 0 260 200"
        className="absolute"
        style={{
          bottom: "-10px",
          right: "-20px",
          width: "22vw",
          maxWidth: 260,
          transform: "scaleX(-1)",
          transformOrigin: "bottom right",
          animation: "leaf-sway 7.5s ease-in-out infinite",
          ["--sway-from" as string]: "-2deg",
          ["--sway-to" as string]: "2deg",
        }}
      >
        <path d="M0 200 Q40 80 160 40 Q60 120 90 200 Z" fill="#1c3d16" />
        <path d="M0 200 Q80 120 200 100 Q100 160 120 200 Z" fill="#2f5518" />
      </svg>

      {/* warm vignette */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: "inset 0 0 180px rgba(60,25,5,0.55)" }}
      />
    </div>
  )
}
