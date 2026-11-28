import { ScrollView, StyleSheet, View } from "react-native"
import { useEffect, useMemo, useRef, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"

import {
	getSpecialistWithMessagesById,
	markSpecialistMessagesAsRead,
} from "@/db/repositories/specialistRepository"
import { Initials } from "@/src/components/SpecialistAvatar"
import { formatHour } from "@/src/utils/dateTimeUtils"
import {
	formatMessageDay,
	getSpecialistDisplayName,
	getSpecialistInitials,
} from "@/src/utils/recommendationsUtils"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedText } from "@/src/components/ThemedText"
import { ThemedView } from "@/src/components/ThemedView"

interface RecommendationItem {
	id: string
	type: "read_message" | "unread_message" | "divider"
	text: string
	time?: string
}

type SpecialistWithMessages = NonNullable<Awaited<ReturnType<typeof getSpecialistWithMessagesById>>>

function buildRecommendationItems(
	messages: SpecialistWithMessages["messages"],
	todayLabel: string,
	yesterdayLabel: string,
	newMessagesLabel: string
): RecommendationItem[] {
	const orderedMessages = [...messages].sort((first, second) => {
		const difference = Date.parse(first.createdAt) - Date.parse(second.createdAt)
		return (
			(Number.isNaN(difference) ? first.createdAt.localeCompare(second.createdAt) : difference) ||
			first.id.localeCompare(second.id)
		)
	})
	const firstUnreadIndex = orderedMessages.findIndex((message) => message.isUnread)
	const referenceDate = new Date()
	const items: RecommendationItem[] = []
	let previousDay: string | null = null

	orderedMessages.forEach((message, index) => {
		const date = new Date(message.createdAt)
		const dayKey = Number.isNaN(date.getTime()) ? null : date.toDateString()

		if (__DEV__ && dayKey === null) {
			console.warn(
				`[recommendations] Nieprawidłowa wartość createdAt dla wiadomości ${message.id}: "${message.createdAt}"`
			)
		}

		if (dayKey && dayKey !== previousDay) {
			items.push({
				id: `day-${dayKey}`,
				type: "divider",
				text: formatMessageDay(date, todayLabel, yesterdayLabel, referenceDate),
			})
		}

		if (index === firstUnreadIndex) {
			items.push({
				id: "new-messages",
				type: "divider",
				text: newMessagesLabel,
			})
		}

		items.push({
			id: message.id,
			type: message.isUnread ? "unread_message" : "read_message",
			text: message.content,
			...(dayKey ? { time: formatHour(date) } : {}),
		})
		previousDay = dayKey
	})

	return items
}

function SpecialistCard({
	specialist,
	role,
}: {
	specialist: SpecialistWithMessages
	role: string
}) {
	const displayName = getSpecialistDisplayName(specialist)

	return (
		<ThemedView colorName="bg_0" style={styles.specialistCard}>
			<Initials initials={getSpecialistInitials(displayName)} />

			<View style={styles.specialistDetails}>
				<ThemedText variant="H3" colorName="blue2">
					{displayName}
				</ThemedText>
				<ThemedText variant="H4" colorName="blue2">
					{role}
				</ThemedText>
				{specialist.email && (
					<ThemedText variant="H4" colorName="blue2" style={styles.contactText}>
						{specialist.email}
					</ThemedText>
				)}
				{specialist.phone && (
					<ThemedText variant="H4" colorName="blue2">
						{specialist.phone}
					</ThemedText>
				)}
			</View>
		</ThemedView>
	)
}

function RecommendationEntry({ item }: { item: RecommendationItem }) {
	if (item.type === "divider") {
		return (
			<View style={styles.dividerRow}>
				<ThemedView variant="divider" colorName="blue2" style={styles.dividerLine} />
				<ThemedText variant="H4" colorName="blue2">
					{item.text}
				</ThemedText>
				<ThemedView variant="divider" colorName="blue2" style={styles.dividerLine} />
			</View>
		)
	}

	return (
		<View style={styles.messageWrapper}>
			<ThemedView
				colorName="bg_0"
				borderColor={item.type === "read_message" ? "blue1" : "blue2"}
				style={styles.bubble}
			>
				<ThemedText variant="H2" colorName="blue2">
					{item.text}
				</ThemedText>
			</ThemedView>
			{item.time && (
				<ThemedText variant="H4" colorName="blue2" style={styles.timestamp}>
					{item.time}
				</ThemedText>
			)}
		</View>
	)
}

