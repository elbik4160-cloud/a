import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const baseStyle = [
    styles.base,
    styles[`${size}Size`],
    styles[`${variant}Variant`],
    disabled && styles.disabled,
    style,
  ];

  const textColor = [
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={baseStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#3b82f6"} />
      ) : (
        <>
          {icon}
          <Text style={textColor}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 8,
  },
  // Sizes
  smSize: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  mdSize: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  lgSize: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  // Variants
  primaryVariant: {
    backgroundColor: "#3b82f6",
  },
  secondaryVariant: {
    backgroundColor: "#262626",
  },
  outlineVariant: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  ghostVariant: {
    backgroundColor: "transparent",
  },
  // Text colors
  primaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  outlineText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "600",
  },
  ghostText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#666",
  },
});
