import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface NavLink {
  label: string;
  href: string;
}

export interface AnimatedHeroProps {
  backgroundImageUrl: string;
  logo: React.ReactNode;
  navLinks: NavLink[];
  topRightAction?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  ctaButton: {
    text: string;
    onClick: () => void;
  };
  secondaryCta?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export const AnimatedHero = ({
  backgroundImageUrl,
  logo,
  navLinks,
  topRightAction,
  title,
  description,
  ctaButton,
  secondaryCta,
  className,
}: AnimatedHeroProps) => {
  const glassButtonClassName =
    "bg-[#FF6B6B]/15 backdrop-blur-md border border-[#FF6B6B]/35 text-[#FAF8F5] hover:bg-[#FF6B6B]/30 hover:border-[#FF6B6B]/60 hover:text-white transition-all font-medium rounded-full cursor-pointer";

  return (
    <div
      className={cn(
        "relative flex min-h-[92vh] w-full flex-col items-center justify-center overflow-hidden bg-[#080607]",
        className
      )}
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-[#080607]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF8F5]/[0.05] via-transparent to-[#FF6B6B]/[0.04] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#080607] via-[#080607]/90 to-transparent" />
      </div>

      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-0 z-20 flex h-20 w-full items-center justify-between px-6 md:px-12 text-[#FAF8F5]"
      >
        <div className="flex items-center gap-2">{logo}</div>
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#FAF8F5]/75 transition-colors hover:text-[#FAF8F5]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">{topRightAction}</div>
      </motion.header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-start justify-center text-left px-6 md:px-12 max-w-4xl w-full text-[#FAF8F5] pt-20 pb-12"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-normal tracking-tight text-[#FAF8F5] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.12] font-serif"
        >
          {title}
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="mt-6 max-w-2xl text-lg leading-8 text-[#E8E2D6] font-sans"
        >
          {description}
        </motion.div>
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Button
            onClick={ctaButton.onClick}
            size="lg"
            className="bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white font-semibold rounded-full shadow-xl shadow-[#FF6B6B]/30 border-none transition-all cursor-pointer active:scale-95"
          >
            {ctaButton.text}
          </Button>
          {secondaryCta && (
            <Button
              onClick={secondaryCta.onClick}
              size="lg"
              className={glassButtonClassName}
            >
              {secondaryCta.text}
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
