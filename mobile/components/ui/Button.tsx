import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? "#3B82F6" : "#FFFFFF"}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`text_${size}`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#3B82F6",
  },
  secondary: {
    backgroundColor: "#6B7280",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  danger: {
    backgroundColor: "#EF4444",
  },
  disabled: {
    opacity: 0.5,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: 12,
  },
  size_md: {
    height: 48,
    paddingHorizontal: 16,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: 24,
  },
  text: {
    fontWeight: "600",
  },
  text_primary: {
    color: "#FFFFFF",
  },
  text_secondary: {
    color: "#FFFFFF",
  },
  text_outline: {
    color: "#3B82F6",
  },
  text_danger: {
    color: "#FFFFFF",
  },
  text_sm: {
    fontSize: 14,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 18,
  },
});
