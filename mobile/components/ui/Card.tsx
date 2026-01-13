import React from "react";
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: "default" | "elevated" | "gradient";
  gradientColors?: [string, string];
  headerAction?: React.ReactNode;
}

export function Card({
  children,
  title,
  subtitle,
  style,
  onPress,
  variant = "default",
  gradientColors = ["#3B82F6", "#2563EB"],
  headerAction,
}: CardProps) {
  const containerStyle = [
    styles.card,
    variant === "elevated" && styles.elevated,
    style,
  ];

  const content = (
    <>
      {(title || subtitle || headerAction) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {headerAction}
        </View>
      )}
      {children}
    </>
  );

  if (variant === "gradient") {
    const gradientContent = (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.gradientCard, style]}
      >
        {(title || subtitle) && (
          <View style={styles.header}>
            <View style={styles.headerText}>
              {title && <Text style={[styles.title, styles.gradientTitle]}>{title}</Text>}
              {subtitle && <Text style={[styles.subtitle, styles.gradientSubtitle]}>{subtitle}</Text>}
            </View>
            {headerAction}
          </View>
        )}
        {children}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          {gradientContent}
        </TouchableOpacity>
      );
    }
    return gradientContent;
  }

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={containerStyle}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  elevated: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  gradientCard: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  gradientTitle: {
    color: "#FFFFFF",
  },
  gradientSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
  },
});
