import { Stack } from "expo-router"

export default function FundingFormsLayout() {
	return (
		<Stack
			screenOptions={{
				header: () => {},
			}}
		>
			<Stack.Screen name="new_goal" />
			<Stack.Screen name="edit_goal" />
			<Stack.Screen name="new_deposit" />
			<Stack.Screen name="edit_deposit" />
		</Stack>
	)
}
