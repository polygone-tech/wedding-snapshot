import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fc791a',
        headerStyle: {
          backgroundColor: '#e1edfd',
        },
        headerShadowVisible: false,
        headerTintColor: '#eacab3',
        tabBarStyle: {
          backgroundColor: '#e1edfd',
        },
      }}
    >
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Caméra',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'camera-sharp' : 'camera-outline'} color={color} size={24} />
          ),
          
        }}
      />
      <Tabs.Screen
        name="download"
        options={{
          title: 'Téléchargement',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'download-sharp' : 'download-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
