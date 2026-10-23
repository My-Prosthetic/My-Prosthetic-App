import { Pressable, View } from "react-native"
import { Redirect, Tabs, usePathname } from "expo-router"
import { ParseKeys } from "i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs"

import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { GuestBanner } from "@/src/components/GuestBanner"
import { ThemedText } from "@/src/components/ThemedText"

import IconHome from "@/assets/icons/home.svg"
import IconCalendar from "@/assets/icons/calendar.svg"
import IconTorso from "@/assets/icons/torso.svg"
import IconSettings from "@/assets/icons/settings.svg"

export default function TabsLayout() {
	const { colors } = useTheme()
	const { status } = useAuth()
	const insets = useSafeAreaInsets()
	const pathname = usePathname()

	const ICONS = {
		home: IconHome,
		journal: IconCalendar,
		profile: IconTorso,
		settings: IconSettings,
	}
	const LABELS = {
		home: "tabs.home",
		journal: "tabs.journal",
		profile: "tabs.profile",
		settings: "tabs.settings",
	}

	if (status === "UNAUTHENTICATED") {
		return <Redirect href="/" />
	}

	const provideRenderButton = (variant: "home" | "journal" | "profile" | "settings") => {
		return function renderButton(props: BottomTabBarButtonProps) {
			const isFocused =
				variant === "home"
					? pathname.startsWith("/home") ||
						pathname.startsWith("/funding") ||
						pathname.startsWith("/prosthesis")
					: pathname.startsWith(`/${variant}`)

			const Icon = ICONS[variant]
			const label = LABELS[variant]

			const { ref, children, style, ...restProps } = props
			return (
				<Pressable {...restProps} style={[props.style, { justifyContent: "center" }]}>
					<View
						style={{
							backgroundColor: isFocused ? colors.blue2 : colors.bg_0,
							justifyContent: "center",
							alignItems: "center",
							width: 40,
							height: 40,
							borderRadius: 10,
							marginBottom: 5,
						}}
					>
						{<Icon color={isFocused ? colors.bg_0 : colors.blue2} height={27} />}
					</View>
					<ThemedText tx={label as ParseKeys} variant="H4" colorName="blue2" />
				</Pressable>
			)
		}
	}

	const isSettingsRoute = pathname.startsWith("/settings")

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: colors.bg_1,
			}}
		>
			{status === "GUEST" && !isSettingsRoute && <GuestBanner />}
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarStyle: {
						height: 80,
						paddingBottom: 0,
						marginBottom: insets.bottom - 1,
						borderTopLeftRadius: 15,
						borderTopRightRadius: 15,
						backgroundColor: colors.bg_0,
					},
					tabBarItemStyle: { flex: 1 },
				}}
			>
				<Tabs.Screen
					name="(home)"
					options={{
						tabBarButton: provideRenderButton("home"),
					}}
				/>
				<Tabs.Screen
					name="journal"
					options={{
						tabBarButton: provideRenderButton("journal"),
					}}
				/>
				<Tabs.Screen
					name="profile"
					options={{
						tabBarButton: provideRenderButton("profile"),
					}}
				/>
				<Tabs.Screen
					name="settings"
					options={{
						tabBarButton: provideRenderButton("settings"),
					}}
				/>
			</Tabs>
		</View>
	)
}
