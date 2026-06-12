import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, leftIcon, rightIcon, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon && { paddingLeft: 40 }, rightIcon && { paddingRight: 40 }, style]}
          placeholderTextColor="#666"
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888",
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#fff",
  },
  leftIcon: {
    position: "absolute",
    left: 14,
  },
  rightIcon: {
    position: "absolute",
    right: 14,
  },
  error: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 6,
  },
});
