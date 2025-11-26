import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDocs
} from 'firebase/firestore';

export const useAgentChat = (userId, currentRoomId = null) => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    // Subscribe to all chats for this user
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        console.log('💬 Subscribing to chats for user:', userId);

        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('hostId', '==', userId),
            orderBy('lastMessageAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const chatsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const totalUnread = chatsData.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

                console.log('✅ Chats updated:', chatsData.length, 'Unread:', totalUnread);
                setChats(chatsData);
                setUnreadTotal(totalUnread);
                setLoading(false);

                // Auto-select chat for current room if provided
                if (currentRoomId && !activeChat) {
                    const roomChat = chatsData.find(chat => chat.roomId === currentRoomId);
                    if (roomChat) {
                        console.log('🎯 Auto-selecting chat for current room:', currentRoomId);
                        setActiveChat(roomChat.id);
                    }
                }
            },
            (err) => {
                console.error('❌ Chats subscription error:', err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId, currentRoomId]);

    // Auto-select when currentRoomId changes
    useEffect(() => {
        if (currentRoomId && chats.length > 0) {
            const roomChat = chats.find(chat => chat.roomId === currentRoomId);
            if (roomChat && activeChat !== roomChat.id) {
                console.log('🎯 Switching to chat for room:', currentRoomId);
                setActiveChat(roomChat.id);
            }
        }
    }, [currentRoomId, chats]);

    // Subscribe to messages for active chat
    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            return;
        }

        console.log('📨 Subscribing to messages for chat:', activeChat);

        const messagesRef = collection(db, 'chats', activeChat, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const messagesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('✅ Messages updated:', messagesData.length);
                setMessages(messagesData);
            },
            (err) => {
                console.error('❌ Messages subscription error:', err);
            }
        );

        return () => unsubscribe();
    }, [activeChat]);

    // Send message from host
    const sendMessage = async (chatId, text) => {
        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');

            await addDoc(messagesRef, {
                sender: 'host',
                text: text,
                timestamp: serverTimestamp(),
                read: true
            });

            // Update chat's last message
            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: text,
                lastMessageAt: serverTimestamp()
            });

            console.log('✅ Message sent');
        } catch (err) {
            console.error('❌ Error sending message:', err);
            throw err;
        }
    };

    // Mark messages as read
    const markAsRead = async (chatId) => {
        try {
            await updateDoc(doc(db, 'chats', chatId), {
                unreadCount: 0
            });
        } catch (err) {
            console.error('❌ Error marking as read:', err);
        }
    };

    // Get current room's chat info
    const getCurrentRoomChat = () => {
        if (!currentRoomId) return null;
        return chats.find(chat => chat.roomId === currentRoomId);
    };

    return {
        chats,
        messages,
        unreadTotal,
        loading,
        activeChat,
        setActiveChat,
        sendMessage,
        markAsRead,
        getCurrentRoomChat
    };
};