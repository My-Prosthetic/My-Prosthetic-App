import React from "react"
import { View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useAuth } from "@/context/AuthContext"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function NoAccountScreen() {
	const router = useRouter()
	const { loginAsGuest } = useAuth()
	const insets = useSafeAreaInsets()

	const onContinueWithoutAccountPress = () => {
		loginAsGuest()
	}

	return (
		<ThemedView
			variant="background"
			colorName="bg_1"
			style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
		>
			<View style={styles.higher}>
				<ThemedText
					tx="login.areYouSure"
					variant="H0"
					colorName="blue2"
					style={{ alignSelf: "flex-start", textAlign: "left", textTransform: "uppercase" }}
				/>
			</View>
			<View style={styles.lower}>
				<ThemedView colorName="blue2" variant="wide" style={styles.card}>
					<ThemedText tx="login.onlyLocal" variant="H3" colorName="bg_0" style={styles.cardText} />

					<ThemedText tx="login.noCopy" variant="H3" colorName="bg_0" style={styles.bulletItem} />

					<ThemedText
						tx="login.constraints"
						variant="H3"
						colorName="bg_0"
						style={styles.bulletItem}
					></ThemedText>
				</ThemedView>

				<View style={styles.actionsContainer}>
					{/* Wiersz: Zaloguj się */}
					<View style={styles.rowAction}>
						<ThemedText tx="login.alreadyHaveAccount" variant="H3" colorName="blue2" />
						<ThemedText
							tx="login.logIn2"
							variant="H3"
							colorName="magenta0"
							onPress={() => router.push("../login")}
						/>
					</View>

					{/* Wiersz: Stwórz konto */}
					<View style={styles.rowAction}>
						<ThemedText tx="login.noAccount" variant="H3" colorName="blue2" />
						<ThemedText
							tx="login.createAccount"
							variant="H3"
							colorName="magenta0"
							onPress={() => router.push("../signup")}
						/>
					</View>

					{/* Główny przycisk: Korzystaj bez konta */}
					<ThemedView
						variant="narrow"
						colorName="blue2"
						onPress={onContinueWithoutAccountPress}
						style={{ marginTop: 20 }}
					>
						<ThemedText tx="login.useWithoutAccount" variant="H1" colorName="bg_0" />
					</ThemedView>
				</View>
			</View>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		justifyContent: "space-around",
	},
	higher: {
		flexGrow: 1,
		justifyContent: "center",
		alignSelf: "flex-start",
	},
	lower: {
		flexDirection: "column",
		justifyContent: "space-around",
		gap: 20,
		paddingBottom: 20,
		width: "100%",
	},
	card: {
		flexDirection: "column",
		alignItems: "flex-start",
		padding: "8%",
	},
	cardText: {
		marginBottom: 16,
		lineHeight: 20,
	},
	bulletItem: {
		paddingLeft: 20,
		marginBottom: 12,
		lineHeight: 20,
	},
	actionsContainer: {
		gap: 10,
		alignItems: "center",
		alignSelf: "center",
		width: "100%",
	},
	rowAction: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "80%",
	},
})
