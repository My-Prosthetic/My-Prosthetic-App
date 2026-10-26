import { View } from "react-native"
import { Redirect, Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { GuestBanner } from "@/src/components/GuestBanner"

export default function TabsLayout() {
	const { t } = useTranslation()
	const { colors } = useTheme()
	const { status } = useAuth()

	if (status === "UNAUTHENTICATED") {
		return <Redirect href="/" />
	}

	return (
		<View style={{ flex: 1 }}>
			{status === "GUEST" && <GuestBanner />}
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarActiveTintColor: colors.accent_base,
					tabBarInactiveTintColor: colors.secondary_base_0c,
					tabBarStyle: {
						backgroundColor: colors.primary_base,
						borderTopWidth: 1,
						borderTopColor: colors.tertiary_base_1,
					},
				}}
			>
				<Tabs.Screen
					name="(home)"
					options={{
						title: t("tabs.homeTitle"),
						tabBarLabel: t("tabs.home"),
						tabBarIcon: ({ color, focused }) => (
							<Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="journal"
					options={{
						title: t("tabs.journalTitle"),
						tabBarLabel: t("tabs.journal"),
						tabBarIcon: ({ color, focused }) => (
							<Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="profile"
					options={{
						title: t("tabs.profileTitle"),
						tabBarLabel: t("tabs.profile"),
						tabBarIcon: ({ color, focused }) => (
							<Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="settings"
					options={{
						title: t("tabs.settingsTitle"),
						tabBarLabel: t("tabs.settings"),
						tabBarIcon: ({ color, focused }) => (
							<Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
						),
					}}
				/>
			</Tabs>
		</View>
	)
}
