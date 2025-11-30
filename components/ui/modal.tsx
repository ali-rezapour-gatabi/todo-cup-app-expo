import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  statusBarTranslucent?: boolean;
  onShow?: () => void;
  onRequestClose?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  modalStyle?: StyleProp<ViewStyle>;
}

const CustomModal = ({
  children,
  visible,
  onClose,
  animationType = 'fade',
  transparent = true,
  statusBarTranslucent = true,
  onShow,
  onRequestClose,
  contentStyle,
  modalStyle,
  ...props
}: Props) => {
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(backdropOpacity, {
      toValue: visible ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [visible, backdropOpacity]);

  const handleClose = useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
    }
    onClose();
  }, [onClose, onRequestClose]);

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={handleClose}
      statusBarTranslucent={statusBarTranslucent}
      onShow={onShow}
      {...props}
    >
      <View style={[styles.container]}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>
      </View>
      <View style={[contentStyle]}>{children}</View>
    </Modal>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
});
