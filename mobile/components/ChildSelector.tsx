import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useChildrenStore, ChildInfo } from "@/lib/stores/children-store";

interface ChildSelectorProps {
  onChildChange?: (child: ChildInfo) => void;
}

export default function ChildSelector({ onChildChange }: ChildSelectorProps) {
  const { children, selectedChild, setSelectedChild } = useChildrenStore();

  if (children.length <= 1) return null;

  const handleSelect = (child: ChildInfo) => {
    setSelectedChild(child);
    onChildChange?.(child);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chọn con:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {children.map((child) => {
          const isSelected = selectedChild?._id === child._id;
          return (
            <TouchableOpacity
              key={child._id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => handleSelect(child)}
              activeOpacity={0.7}
            >
              {isSelected ? (
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  style={styles.chipGradient}
                >
                  <Ionicons name="person" size={14} color="#FFFFFF" />
                  <Text style={styles.chipTextSelected}>
                    {child.fullName || child.name}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.chipInner}>
                  <Ionicons name="person-outline" size={14} color="#6B7280" />
                  <Text style={styles.chipText}>
                    {child.fullName || child.name}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
    marginRight: 8,
  },
  scroll: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    overflow: "hidden",
  },
  chipSelected: {},
  chipGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    borderRadius: 20,
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  chipTextSelected: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
