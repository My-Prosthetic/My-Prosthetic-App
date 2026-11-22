import { ScrollView, StyleSheet, View } from "react-native"
import { useCallback, useMemo, useState } from "react"
import { useFocusEffect, useRouter } from "expo-router"
import { ThemeColors, useTheme } from "@/context/ThemeContext"
import { useTranslation } from "react-i18next"

import {
	getSpecialistsWithSummary,
	type SpecialistListItem,
} from "@/db/repositories/specialistRepository"
import { formatDate, formatHour } from "@/src/utils/dateTimeUtils"

import { ThemedView } from "@/src/components/ThemedView"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import ThemedSearch from "@/src/components/ThemedSearch"
import { ThemedText } from "@/src/components/ThemedText"

import IconChevronRight from "@/assets/icons/chevron-right.svg"
import IconPersonGear from "@/assets/icons/person-gear.svg"

const formatLastMessageTime = (createdAt: string, yesterdayLabel: string): string => {
	const date = new Date(createdAt)
	if (Number.isNaN(date.getTime())) {
		return ""
	}

	const today = new Date()
	if (date.toDateString() === today.toDateString()) {
		return formatHour(date)
	}

	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)
	return date.toDateString() === yesterday.toDateString() ? yesterdayLabel : formatDate(date)
}

const getDisplayName = (specialist: SpecialistListItem) =>
	[specialist.name, specialist.surname]
		.filter((part): part is string => Boolean(part?.trim()))
		.join(" ")
		.trim()

const getInitials = (displayName: string) => {
	const parts = displayName.split(/\s+/).filter(Boolean)
	const first = parts[0]?.charAt(0) ?? ""
	const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : ""
	return (first + last).toUpperCase()
}

//TODO
const handleEditSpecialists = () => {}

export default function SpecialistsListScreen() {
	const { colors } = useTheme()
	const { t } = useTranslation()
	const router = useRouter()

	const [specialistsList, setSpecialistsList] = useState<SpecialistListItem[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)

	useFocusEffect(
		useCallback(() => {
			let isCancelled = false

			const loadSpecialists = async () => {
				try {
					const rows = await getSpecialistsWithSummary()
					if (isCancelled) return
					setSpecialistsList(rows)
					setLoadError(null)
				} catch (error) {
					console.error("Failed to load specialists:", error)
					if (!isCancelled) setLoadError(t("recommendations.loadError"))
				} finally {
					if (!isCancelled) setIsLoading(false)
				}
			}

			void loadSpecialists()
			return () => {
				isCancelled = true
			}
		}, [])
	)

	const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
	const filteredSpecialists = useMemo(
		() =>
			specialistsList
				.filter((specialist) =>
					[specialist.name, specialist.surname, specialist.email, specialist.phone]
						.filter((value): value is string => Boolean(value))
						.some((value) => value.toLocaleLowerCase().includes(normalizedQuery))
				)
				.sort((a, b) => {
					const aTimestamp = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
					const bTimestamp = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
					const aTime = Number.isNaN(aTimestamp) ? 0 : aTimestamp
					const bTime = Number.isNaN(bTimestamp) ? 0 : bTimestamp
					return bTime - aTime
				}),
		[specialistsList, normalizedQuery]
	)

	const handleOnSpecialistPress = useCallback((_specialistId: string) => {
		router.push({ pathname: "/recommendations/[specialistId]", params: { specialistId: _specialistId } })
	}, [])

	return (
		<ThemedView colorName="bg_1" variant="background">
			<ThemedHeader tx="recommendations.title" />
			<ThemedSearch
				style={listStyles.searchbar}
				placeholder={t("common.search")}
				value={searchQuery}
				onChangeText={setSearchQuery}
			/>
			<ScrollView contentContainerStyle={listStyles.listContainer}>
				{isLoading ? (
					<ThemedText variant="H4" colorName="blue2">
						{t("recommendations.loading")}
					</ThemedText>
				) : loadError ? (
					<ThemedText variant="H4" colorName="blue2">
						{loadError}
					</ThemedText>
				) : filteredSpecialists.length === 0 ? (
					<ThemedText variant="H4" colorName="blue2">
						{t(normalizedQuery ? "recommendations.noResults" : "recommendations.empty")}
					</ThemedText>
				) : (
					filteredSpecialists.map((specialist) => (
						<SpecialistRow
							key={specialist.id}
							specialist={specialist}
							onPress={handleOnSpecialistPress}
							yesterdayLabel={t("time.yesterday")}
						/>
					))
				)}
			</ScrollView>
			<ThemedView
				variant="wide"
				colorName="blue2"
				style={{ marginVertical: 10 }}
				onPress={handleEditSpecialists}
				leftChild={<IconPersonGear color={colors.bg_0} />}
				centerChild={
					<ThemedText variant="H1" colorName="bg_0" tx="recommendations.editSpecialists" />
				}
				rightChild={<IconChevronRight color={colors.bg_0} />}
			/>
		</ThemedView>
	)
}

