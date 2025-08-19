import React from 'react';
import { Card, CardProps, styled, alpha } from '@mui/material';
import { motion, HTMLMotionProps } from 'framer-motion';
import { glassStyles } from '../../theme/theme';

type GlassVariant = 'light' | 'medium' | 'dark';

interface GlassCardProps extends Omit<CardProps, 'variant' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: GlassVariant;
  animate?: boolean;
  hoverEffect?: boolean;
}

const StyledGlassCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'glassVariant' && prop !== 'hoverEffect',
})<{ glassVariant: GlassVariant; hoverEffect: boolean }>(({ theme, glassVariant, hoverEffect }) => ({
  ...glassStyles[glassVariant],
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: hoverEffect ? 'pointer' : 'default',
  
  ...(hoverEffect && {
    '&:hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
      background: glassVariant === 'light' 
        ? 'rgba(255, 255, 255, 0.9)'
        : glassVariant === 'medium'
        ? 'rgba(255, 255, 255, 0.7)'
        : 'rgba(255, 255, 255, 0.5)',
    },
  }),
}));

const MotionCard = motion(StyledGlassCard, {
  forwardMotionProps: true,
});

const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'light',
  animate = true,
  hoverEffect = true,
  children,
  ...props
}) => {
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut' },
        whileHover: hoverEffect ? { scale: 1.02 } : undefined,
      }
    : {};

  const CardComponent = animate ? MotionCard : StyledGlassCard;

  return (
    <CardComponent
      glassVariant={variant}
      hoverEffect={hoverEffect}
      {...(animate ? animationProps : {})}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

export default GlassCard;