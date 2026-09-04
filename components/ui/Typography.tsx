'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Typography System: Consistent heading and text hierarchy
 * 
 * Provides standardized typography components for consistent
 * hierarchy, spacing, and styling across the app.
 * 
 * Usage:
 * - H1: Page titles
 * - H2: Section titles
 * - H3: Subsection titles
 * - H4-H6: Minor headings
 * - Body: Paragraphs
 * - Small: Helper text, captions
 * - Code: Code snippets
 */

// ─── Headings ───────────────────────────────────────────────────────────────

export interface HeadingProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function H1({ children, className, id }: HeadingProps) {
  return (
    <h1
      id={id}
      className={cn(
        'text-4xl md:text-5xl font-bold tracking-tight text-foreground',
        'mb-4 leading-tight',
        className
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className, id }: HeadingProps) {
  return (
    <h2
      id={id}
      className={cn(
        'text-3xl md:text-4xl font-bold tracking-tight text-foreground',
        'mb-3 mt-6 leading-tight',
        className
      )}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className, id }: HeadingProps) {
  return (
    <h3
      id={id}
      className={cn(
        'text-2xl md:text-3xl font-bold tracking-tight text-foreground',
        'mb-2 mt-4 leading-tight',
        className
      )}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className, id }: HeadingProps) {
  return (
    <h4
      id={id}
      className={cn(
        'text-lg md:text-xl font-bold text-foreground',
        'mb-2 mt-3 leading-snug',
        className
      )}
    >
      {children}
    </h4>
  );
}

export function H5({ children, className, id }: HeadingProps) {
  return (
    <h5
      id={id}
      className={cn(
        'text-base md:text-lg font-semibold text-foreground',
        'mb-2 mt-2 leading-snug',
        className
      )}
    >
      {children}
    </h5>
  );
}

export function H6({ children, className, id }: HeadingProps) {
  return (
    <h6
      id={id}
      className={cn(
        'text-sm md:text-base font-semibold uppercase tracking-wider text-foreground/80',
        'mb-2 mt-2 leading-snug',
        className
      )}
    >
      {children}
    </h6>
  );
}

// ─── Body Text ───────────────────────────────────────────────────────────────

export interface BodyProps {
  children: ReactNode;
  className?: string;
}

export function Body({ children, className }: BodyProps) {
  return (
    <p
      className={cn(
        'text-base leading-relaxed text-foreground',
        'mb-4',
        className
      )}
    >
      {children}
    </p>
  );
}

export function BodyLarge({ children, className }: BodyProps) {
  return (
    <p
      className={cn(
        'text-lg leading-relaxed text-foreground',
        'mb-4',
        className
      )}
    >
      {children}
    </p>
  );
}

export function BodySmall({ children, className }: BodyProps) {
  return (
    <p
      className={cn(
        'text-sm leading-relaxed text-foreground/80',
        'mb-3',
        className
      )}
    >
      {children}
    </p>
  );
}

// ─── Label & Caption ────────────────────────────────────────────────────────

export interface LabelProps {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  required?: boolean;
}

export function Label({ children, className, htmlFor, required }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-semibold text-foreground',
        'inline-block mb-2',
        className
      )}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export function Caption({ children, className }: BodyProps) {
  return (
    <p
      className={cn(
        'text-xs leading-relaxed text-foreground/60',
        'mb-2',
        className
      )}
    >
      {children}
    </p>
  );
}

export function Helper({ children, className }: BodyProps) {
  return (
    <p
      className={cn(
        'text-xs leading-relaxed text-foreground/50',
        'mt-1',
        className
      )}
    >
      {children}
    </p>
  );
}

// ─── Code & Monospace ───────────────────────────────────────────────────────

export function Code({ children, className }: BodyProps) {
  return (
    <code
      className={cn(
        'font-mono text-sm bg-white/5 border border-white/10 rounded px-2 py-1',
        'text-amber-400',
        className
      )}
    >
      {children}
    </code>
  );
}

export function CodeBlock({ children, className }: BodyProps) {
  return (
    <pre
      className={cn(
        'font-mono text-xs bg-black/20 border border-white/10 rounded-lg p-4',
        'overflow-x-auto leading-relaxed text-amber-300',
        'mb-4',
        className
      )}
    >
      <code>{children}</code>
    </pre>
  );
}

// ─── Lists ──────────────────────────────────────────────────────────────────

export interface ListProps {
  children: ReactNode;
  className?: string;
}

export function UnorderedList({ children, className }: ListProps) {
  return (
    <ul
      className={cn(
        'list-disc list-inside space-y-2 mb-4',
        'text-foreground leading-relaxed',
        className
      )}
    >
      {children}
    </ul>
  );
}

export function OrderedList({ children, className }: ListProps) {
  return (
    <ol
      className={cn(
        'list-decimal list-inside space-y-2 mb-4',
        'text-foreground leading-relaxed',
        className
      )}
    >
      {children}
    </ol>
  );
}

export function ListItem({ children, className }: BodyProps) {
  return <li className={cn('text-foreground', className)}>{children}</li>;
}

// ─── Emphasis ───────────────────────────────────────────────────────────────

export function Strong({ children, className }: BodyProps) {
  return (
    <strong className={cn('font-semibold text-foreground', className)}>
      {children}
    </strong>
  );
}

export function Emphasis({ children, className }: BodyProps) {
  return <em className={cn('italic', className)}>{children}</em>;
}

export function Mark({ children, className }: BodyProps) {
  return (
    <mark className={cn('bg-gold/20 text-gold px-1 rounded', className)}>
      {children}
    </mark>
  );
}

// ─── Blockquote ─────────────────────────────────────────────────────────────

export function Blockquote({ children, className }: BodyProps) {
  return (
    <blockquote
      className={cn(
        'border-l-4 border-gold/30 pl-4 py-2 italic text-foreground/70',
        'my-4',
        className
      )}
    >
      {children}
    </blockquote>
  );
}

// ─── Divider ────────────────────────────────────────────────────────────────

export interface DividerProps {
  className?: string;
  variant?: 'subtle' | 'prominent';
}

export function Divider({ className, variant = 'subtle' }: DividerProps) {
  return (
    <hr
      className={cn(
        'my-6',
        variant === 'subtle' ? 'border-white/5' : 'border-white/10',
        className
      )}
    />
  );
}
