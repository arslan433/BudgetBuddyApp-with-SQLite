import { ActivityIndicator, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system'
import { Asset } from 'expo-asset';
import { Suspense, useEffect, useState } from 'react';
import { SQLiteProvider } from 'expo-sqlite/next'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Home from './screens/Home';

const Stack = createNativeStackNavigator()

const loadDatabase = async () => {
  const dbName = "mySQLiteDB.db";
  const dbAsset = require('./assets/mySQLiteDB.db');
  const dbUri = Asset.fromModule(dbAsset).uri;
  const dbFilePath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
  const FileInfo = await FileSystem.getInfoAsync(dbFilePath)
  if (!FileInfo.exists) {
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}SQLite`,
      { intermediates: true }
    );
    await FileSystem.downloadAsync(dbUri, dbFilePath)
  }

}



export default function App() {
  let [dbLoaded, setDbloaded] = useState<boolean>(false)


  useEffect(() => {
    loadDatabase()
      .then(() => setDbloaded(true))
      .catch((e) => console.error("error in db loading ", e))
  }, [])

  if (!dbLoaded) return (
    <View style={{ flex: 1 }}>
      <ActivityIndicator size={"large"} />
      <Text>Loading...</Text>
    </View>
  )

  return (
    <NavigationContainer>
      <Suspense
        fallback={
          <View style={{ flex: 1 }}>
            <ActivityIndicator size={"large"} />
            <Text>Loading...</Text>
          </View>
        }
      >
        <SQLiteProvider
          databaseName='mySQLiteDB.db'
          useSuspense
        >
          <Stack.Navigator>
            <Stack.Screen name='Home' component={Home}
              options={{
                headerTitle: "Budget Buddy",
                headerLargeTitle: true,
              }}
            />
          </Stack.Navigator>
        </SQLiteProvider>
      </Suspense>
    </NavigationContainer>
  );
}