interface SpecialistRowProps {
	specialist: SpecialistListItem
	onPress: (specialistId: string) => void
	yesterdayLabel: string
}

const SpecialistRow = ({ specialist, onPress, yesterdayLabel }: SpecialistRowProps) => {
	const { colors } = useTheme()
	const styles = useMemo(() => getStyles(colors), [colors])

	const displayName = getDisplayName(specialist)
	const initials = getInitials(displayName)
	const { lastMessage, unreadCount } = specialist

	return (
		<>
			<ThemedView
				variant="wide"
				onPress={() => onPress(specialist.id)}
				style={styles.rowContainer}
				childrenContainerStyle={styles.rowChildrenContainer}
				leftChild={
					<View style={styles.specialistCircle}>
						<ThemedText variant="H3" colorName="bg_0">
							{initials}
						</ThemedText>
					</View>
				}
				centerChild={
					<View style={styles.centerContent}>
						<ThemedText variant="H3" colorName="blue2" numberOfLines={1}>
							{displayName}
						</ThemedText>
						{lastMessage && (
							<ThemedText
								variant={lastMessage.isUnread ? "H5" : "H4"}
								colorName="blue2"
								numberOfLines={1}
								ellipsizeMode="tail"
							>
								{lastMessage.content}
							</ThemedText>
						)}
					</View>
				}
				rightChild={
					<View style={styles.rightContent}>
						{unreadCount > 0 && (
							<ThemedView colorName="true" style={styles.unreadBadge}>
								<ThemedText variant="H2" colorName="bg_0">
									{unreadCount}
								</ThemedText>
							</ThemedView>
						)}
						{lastMessage && (
							<ThemedText variant="H5" colorName="blue2">
								{formatLastMessageTime(lastMessage.createdAt, yesterdayLabel)}
							</ThemedText>
						)}
					</View>
				}
			/>
			<ThemedView variant="divider" colorName="blue0" />
		</>
	)
}

const listStyles = StyleSheet.create({
	listContainer: {
		paddingTop: 12,
		paddingBottom: 24,
		gap: 12,
	},
	searchbar: {
		marginVertical: 10,
	},
})

const getStyles = (colors: ThemeColors) => {
	const styles = StyleSheet.create({
		rowContainer: {
			paddingVertical: 4,
		},
		rowChildrenContainer: {
			paddingHorizontal: 0,
		},
		specialistCircle: {
			width: 54,
			height: 54,
			borderRadius: 30,
			backgroundColor: colors.blue1,
			alignItems: "center",
			justifyContent: "center",
		},
		centerContent: {
			flex: 1,
			justifyContent: "center",
			gap: 4,
		},
		rightContent: {
			alignItems: "flex-end",
			justifyContent: "center",
			gap: 6,
		},
		unreadBadge: {
			width: 24,
			height: 24,
			borderRadius: 12,
			justifyContent: "center",
			alignItems: "center",
		},
	})
	return styles
}
