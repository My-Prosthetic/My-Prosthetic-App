import { Redirect, useRouter } from "expo-router"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import { WaveFormLayout } from "@/src/components/login/WaveFormLayout"
import { useAuth } from "@/context/AuthContext"

import Logo from "@/assets/MP_text_logo.svg"
import { useTheme } from "@/context/ThemeContext"

export default function InitialScreen() {
	const router = useRouter()
	const { status } = useAuth()
	const { colors } = useTheme()

	if (status === "AUTHENTICATED" || status === "GUEST") {
		return <Redirect href="/(tabs)/(home)/home" />
	}

	const topSectionRender = () => {
		return (
			<>
				<Logo width={278.8} height={154.82} color={colors.blue0} />
				<ThemedText
					tx="common.mp"
					colorName="blue0"
					variant="H0"
					style={{
						fontSize: 30,
						paddingTop: 20,
						lineHeight: 46,
						letterSpacing: 1.44,
						textTransform: "uppercase",
					}}
				/>
			</>
		)
	}

	const bottomSectionRender = () => {
		return (
			<>
				<ThemedView
					style={{
						flexDirection: "column",
						flex: 1,
						justifyContent: "space-between",
						paddingTop: "12%",
						paddingBottom: "18%",
					}}
				>
					<ThemedView variant="narrow" colorName="blue2" onPress={() => router.push("../login")}>
						<ThemedText tx="login.logIn" colorName="bg_0" variant="H1" />
					</ThemedView>
					<ThemedView variant="narrow" colorName="blue2" onPress={() => router.push("../signup")}>
						<ThemedText tx="login.createAccount" colorName="bg_0" variant="H1" />
					</ThemedView>
					<ThemedView
						variant="narrow"
						colorName="blue0"
						onPress={() => router.push("../noAccount")}
					>
						<ThemedText
							tx="login.useWithoutAccount"
							colorName="graphite0"
							variant="H1"
							numberOfLines={1}
							adjustsFontSizeToFit={true}
						/>
					</ThemedView>
				</ThemedView>
			</>
		)
	}

	return (
		<WaveFormLayout
			topSectionRender={topSectionRender}
			bottomSectionRender={bottomSectionRender}
			variant="index"
		/>
	)
}
