import { ParseKeys } from "i18next"
import { ScrollView, StyleSheet, View } from "react-native"
import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { ThemedHeader } from "@/src/components/ThemedHeader"
import { ThemedView } from "@/src/components/ThemedView"
import { ThemedText } from "@/src/components/ThemedText"
import aboutConfig from "@/src/constants/aboutConfig.json"
import legalDocs from "@/src/constants/legalDocsConfig.json"
import Logo from "@/assets/MP_text_logo_recolored.svg"
import { useTheme } from "@/context/ThemeContext"
import IconChevronRight from "@/assets/icons/chevron-right.svg"

export default function AboutScreen() {
    const { t } = useTranslation()
    const { colors } = useTheme()

    return (
        <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
        >
            <ThemedView
                variant="background"
                colorName="bg_1"
                style={styles.scrollContent}
            >
                <View>
                    {/* Header */}
                    <ThemedHeader tx="about.header" />

                    {/* Introduction */}
                    <ThemedView
                        variant="background"
                        colorName="bg_0"
                        style={styles.introSection}
                    >
                        <ThemedView style={styles.appRow}>
                            <Logo
                                width={80}
                                height={44.26}
                                color={colors.blue2}
                            />

                            <ThemedView style={styles.appInfo}>
                                <ThemedText variant="H0" colorName="blue2">
                                    {aboutConfig.appName}
                                </ThemedText>

                                <ThemedText
                                    variant="H4"
                                    colorName="blue2"
                                    tx="about.versionLabel"
                                    txOptions={{
                                        version: aboutConfig.version,
                                        release: aboutConfig.releaseLabel,
                                    }}
                                />
                            </ThemedView>
                        </ThemedView>

                        <ThemedText
                            variant="subTitle2"
                            tx="about.partnerIntro"
                            colorName="blue2"
                        />

                        <ThemedText variant="H5" colorName="blue2">
                            {aboutConfig.partner}
                        </ThemedText>
                    </ThemedView>

                    {/* Team */}
                    <ThemedText
                        variant="H1"
                        tx="about.team"
                        style={styles.sectionTitle}
                        colorName="blue2"
                    />

                    {aboutConfig.team.map((member) => (
                        <ThemedView
                            key={member.name}
                            style={styles.teamRow}
                        >
                            <ThemedText variant="H3" colorName="blue2">
                                {member.name}
                            </ThemedText>

                            <ThemedText variant="H4" colorName="blue1">
                                {member.role}
                            </ThemedText>

                            <ThemedView
                                variant="divider"
                                colorName="blue0"
                            />
                        </ThemedView>
                    ))}

                    {/* Documents */}
                    <ThemedText
                        variant="H1"
                        tx="about.documents"
                        style={styles.sectionTitle}
                        colorName="blue2"
                    />

                    {legalDocs.documents.map((doc) => (
                        <ThemedView
                            key={doc.id}
                            style={styles.docWrapper}
                        >
                            <ThemedView
                                variant="wide"
                                style={styles.docItem}
                                onPress={() =>
                                    router.push({
                                        pathname: "/settings/legal/[docId]",
                                        params: { docId: doc.id },
                                    })
                                }
                                accessibilityLabel={t("about.openDocument", {
                                    title: t(doc.titleKey as ParseKeys),
                                })}
                                centerChild={
                                    <ThemedText
                                        variant="H2"
                                        tx={doc.titleKey as ParseKeys}
                                        colorName="blue2"
                                    />
                                }
                                rightChild={
                                    <IconChevronRight
                                        color={colors.blue1}
                                        style={styles.arrow}
                                    />
                                }
                                childrenContainerStyle={styles.docRow}
                            />

                            <ThemedView
                                variant="divider"
                                colorName="blue0"
                            />
                        </ThemedView>
                    ))}
                </View>
            </ThemedView>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        width: "100%",
    },

    scrollContent: {
        paddingBottom: 40,
    },

    introSection: {
        alignSelf: "center",
        width: "119%",
        paddingTop: 24,
        paddingBottom: 16,
        borderRadius: 0,
    },

    appRow: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 16,
        marginBottom: 16,
        borderRadius: 0,
    },

    appInfo: {
        flex: 1,
        alignItems: "flex-start",
        gap: 2,
        borderRadius: 0,
    },

    sectionTitle: {
        marginTop: 24,
        marginBottom: 16,
    },

    teamRow: {
        paddingTop: 1,
        paddingBottom: 6,
        borderRadius: 0,
    },

    docWrapper: {
        borderRadius: 0,
    },

    docItem: {
        minHeight: 36,
        borderRadius: 0,
    },

    docRow: {
        width: "100%",
        minHeight: 36,
        paddingHorizontal: 0,

        // Moves text + chevron slightly toward the bottom
        paddingTop: 6,
        paddingBottom: 2,

        alignItems: "flex-end",
        gap: 0,
    },

    arrow: {
        paddingBottom: 15
    }
})