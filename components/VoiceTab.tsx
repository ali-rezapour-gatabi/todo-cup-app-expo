import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { vazirmatnFamilies } from '@/constants/fonts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useToast } from '@/components/ui/toast';
import {
  createBrowserRecognizer,
  parseNativeMessage,
  speechRecognitionHtml,
  startNativeListening,
  stopNativeListening,
  whisperService,
  type RecognitionPayload,
} from '@/utils/whisperService';

type RecorderState = 'idle' | 'recording';

export const VoiceTab = () => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { showToast } = useToast();

  const [transcript, setTranscript] = useState('');
  const [state, setState] = useState<RecorderState>('idle');
  const [isSupported, setIsSupported] = useState<boolean>(Platform.OS !== 'web' ? true : whisperService.isBrowserSupported());
  const webViewRef = useRef<WebView | null>(null);
  const browserRecognizerRef = useRef<ReturnType<typeof createBrowserRecognizer> | null>(null);
  const levelAnim = useRef(new Animated.Value(0.25)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const isRecording = state === 'recording';
  const isStartDisabled = !isSupported;

  const animateLevel = useCallback(
    (value: number) => {
      Animated.timing(levelAnim, {
        toValue: Math.max(0.05, Math.min(1, value)),
        duration: 120,
        useNativeDriver: true,
      }).start();
    },
    [levelAnim]
  );

  const startPulse = useCallback(() => {
    if (pulseLoop.current) return;
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(levelAnim, { toValue: 0.9, duration: 380, useNativeDriver: true }),
        Animated.timing(levelAnim, { toValue: 0.25, duration: 380, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }, [levelAnim]);

  const stopPulse = useCallback(() => {
    if (pulseLoop.current) {
      pulseLoop.current.stop();
      pulseLoop.current = null;
    }
    animateLevel(0.15);
  }, [animateLevel]);

  const handleResult = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      setState('idle');
      stopPulse();

      if (!trimmed) return;

      setTranscript(trimmed);
      showToast({ type: 'success', title: 'متن آماده شد', message: 'متن از صدای شما استخراج شد.' });
    },
    [showToast, stopPulse]
  );

  const handleError = useCallback(
    (message: string) => {
      stopPulse();
      setState('idle');
      showToast({ type: 'error', title: 'خطا در تشخیص صدا', message });
    },
    [showToast, stopPulse]
  );

  const handleStop = useCallback(() => {
    stopPulse();
    setState('idle');
  }, [stopPulse]);

  const cleanupListening = useCallback(() => {
    if (Platform.OS === 'web') {
      browserRecognizerRef.current?.stop();
    } else {
      stopNativeListening(webViewRef);
    }
    stopPulse();
    setState('idle');
  }, [stopPulse]);

  useEffect(() => {
    return () => {
      browserRecognizerRef.current?.dispose?.();
      cleanupListening();
    };
  }, [cleanupListening]);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    if (Platform.OS === 'web') {
      if (!browserRecognizerRef.current) {
        const recognizer = createBrowserRecognizer({
          onResult: handleResult,
          onStop: handleStop,
          onError: handleError,
        });

        if (!recognizer) {
          setIsSupported(false);
          showToast({ type: 'error', title: 'عدم پشتیبانی', message: 'مرورگر شما از تبدیل گفتار به متن پشتیبانی نمی‌کند.' });
          return;
        }
        browserRecognizerRef.current = recognizer;
      }

      try {
        browserRecognizerRef.current.start();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'شروع گوش دادن ممکن نشد.';
        handleError(message);
        return;
      }
    } else {
      startNativeListening(webViewRef);
    }

    setState('recording');
    startPulse();
  }, [handleError, handleResult, handleStop, isSupported, showToast, startPulse]);

  const stopListening = useCallback(() => {
    if (!isRecording) return;

    if (Platform.OS === 'web') {
      browserRecognizerRef.current?.stop();
    } else {
      stopNativeListening(webViewRef);
    }

    setState('idle');
    stopPulse();
  }, [isRecording, stopPulse]);

  const toggleListening = useCallback(() => {
    if (!isRecording) {
      startListening();
    } else {
      stopListening();
    }
  }, [isRecording, startListening, stopListening]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const payload: RecognitionPayload = parseNativeMessage(event);

      switch (payload.type) {
        case 'result':
          handleResult(payload.text);
          break;
        case 'error':
          handleError(payload.message);
          break;
        case 'unsupported':
          setIsSupported(false);
          handleError('این دستگاه از تبدیل گفتار به متن پشتیبانی نمی‌کند.');
          break;
        case 'stopped':
          handleStop();
          break;
      }
    },
    [handleError, handleResult, handleStop]
  );

  return (
    <View style={styles.container}>
      <View style={styles.textAreaHeader}>
        <ThemedText weight="bold" style={{ color: palette.text }}>
          متن استخراج شده
        </ThemedText>
        <ThemedText style={styles.secondaryText}>بعد از پایان صحبت، متن به صورت خودکار نمایش داده می‌شود.</ThemedText>
      </View>
      <TextInput
        multiline
        numberOfLines={5}
        value={transcript}
        onChangeText={setTranscript}
        placeholder="اینجا متن تبدیل شده از صدا نمایش داده می‌شود"
        placeholderTextColor={palette.icon}
        style={[styles.textArea, { borderColor: palette.border, color: palette.text }]}
      />

      {Platform.OS !== 'web' ? (
        <WebView
          ref={webViewRef}
          source={{ html: speechRecognitionHtml }}
          originWhitelist={['*']}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          style={styles.hiddenWebView}
        />
      ) : null}

      <View style={styles.actionsRow}>
        <View style={styles.micWrapper}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.micPulse,
              {
                backgroundColor: palette.tint,
                opacity: isRecording ? levelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) : 0,
                transform: [
                  {
                    scale: levelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.35],
                    }),
                  },
                ],
              },
            ]}
          />
          <Pressable
            disabled={isStartDisabled}
            onPress={toggleListening}
            style={({ pressed }) => [
              styles.micButton,
              {
                backgroundColor: isRecording ? palette.tint : palette.surface,
                borderColor: palette.tint,
                opacity: isStartDisabled ? 0.4 : 1,
              },
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <Mic size={28} color={isRecording ? palette.background : palette.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  actionsRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micWrapper: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micPulse: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 999,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  textAreaHeader: {
    gap: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlign: 'right',
    textAlignVertical: 'top',
    minHeight: 170,
    fontFamily: vazirmatnFamilies.regular,
  },
  secondaryText: {
    fontSize: 12,
    opacity: 0.7,
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});
