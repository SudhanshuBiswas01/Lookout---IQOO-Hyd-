import React from "react"
import { StatusBar } from "expo-status-bar"
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import HomeScreen from "./src/screens/HomeScreen.js"
import ResultsScreen from "./src/screens/ResultsScreen.js"
import SweepScreen from "./src/screens/SweepScreen.js"
import { SessionProvider } from "./src/state/SessionContext.js"
import { colors } from "./src/theme.js"

const Stack = createNativeStackNavigator()

// Dark navigation chrome. The Dark Room Scan is used with the lights off and
// a white header bar would both ruin night vision and spill light into frame.
const navTheme = {
	...DefaultTheme,
	dark: true,
	colors: {
		...DefaultTheme.colors,
		background: colors.bg,
		card: colors.bg,
		text: colors.text,
		border: colors.border,
		primary: colors.accent,
	},
}

export default function App() {
	return (
		<SessionProvider>
			<NavigationContainer theme={navTheme}>
				<StatusBar style="light" />
				<Stack.Navigator
					screenOptions={{
						headerStyle: { backgroundColor: colors.bg },
						headerTintColor: colors.text,
						headerShadowVisible: false,
						contentStyle: { backgroundColor: colors.bg },
					}}
				>
					<Stack.Screen
						name="Home"
						component={HomeScreen}
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="Sweep"
						component={SweepScreen}
						options={{ title: "Scanning" }}
					/>
					<Stack.Screen
						name="Results"
						component={ResultsScreen}
						options={{ title: "Results" }}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</SessionProvider>
	)
}
