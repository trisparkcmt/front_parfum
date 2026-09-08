'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * PageTransition: Framer Motion page transitions
 * 
 * Wrap page content to add smooth enter/exit animations
 * with different transition variants.
 * 
 * @example
 * <PageTransition variant="slideInRight">
 *   <YourPageContent />
 * </PageTransition>
 */

export type TransitionVariant =
  | 'fadeInUp'
  | 'fadeInDown'
  | 'slideInRight'
  | 'slideInLeft'
  | 'scaleIn'
  | 'rotateIn'
  | 'expandIn';

const transitionVariants: Record<TransitionVariant, Variants> = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 40 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  rotateIn: {
    initial: { opacity: 0, rotate: -10 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: -10 },
  },
  expandIn: {
    initial: { opacity: 0, scale: 0.9, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 10 },
  },
};

export interface PageTransitionProps {
  children: ReactNode;
  variant?: TransitionVariant;
  duration?: number;
  delay?: number;
  className?: string;
}

export function PageTransition({
  children,
  variant = 'fadeInUp',
  duration = 0.4,
  delay = 0,
  className,
}: PageTransitionProps) {
  const getVariant = transitionVariants[variant];

  return (
    <motion.div
      initial={getVariant.initial as any}
      animate={getVariant.animate as any}
      exit={getVariant.exit as any}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer: Stagger children animations
 * 
 * Animates children sequentially with staggering
 * 
 * @example
 * <StaggerContainer>
 *   <motion.div>Item 1</motion.div>
 *   <motion.div>Item 2</motion.div>
 * </StaggerContainer>
 */
export interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  variant?: TransitionVariant;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
  variant = 'fadeInUp',
}: StaggerContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = transitionVariants[variant];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {Array.isArray(children) &&
        children.map((child, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {child}
          </motion.div>
        ))}
      {!Array.isArray(children) && children}
    </motion.div>
  );
}

/**
 * TransitionLink: Link with page transition on navigation
 * 
 * Automatically adds transition animation when navigating
 */
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  variant?: TransitionVariant;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
}

export function TransitionLink({
  href,
  children,
  variant = 'slideInRight',
  className,
  activeClassName,
  exact = false,
}: TransitionLinkProps) {
  const getVariant = transitionVariants[variant];

  return (
    <Link href={href} className={className}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </Link>
  );
}

/**
 * Accordion Animation: Smooth expand/collapse
 */
export interface AccordionItemProps {
  isOpen: boolean;
  children: ReactNode;
}

export function AnimatedAccordion({ isOpen, children }: AccordionItemProps) {
  return (
    <motion.div
      initial={false}
      animate={{ height: isOpen ? 'auto' : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      style={{ overflow: 'hidden' }}
    >
      <motion.div
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * Hover Animation Wrapper
 */
export interface HoverAnimationProps {
  children: ReactNode;
  scale?: number;
  rotation?: number;
  className?: string;
  duration?: number;
}

export function HoverAnimation({
  children,
  scale = 1.05,
  rotation = 0,
  className,
  duration = 0.2,
}: HoverAnimationProps) {
  return (
    <motion.div
      whileHover={{ scale, rotate: rotation }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, duration }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll Progress Bar
 */
export function ScrollProgress() {
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold to-gold/50 origin-left z-50"
      style={{
        scaleX: 0,
      }}
      animate={{
        scaleX: [0, 0.5, 1],
      }}
      transition={{
        duration: 2,
        ease: 'easeInOut',
      }}
    />
  );
}

/**
 * Floating Action Button Animation
 */
export interface FloatingActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function FloatingActionButton({
  children,
  onClick,
  className,
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        y: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/**
 * Skeleton Loading Animation
 */
export function SkeletonAnimation({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('bg-white/10 rounded', className)}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
