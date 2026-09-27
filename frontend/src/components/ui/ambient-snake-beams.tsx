import { motion } from "framer-motion";

export const AmbientSnakeBeams = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
      {/* Left Flowing Warm White Light Trail */}
      <div className="hidden lg:block absolute left-2 xl:left-8 2xl:left-16 top-[85vh] bottom-20 w-24">
        <svg
          className="h-full w-full opacity-65"
          viewBox="0 0 100 1200"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* Subtle background static guide path */}
          <path
            d="M 50 0 Q 80 150, 50 300 T 50 600 T 50 900 T 50 1200"
            stroke="rgba(250, 248, 245, 0.08)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* Animated Glowing Warm White Snake Stream 1 */}
          <motion.path
            d="M 50 0 Q 80 150, 50 300 T 50 600 T 50 900 T 50 1200"
            stroke="url(#snake-grad-left-white-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathOffset: 0 }}
            animate={{ pathOffset: [0, 1] }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              pathLength: 0.25,
            }}
          />

          {/* Animated Glowing Warm Cream Stream 2 */}
          <motion.path
            d="M 50 0 Q 20 150, 50 300 T 50 600 T 50 900 T 50 1200"
            stroke="url(#snake-grad-left-white-2)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathOffset: 0.5 }}
            animate={{ pathOffset: [0.5, 1.5] }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              pathLength: 0.18,
            }}
          />

          {/* Warm White Gradients */}
          <defs>
            <linearGradient id="snake-grad-left-white-1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FAF8F5" stopOpacity="0" />
              <stop offset="50%" stopColor="#F5F2EB" stopOpacity="0.4" />
              <stop offset="90%" stopColor="#FAF8F5" stopOpacity="1" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="snake-grad-left-white-2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EAE5D9" stopOpacity="0" />
              <stop offset="70%" stopColor="#FAF8F5" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Ambient Glowing Warm White Light Orb on Left */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#FAF8F5] shadow-[0_0_24px_8px_rgba(250,248,245,0.7)]"
          animate={{
            y: [0, 400, 800, 1200],
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1.35, 1, 0.6],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Right Flowing Warm White Light Trail */}
      <div className="hidden lg:block absolute right-2 xl:right-8 2xl:right-16 top-[85vh] bottom-20 w-24">
        <svg
          className="h-full w-full opacity-65"
          viewBox="0 0 100 1200"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* Subtle background static guide path */}
          <path
            d="M 50 0 Q 20 150, 50 300 T 50 600 T 50 900 T 50 1200"
            stroke="rgba(250, 248, 245, 0.08)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* Animated Glowing Warm White Stream 1 */}
          <motion.path
            d="M 50 0 Q 20 150, 50 300 T 50 600 T 50 900 T 50 1200"
            stroke="url(#snake-grad-right-white-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathOffset: 0.2 }}
            animate={{ pathOffset: [0.2, 1.2] }}
            transition={{
              duration: 8.5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              pathLength: 0.22,
            }}
          />

          {/* Animated Glowing Stream 2 */}
          <motion.path
            d="M 50 0 Q 80 150, 50 300 T 50 600 T 50 900 T 50 1200"
            stroke="url(#snake-grad-right-white-2)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathOffset: 0.7 }}
            animate={{ pathOffset: [0.7, 1.7] }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              pathLength: 0.16,
            }}
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="snake-grad-right-white-1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FAF8F5" stopOpacity="0" />
              <stop offset="50%" stopColor="#F5F2EB" stopOpacity="0.45" />
              <stop offset="90%" stopColor="#FAF8F5" stopOpacity="1" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="snake-grad-right-white-2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EAE5D9" stopOpacity="0" />
              <stop offset="80%" stopColor="#FAF8F5" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Ambient Glowing Light Orb on Right */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#FAF8F5] shadow-[0_0_24px_8px_rgba(250,248,245,0.7)]"
          animate={{
            y: [1200, 800, 400, 0],
            opacity: [0, 1, 1, 0],
            scale: [0.6, 1.3, 1, 0.7],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Diagonal Subtle Warm White Light Rays in the margins */}
      <motion.div
        className="hidden xl:block absolute left-10 top-[120vh] w-48 h-96 bg-gradient-to-b from-[#FAF8F5]/[0.03] to-transparent rotate-12 blur-3xl"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scaleY: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="hidden xl:block absolute right-10 top-[170vh] w-48 h-96 bg-gradient-to-b from-[#FAF8F5]/[0.03] to-transparent -rotate-12 blur-3xl"
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scaleY: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
