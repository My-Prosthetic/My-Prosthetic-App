import { View, StyleSheet } from "react-native"
import { Slot, useRouter, usePathname } from "expo-router"

import { useTheme } from "@/context/ThemeContext"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"

export default function FundingTabsLayout() {
	const { colors } = useTheme()
	const router = useRouter()
	const pathname = usePathname()

	const isAccumulated = pathname.includes("accumulated_funds")

	const isProgrammeDetails =
		!pathname.includes("programmes") && !pathname.includes("accumulated_funds")

	return (
		<>
			<ThemedHeader tx={isProgrammeDetails ? "funding.detailsHeader" : "funding.title"} />
			<ThemedView variant="background" colorName="bg_1">
				{!isProgrammeDetails && (
					<ThemedView colorName="bg_0" borderColor="blue2" style={styles.toggleWrapper}>
						<ThemedView
							onPress={() => router.replace("/funding/programmes")}
							hitslop={{ top: 2, bottom: 2 }}
							style={[
								styles.toggleButton,
								!isAccumulated && {
									backgroundColor: colors.blue2,
								},
							]}
							accessibilityRole="tab"
							accessibilityState={{
								selected: !isAccumulated,
							}}
						>
							<ThemedText
								tx="funding.availableProgrammes"
								variant="H5"
								colorName={!isAccumulated ? "bg_0" : "blue2"}
								style={{ textAlign: "center" }}
							/>
						</ThemedView>

						<ThemedView
							onPress={() => router.replace("/funding/accumulated_funds")}
							style={[
								styles.toggleButton,
								isAccumulated && {
									backgroundColor: colors.blue2,
								},
							]}
							accessibilityRole="tab"
							accessibilityState={{
								selected: isAccumulated,
							}}
						>
							<ThemedText
								tx="funding.myFunds"
								variant="H5"
								colorName={isAccumulated ? "bg_0" : "blue2"}
								style={{ textAlign: "center" }}
							/>
						</ThemedView>
					</ThemedView>
				)}

				<View style={{ flex: 1 }}>
					<Slot />
				</View>
			</ThemedView>
		</>
	)
}

const styles = StyleSheet.create({
	toggleWrapper: {
		height: 44,
		alignItems: "center",
		borderWidth: 2,
		flexDirection: "row",
		marginTop: 15,
		marginBottom: 8,
		paddingVertical: 2,
		paddingHorizontal: 3,
		gap: 10,
	},
	toggleButton: {
		flex: 1,
		height: 34,
		paddingHorizontal: 6,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
	},
})
