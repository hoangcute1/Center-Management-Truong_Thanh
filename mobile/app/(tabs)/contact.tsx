import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/stores";
import { LinearGradient } from "expo-linear-gradient";

// Mock data for conversations
const conversations = [
  {
    id: "1",
    name: "Cô Trần Thị B",
    role: "Giáo viên Toán",
    avatar: "B",
    lastMessage: "Em nhớ làm bài tập về nhà trang 15 nhé!",
    time: "10:30",
    unread: 2,
    online: true,
    email: "tranthib@example.com",
    phone: "0901234567"
  },
  {
    id: "2",
    name: "Thầy Lê Văn E",
    role: "Giáo viên Anh văn",
    avatar: "E",
    lastMessage: "Good job! Bài kiểm tra của em rất tốt.",
    time: "Hôm qua",
    unread: 0,
    online: false,
     email: "levane@example.com",
    phone: "0901234568"
  },
  {
    id: "3",
    name: "Thầy Nguyễn Văn F",
    role: "Giáo viên Vật lý",
    avatar: "F",
    lastMessage: "Thứ 6 tuần này lớp mình kiểm tra 1 tiết nhé.",
    time: "T2",
    unread: 0,
    online: true,
     email: "nguyenvanf@example.com",
    phone: "0901234569"
  },
];

export default function ContactScreen() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCall = (phone: string) => {
      Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (id: string, name: string) => {
      // In a real app, navigate to chat detail screen
      // router.push(`/chat/${id}`);
      console.log("Navigate to chat with", name);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput 
                style={styles.searchInput}
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
            />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContainer}>
            {filteredConversations.map((conv) => (
                <TouchableOpacity 
                    key={conv.id} 
                    style={styles.chatItem}
                    onPress={() => handleMessage(conv.id, conv.name)}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={conv.online ? ["#10B981", "#059669"] : ["#9CA3AF", "#6B7280"]}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{conv.avatar}</Text>
                        </LinearGradient>
                        {conv.online && <View style={styles.onlineBadge} />}
                    </View>
                    
                    <View style={styles.chatContent}>
                        <View style={styles.chatHeader}>
                            <Text style={styles.chatName} numberOfLines={1}>{conv.name}</Text>
                            <Text style={styles.chatTime}>{conv.time}</Text>
                        </View>
                        <View style={styles.chatFooter}>
                            <Text 
                                style={[styles.lastMessage, conv.unread > 0 && styles.lastMessageUnread]} 
                                numberOfLines={1}
                            >
                                {conv.lastMessage}
                            </Text>
                            {conv.unread > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadText}>{conv.unread}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
  },
  headerIcon: {
      padding: 8,
      backgroundColor: "#EFF6FF",
      borderRadius: 12,
  },
  searchContainer: {
      paddingHorizontal: 20,
      paddingBottom: 16,
  },
  searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: "#F3F4F6",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
  },
  searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 15,
      color: "#1F2937",
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
  },
  chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
  },
  avatarContainer: {
      position: 'relative',
      marginRight: 16,
  },
  avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
  },
  avatarText: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "bold",
  },
  onlineBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#10B981",
      borderWidth: 2,
      borderColor: "#FFFFFF",
  },
  chatContent: {
      flex: 1,
      justifyContent: 'center',
  },
  chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
  },
  chatName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: "#1F2937",
      flex: 1,
      marginRight: 8,
  },
  chatTime: {
      fontSize: 12,
      color: "#9CA3AF",
  },
  chatFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  lastMessage: {
      fontSize: 14,
      color: "#6B7280",
      flex: 1,
      marginRight: 16,
  },
  lastMessageUnread: {
      color: "#1F2937",
      fontWeight: '600',
  },
  unreadBadge: {
      backgroundColor: "#EF4444",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 20,
      alignItems: 'center',
      justifyContent: 'center',
  },
  unreadText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: 'bold',
  }
});
