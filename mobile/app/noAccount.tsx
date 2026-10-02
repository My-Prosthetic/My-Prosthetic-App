import React from "react"
import { View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { useAuth } from "@/context/AuthContext"

export default function SignUpScreen() {
	const router = useRouter()
	const { loginAsGuest } = useAuth()

	const onContinueWithoutAccountPress = () => {
		loginAsGuest()
	}

	return (
		<ThemedView variant="background" colorName="tertiary_base_2" style={styles.container}>
			<ThemedText
				tx="login.areYouSure"
				variant="title"
				colorName="primary_base"
				style={{ textAlign: "left" }}
			/>
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
					<ThemedText
						tx="login.alreadyHaveAccount"
						variant="tab1Category"
						colorName="secondary_base_0c"
					/>
					<ThemedView
						variant="tag"
						colorName="accent_base_2"
						shadow
						onPress={() => router.push("../login")}
						style={styles.pillButton}
					>
						<ThemedText tx="login.logIn" variant="tab1Category" colorName="primary_base" />
					</ThemedView>
				</View>
				{/* Wiersz: Stwórz konto */}
				<View style={styles.rowAction}>
					<ThemedText tx="login.noAccount" variant="tab1Category" colorName="secondary_base_0c" />
					<ThemedView
						variant="tag"
						colorName="accent_base_2"
						shadow
						onPress={() => router.push("../signup")}
						style={styles.pillButton}
					>
						<ThemedText tx="login.createAccount" variant="tab1Category" colorName="primary_base" />
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
					<ThemedText
						tx="login.useWithoutAccount"
						variant="main1Button"
						colorName="accent_base_1"
					/>
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
		minHeight: 44,
	},
	mainActionButton: {
		marginTop: 8,
		borderRadius: 20,
	},
})
