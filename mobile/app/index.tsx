import { useRouter } from "expo-router"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { WaveFormLayout } from "@/src/components/login/WaveFormLayout"

import Logo from "@/assets/MP_text_logo.svg"

export default function InitialScreen() {
	const router = useRouter()

	let showLoginPage = true

	const topSectionRender = () => {
		return (
			<>
				<Logo width={278.8} height={154.82} />
				<ThemedText
					tx="common.mp"
					colorName="accent_base"
					variant="title"
					style={{ fontSize: 40, paddingTop: 20 }}
				/>
			</>
		)
	}

	const bottomSectionRender = () => {
		return (
			<>
				<ThemedView
					colorName="tertiary_base_2"
					style={{
						borderTopLeftRadius: 10000,
						justifyContent: "space-around",
						paddingTop: 20,
						paddingHorizontal: 32,
						paddingBottom: 20,
					}}
				>
					<ThemedView
						variant="narrow"
						colorName="primary_base"
						onPress={() => router.push("../login")}
					>
						<ThemedText tx="login.logIn" colorName="accent_base_1" variant="main1Button" />
					</ThemedView>
					<ThemedView
						variant="narrow"
						colorName="primary_base"
						onPress={() => router.push("../signup")}
					>
						<ThemedText tx="login.createAccount" colorName="accent_base_1" variant="main1Button" />
					</ThemedView>
					<ThemedView
						variant="narrow"
						colorName="accent_base_2"
						shadow={true}
						onPress={() => router.push("../noAccount")}
					>
						<ThemedText
							tx="login.useWithoutAccount"
							colorName="primary_base"
							variant="main1Button"
							numberOfLines={1}
							adjustsFontSizeToFit={true}
						/>
					</ThemedView>
				</ThemedView>
			</>
		)
	}

	if (showLoginPage) {
		return (
			<WaveFormLayout
				topSectionRender={topSectionRender}
				bottomSectionRender={bottomSectionRender}
				variant="index"
			/>
		)
	} else {
		router.push("/(tabs)/(home)/home")
	}
}
