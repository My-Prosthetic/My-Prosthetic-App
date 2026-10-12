import { Stack } from "expo-router"
import { useTheme } from "@/context/ThemeContext"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ParseKeys } from "i18next"

export default function FundingFormsLayout() {
	const { colors } = useTheme()

	return (
		<Stack
			screenOptions={{
				contentStyle: { backgroundColor: colors.tertiary_base_2 },
				header: ({ options }) => <ThemedHeader tx={options.title as ParseKeys} />,
			}}
		>
			<Stack.Screen name="new_goal" options={{ title: "funding.addGoalTitle" }} />
			<Stack.Screen name="edit_goal" options={{ title: "funding.editGoalTitle" }} />
			<Stack.Screen name="new_deposit" options={{ title: "funding.addFundsTitle" }} />
			<Stack.Screen name="edit_deposit" options={{ title: "funding.editFundsTitle" }} />
		</Stack>
	)
}
