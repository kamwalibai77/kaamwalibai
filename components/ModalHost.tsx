import React, { createContext, useContext, useState } from "react";
import { Modal, View, StyleSheet } from "react-native";

type ModalHostContextType = {
  open: (content: React.ReactNode) => void;
  close: () => void;
};

const ModalHostContext = createContext<ModalHostContextType | undefined>(
  undefined
);

// Imperative module-level handles (will be set by provider on mount)
let _openModal: ((c: React.ReactNode) => void) | null = null;
let _closeModal: (() => void) | null = null;

export function ModalHostProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);

  const open = (c: React.ReactNode) => {
    setContent(c);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
    setContent(null);
  };

  // export imperative functions by assigning to module-scoped variables
  _openModal = open;
  _closeModal = close;

  return (
    <ModalHostContext.Provider value={{ open, close }}>
      {children}
      <Modal
        visible={visible}
        transparent={false}
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={close}
      >
        <View style={styles.overlay}>{content}</View>
      </Modal>
    </ModalHostContext.Provider>
  );
}

export function openModal(content: React.ReactNode) {
  if (_openModal) {
    _openModal(content);
  } else {
    console.warn("ModalHost not mounted yet - openModal ignored");
  }
}

export function closeModal() {
  if (_closeModal) {
    _closeModal();
  } else {
    console.warn("ModalHost not mounted yet - closeModal ignored");
  }
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#fff" },
});
