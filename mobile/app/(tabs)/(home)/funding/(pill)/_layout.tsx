import { View, TouchableOpacity, StyleSheet } from "react-native"
import { Slot, useRouter, usePathname } from "expo-router"

import { useTheme } from "@/context/ThemeContext"

import { ThemedText } from "@/src/components/ThemedText"
import { ThemedHeader } from "@/src/components/ThemedHeader"

export default function FundingTabsLayout() {
	const { colors } = useTheme()
	const router = useRouter()
	const pathname = usePathname()

	const isAccumulated = pathname.includes("accumulated_funds")

	const isProgrammeDetails =
		!pathname.includes("programmes") && !pathname.includes("accumulated_funds")

	return (
		<View style={{ flex: 1, backgroundColor: colors.tertiary_base_2 }}>
			<ThemedHeader
				tx={isProgrammeDetails ? "funding.detailsHeader" : "funding.header"}
				variant="prominent"
			/>

			{!isProgrammeDetails && (
				<View style={styles.toggleWrapper}>
					<View
						style={[
							styles.toggleContainer,
							{
								borderColor: colors.secondary_base_0c,
								backgroundColor: colors.tertiary_base_3,
							},
						]}
					>
						<TouchableOpacity
							activeOpacity={0.8}
							onPress={() => router.replace("/funding/programmes")}
							style={[
								styles.toggleButton,
								!isAccumulated && {
									backgroundColor: colors.primary_base,
								},
							]}
							accessibilityRole="tab"
							accessibilityState={{
								selected: !isAccumulated,
							}}
						>
							<ThemedText
								tx="funding.availableProgrammes"
								variant="body1Regular"
								colorName={!isAccumulated ? "accent_base_1" : "secondary_base_0c"}
							/>
						</TouchableOpacity>

						<TouchableOpacity
							activeOpacity={0.8}
							onPress={() => router.replace("/funding/accumulated_funds")}
							style={[
								styles.toggleButton,
								isAccumulated && {
									backgroundColor: colors.primary_base,
								},
							]}
							accessibilityRole="tab"
							accessibilityState={{
								selected: isAccumulated,
							}}
						>
							<ThemedText
								tx="funding.accumulatedFunds"
								variant="body1Regular"
								colorName={isAccumulated ? "accent_base_1" : "secondary_base_0c"}
							/>
						</TouchableOpacity>
					</View>
				</View>
			)}

			<View style={{ flex: 1 }}>
				<Slot />
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	toggleWrapper: {
		paddingHorizontal: 29,
		marginTop: 16,
		marginBottom: 8,
	},
	toggleContainer: {
		flexDirection: "row",
		borderRadius: 25,
		borderWidth: 2,
		padding: 3,
		minHeight: 44,
	},
	toggleButton: {
		flex: 1,
		minHeight: 38,
		paddingHorizontal: 6,
		paddingVertical: 7,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
})
