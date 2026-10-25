import { StyleSheet } from "react-native"
import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"

export default function SettingsScreen() {
	const { t } = useTranslation()
	const { status } = useAuth()

	return (
		<ThemedView variant="background" colorName="bg_1" style={styles.container}>
			<ThemedView
				variant="wide"
				colorName="bg_0"
				borderColor="blue1"
				onPress={() => router.push("/settings/notifications")}
				style={styles.menuItem}
			>
				<ThemedText variant="H3" colorName="blue2">
					{t("settings34.menu.notifications")}
				</ThemedText>
			</ThemedView>
			{status === "AUTHENTICATED" && (
				<ThemedView
					variant="wide"
					colorName="bg_0"
					borderColor="blue1"
					onPress={() => router.push("/settings/account")}
					style={styles.menuItem}
				>
					<ThemedText variant="H3" colorName="blue2">
						{t("settings34.menu.account")}
					</ThemedText>
				</ThemedView>
			)}
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: { paddingTop: 32, gap: 16 },
	menuItem: { minHeight: 56, paddingHorizontal: 18 },
})
