import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { AlertCircle, CheckCircle2, Info, Triangle, X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastOptions = {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};

type ToastItem = ToastOptions & { id: string; type: ToastType };

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = Math.random().toString(36).slice(2);
      const item: ToastItem = {
        id,
        type: options.type ?? 'info',
        ...options,
      };

      setToasts((prev) => [...prev, item]);

      const timeout = options.duration ?? 3200;
      if (timeout > 0) {
        timers.current[id] = setTimeout(() => removeToast(id), timeout);
      }
    },
    [removeToast]
  );

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <View pointerEvents="box-none" style={styles.host}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

const ToastCard = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const variant = getVariantStyles(toast.type, palette, scheme);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20, scale: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: 12, scale: 0.98 }}
      transition={{ type: 'timing', duration: 220 }}
      style={[styles.card, { backgroundColor: variant.background, borderColor: variant.border, shadowColor: variant.shadow }]}
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: variant.iconBackground }]}>
          {variant.icon}
        </View>

        <View style={styles.texts}>
          {toast.title ? (
            <ThemedText weight="bold" style={[styles.title, { color: variant.foreground }]}>
              {toast.title}
            </ThemedText>
          ) : null}
          <ThemedText style={[styles.message, { color: variant.muted }]} numberOfLines={3}>
            {toast.message}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          {toast.actionLabel && toast.onAction ? (
            <Pressable
              hitSlop={8}
              style={[styles.actionButton, { borderColor: variant.border }]}
              onPress={async () => {
                await toast.onAction?.();
                onDismiss();
              }}
            >
              <ThemedText weight="semiBold" style={[styles.actionText, { color: variant.foreground }]}>
                {toast.actionLabel}
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable hitSlop={8} onPress={onDismiss}>
            <X size={18} color={variant.muted} />
          </Pressable>
        </View>
      </View>
    </MotiView>
  );
};

const getVariantStyles = (type: ToastType, palette: (typeof Colors)['light'], scheme: 'light' | 'dark') => {
  const baseSurface = scheme === 'dark' ? palette.surface : '#FFFFFF';
  const successColor = palette.tint;
  const errorColor = '#ef4444';
  const warningColor = '#f59e0b';
  const infoColor = palette.icon;

  const variants = {
    success: {
      background: scheme === 'dark' ? palette.surface : '#f8f5ff',
      border: successColor,
      foreground: successColor,
      muted: palette.text,
      icon: <CheckCircle2 color={successColor} size={22} />,
    },
    error: {
      background: scheme === 'dark' ? '#2b1717' : '#fef2f2',
      border: errorColor,
      foreground: errorColor,
      muted: scheme === 'dark' ? '#fca5a5' : '#7f1d1d',
      icon: <AlertCircle color={errorColor} size={22} />,
    },
    warning: {
      background: scheme === 'dark' ? '#2d1f0a' : '#fffbeb',
      border: warningColor,
      foreground: warningColor,
      muted: scheme === 'dark' ? '#fcd34d' : '#92400e',
      icon: <Triangle color={warningColor} size={22} />,
    },
    info: {
      background: baseSurface,
      border: palette.border,
      foreground: palette.text,
      muted: infoColor,
      icon: <Info color={palette.text} size={22} />,
    },
  };

  const current = variants[type];

  return {
    ...current,
    shadow: current.foreground,
    iconBackground: current.border + '22',
  };
};

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
  },
});