export default function RecommendationsScreen() {
	const { specialistId: specialistIdParam } = useLocalSearchParams<{
		specialistId?: string | string[]
	}>()
	const specialistId = Array.isArray(specialistIdParam) ? specialistIdParam[0] : specialistIdParam
	const { t } = useTranslation()
	const scrollRef = useRef<ScrollView>(null)
	const [specialist, setSpecialist] = useState<SpecialistWithMessages | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState(false)

	useEffect(() => {
		let isCancelled = false

		const loadSpecialist = async () => {
			setIsLoading(true)
			setLoadError(false)
			setSpecialist(null)

			if (!specialistId) {
				setIsLoading(false)
				return
			}

			try {
				const result = await getSpecialistWithMessagesById(specialistId)
				if (isCancelled) return
				setSpecialist(result)

				if (result) {
					try {
						await markSpecialistMessagesAsRead(specialistId)
					} catch (error) {
						console.error("Failed to mark specialist messages as read:", error)
					}
				}
			} catch (error) {
				console.error("Failed to load specialist messages:", error)
				if (!isCancelled) setLoadError(true)
			} finally {
				if (!isCancelled) setIsLoading(false)
			}
		}

		void loadSpecialist()
		return () => {
			isCancelled = true
		}
	}, [specialistId])

	const recommendationItems = useMemo(
		() =>
			buildRecommendationItems(
				specialist?.messages ?? [],
				t("common.today"),
				t("time.yesterday"),
				t("recommendations.newMessages")
			),
		[specialist, t]
	)

	return (
		<ScrollView
			ref={scrollRef}
			showsVerticalScrollIndicator={false}
			onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
		>
			<ThemedView variant="background" colorName="bg_1" style={styles.content}>
				<ThemedView style={styles.summaryField} shadow variant="background" colorName="bg_0">
					<ThemedHeader tx="recommendations.title" />
					{specialist && (
						<SpecialistCard specialist={specialist} role={t("recommendations.specialistRole")} />
					)}
				</ThemedView>

				<View style={styles.feedContainer}>
					{isLoading ? (
						<ThemedText variant="H4" colorName="blue2">
							{t("recommendations.loading")}
						</ThemedText>
					) : loadError ? (
						<ThemedText variant="H4" colorName="blue2">
							{t("recommendations.loadError")}
						</ThemedText>
					) : !specialist ? (
						<ThemedText variant="H4" colorName="blue2">
							{t("recommendations.specialistNotFound")}
						</ThemedText>
					) : recommendationItems.length === 0 ? (
						<ThemedText variant="H4" colorName="blue2">
							{t("recommendations.noMessages")}
						</ThemedText>
					) : (
						recommendationItems.map((item) => <RecommendationEntry key={item.id} item={item} />)
					)}
				</View>
			</ThemedView>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	content: {
		paddingBottom: 20,
	},
	specialistCard: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		gap: 16,
		marginBottom: 5,
		paddingVertical: 10,
	},
	summaryField: {
		alignSelf: "center",
		width: "119%",
		borderBottomLeftRadius: 15,
		borderBottomRightRadius: 15,
		marginBottom: 20,
	},
	specialistDetails: {
		flex: 1,
		gap: 2,
	},
	contactText: {
		textDecorationLine: "underline",
	},
	feedContainer: {
		gap: 16,
	},
	dividerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 8,
	},
	dividerLine: {
		flex: 1,
	},
	messageWrapper: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 6,
	},
	bubble: {
		flex: 1,
		paddingHorizontal: 18,
		paddingVertical: 14,
		borderRadius: 20,
	},
	timestamp: {
		flexShrink: 0,
		paddingRight: 4,
	},
})
