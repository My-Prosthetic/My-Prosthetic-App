import React from "react"
import { View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useAuth } from "@/context/AuthContext"

//TODO tx

export default function SignUpScreen() {
	const router = useRouter()
	const { loginAsGuest } = useAuth()

	const onContinueWithoutAccountPress = () => {
		loginAsGuest()
	}

	return (
		<ThemedView variant="background" colorName="tertiary_base_2" style={styles.container}>
			<ThemedText variant="title" colorName="primary_base" style={{ textAlign: "left" }}>
				{"CZY NA PEWNO\nCHCESZ KORZYSTAĆ\nBEZ KONTA?"}
			</ThemedText>
			<ThemedView
				colorName="primary_base"
				variant="wide"
				style={{ flexDirection: "column", alignItems: "flex-start" }}
			>
				<ThemedText
					tx="login.onlyLocal"
					variant="subTitle1"
					colorName="accent_base"
					style={styles.cardText}
				/>

				<ThemedText
					tx="login.itResultsIn"
					variant="subTitle1"
					colorName="accent_base"
					style={styles.subHeading}
				/>

				<ThemedText
					tx="login.noCopy"
					variant="subTitle1"
					colorName="accent_base"
					style={styles.bulletItem}
				/>

				<ThemedText
					tx="login.cosntraints"
					variant="subTitle1"
					colorName="accent_base"
					style={styles.bulletItem}
				></ThemedText>
			</ThemedView>

			<View style={styles.actionsContainer}>
				{/* Wiersz: Zaloguj się */}
				<View style={styles.rowAction}>
					<ThemedText variant="tab1Category" colorName="secondary_base_0c">
						MASZ JUŻ KONTO?
					</ThemedText>
					<ThemedView
						variant="tag"
						colorName="accent_base_2"
						shadow
						onPress={() => router.push("../login")}
						style={styles.pillButton}
					>
						<ThemedText variant="tab1Category" colorName="primary_base">
							ZALOGUJ SIĘ
						</ThemedText>
					</ThemedView>
				</View>
				{/* Wiersz: Stwórz konto */}
				<View style={styles.rowAction}>
					<ThemedText variant="tab1Category" colorName="secondary_base_0c">
						NIE MASZ KONTA?
					</ThemedText>
					<ThemedView
						variant="tag"
						colorName="accent_base_2"
						shadow
						onPress={() => router.push("../signup")}
						style={styles.pillButton}
					>
						<ThemedText variant="tab1Category" colorName="primary_base">
							STWÓRZ KONTO
						</ThemedText>
					</ThemedView>
				</View>
				<View style={styles.actionsContainer}></View>
				{/* Główny przycisk: Korzystaj bez konta */}
				<ThemedView
					variant="wide"
					colorName="primary_base"
					shadow
					onPress={onContinueWithoutAccountPress}
					style={styles.mainActionButton}
				>
					<ThemedText variant="main1Button" colorName="accent_base_1">
						KORZYSTAJ BEZ KONTA
					</ThemedText>
				</ThemedView>
			</View>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		justifyContent: "space-between",
		paddingBottom: 60,
		paddingTop: 80,
	},
	cardText: {
		marginBottom: 16,
		lineHeight: 20,
	},
	subHeading: {
		marginBottom: 16,
	},
	bulletItem: {
		paddingLeft: 20,
		marginBottom: 12,
		lineHeight: 20,
	},
	actionsContainer: {
		gap: 14,
		marginBottom: 12,
	},
	rowAction: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 4,
	},
	pillButton: {
		paddingHorizontal: 18,
		paddingVertical: 10,
		minHeight: 44
	},
	mainActionButton: {
		marginTop: 8,
		borderRadius: 20,
	},
})
