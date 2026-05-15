'use client';

import { useState, useCallback } from 'react';

export interface TweakValues {
  accent: 'default' | 'teal' | 'violet' | 'emerald' | 'onyx';
  density: 'compact' | 'regular' | 'comfy';
  card: 'default' | 'flat' | 'shadow';
}

const DEFAULTS: TweakValues = {
  accent: 'default',
  density: 'regular',
  card: 'default',
};

export function useTweaks() {
  const [values, setValues] = useState<TweakValues>(DEFAULTS);

  const setTweak = useCallback(<K extends keyof TweakValues>(key: K, val: TweakValues[K]) => {
    setValues(prev => ({ ...prev, [key]: val }));
  }, []);

  return [values, setTweak] as const;
}
