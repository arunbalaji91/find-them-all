
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function testFirestoreConnection() {
    console.log('Testing Firestore connection...\n');

    try {
        // Test 1: Read users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        console.log(`✅ Users collection: ${usersSnapshot.size} document(s)`);

        // Test 2: Read rooms
        const roomsRef = collection(db, 'rooms');
        const roomsSnapshot = await getDocs(roomsRef);
        console.log(`✅ Rooms collection: ${roomsSnapshot.size} document(s)`);

        // Test 3: Read agentState
        const agentStateRef = collection(db, 'agentState');
        const agentStateSnapshot = await getDocs(agentStateRef);
        console.log(`✅ AgentState collection: ${agentStateSnapshot.size} document(s)`);

        // Show room details
        roomsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\n📦 Room: ${doc.id}`);
            console.log(`   Name: ${data.name}`);
            console.log(`   Status: ${data.status}`);
            console.log(`   Agent Message: ${data.agentMessage}`);
        });

        console.log('\n✅ All Firestore tests passed!');
        return true;

    } catch (error) {
        console.error('❌ Firestore test failed:', error);
        return false;
    }
}