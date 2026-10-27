import React from "react"
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg"
import { useTheme } from "@/context/ThemeContext"
import type { AmputationLevel, LimbType } from "./AmputationLevelSelector"

export interface AmputationLevelPath {
	key: AmputationLevel
	svgPath: string
}

interface LimbDiagramProps {
	selectedLevel: AmputationLevel | null
	type: LimbType
}

const UPPER_PATHS: AmputationLevelPath[] = [
	{
		key: "forequarter",
		svgPath: "M131.258 -5.29224H-40.6035V34.8087H131.258V-5.29224Z",
	},
	{
		key: "shoulder_disarticulation",
		svgPath: "M131.396 34.8594H-40.6035V72.8594H131.396V34.8594Z",
	},
	{
		key: "short_upper_arm",
		svgPath: "M131.396 72.8594H-40.6035V110.859H131.396V72.8594Z",
	},
	{
		key: "medium_upper_arm",
		svgPath: "M131.396 110.859H-40.6035V148.859H131.396V110.859Z",
	},
	{
		key: "long_upper_arm",
		svgPath: "M131.396 148.859H-40.6035V186.859H131.396V148.859Z",
	},
	{
		key: "elbow_disarticulation",
		svgPath: "M131.396 186.859H-40.6035V224.859H131.396V186.859Z",
	},
	{
		key: "short_forearm",
		svgPath: "M131.396 224.859H-40.6035V262.859H131.396V224.859Z",
	},
	{
		key: "medium_forearm",
		svgPath: "M131.396 262.859H-40.6035V300.859H131.396V262.859Z",
	},
	{
		key: "long_forearm",
		svgPath: "M131.396 300.859H-40.6035V338.859H131.396V300.859Z",
	},
	{
		key: "wrist_disarticulation",
		svgPath: "M130.396 337.859H-44.6035V376.859H130.396V337.859Z",
	},
	{
		key: "partial_hand",
		svgPath: "M131.396 376.859H-40.6035V418.859H131.396V376.859Z",
	},
]

const LOWER_PATHS: AmputationLevelPath[] = [
	{
		key: "hemipelvectomy",
		svgPath: "M95.876 0.177633L-13.0293 1.00422L-12.7618 36.254L96.1435 35.4274L95.876 0.177633Z",
	},
	{
		key: "hip_disarticulation",
		svgPath: "M96.1435 35.4276L-12.7617 36.2542L-12.4793 73.4623L96.426 72.6357L96.1435 35.4276Z",
	},
	{
		key: "short_thigh",
		svgPath: "M96.4248 72.6359L-12.4805 73.4625L-12.1981 110.671L96.7072 109.844L96.4248 72.6359Z",
	},
	{
		key: "medium_thigh",
		svgPath: "M96.71 109.844L-12.1953 110.67L-11.9129 147.878L96.9924 147.052L96.71 109.844Z",
	},
	{
		key: "long_thigh",
		svgPath: "M96.9912 147.052L-11.9141 147.878L-11.6317 185.087L97.2736 184.26L96.9912 147.052Z",
	},
	{
		key: "knee_disarticulation",
		svgPath: "M97.5958 183.8L-11.4395 184.2L-11.1624 224.3L97.8728 223.5L97.5958 183.8Z",
	},
	{
		key: "short_lower_leg",
		svgPath: "M97.5557 221.468L-11.3496 222.295L-11.0672 259.503L97.8381 258.676L97.5557 221.468Z",
	},
	{
		key: "medium_lower_leg",
		svgPath: "M97.8389 258.676L-11.0664 259.503L-10.784 296.711L98.1213 295.884L97.8389 258.676Z",
	},
	{
		key: "long_lower_leg",
		svgPath: "M98.1201 295.884L-10.7852 296.711L-10.5027 333.919L98.4025 333.092L98.1201 295.884Z",
	},
	{
		key: "syme",
		svgPath: "M98.4033 333.092L-10.502 333.919L-10.2195 371.127L98.6857 370.3L98.4033 333.092Z",
	},
	{
		key: "partial_foot",
		svgPath: "M98.6845 370.3L-16.7715 371.177L-16.4445 414.26L99.0115 413.383L98.6845 370.3Z",
	},
]

const ARM_OUTLINE_PATH =
	"M5.78618 0.75H61.5886C67.3173 86.6805 66.2385 118.858 56.6801 189.797C59.5445 201.255 56.6801 212.712 50.9514 221.305C62.4088 258.542 50.9514 301.292 39.494 350.201C39.494 369.181 43.917 366.391 45.7771 388.71C42.057 402.66 38.5603 414.75 29.9672 414.75H23.4573C14.8643 414.75 9.43316 389.789 12.2975 384.061C18.8074 366.391 22.5275 365.461 22.5275 350.201C13.7149 305.012 10.8505 258.542 16.5792 221.305C13.2295 208.294 11.2933 195.571 14.1576 184.114C8.42893 138.284 -7.23334 87.3956 5.78618 0.75Z"

const LEG_OUTLINE_PATH =
	"M36.4042 1.10919L88.7411 0.711959C93.6962 78.8992 89.7305 131.079 77.0421 183.325C79.3415 198.953 77.2796 214.613 72.9973 225.076C86.3586 261.479 73.5261 327.385 61.2622 345.092C57.2084 376.435 68.9933 400.945 66.9567 404.248C64.92 407.551 3.06138 404.733 3.06138 404.733C5.27912 374.269 44.5758 402.904 37.2793 347.02C29.9827 291.136 38.2644 246.2 42.4675 225.308C40.168 209.68 37.9082 199.267 42.1508 183.59C28.4729 105.469 23.7157 53.3554 36.4042 1.10919Z"

export const LimbDiagram = ({ selectedLevel, type }: LimbDiagramProps) => {
	const { colors } = useTheme()
	const isUpperLimb = type === "upper"
	const levels = isUpperLimb ? UPPER_PATHS : LOWER_PATHS
	const outlinePath = isUpperLimb ? ARM_OUTLINE_PATH : LEG_OUTLINE_PATH
	const clipPathId = isUpperLimb ? "armClip" : "legClip"

	return (
		<Svg
			width={isUpperLimb ? 67 : 94}
			height={isUpperLimb ? 416 : 408}
			viewBox={isUpperLimb ? "0 0 67 416" : "0 0 94 407"}
		>
			<Defs>
				<ClipPath id={clipPathId}>
					<Path d={outlinePath} />
				</ClipPath>
			</Defs>
			<G clipPath={`url(#${clipPathId})`}>
				{levels.map((level, index) => {
					if (!level.svgPath) return null

					const isSelected = selectedLevel === level.key
					const fillColor = isSelected ? colors.blue1 : index % 2 === 0 ? colors.bg_1 : colors.blue0

					return <Path key={level.key} d={level.svgPath} fill={fillColor} />
				})}
			</G>
			<Path
				d={outlinePath}
				stroke={colors.blue2}
				strokeWidth={1.42}
				fill="none"
				strokeLinejoin="round"
			/>
		</Svg>
	)
}

export const LegDiagram = ({
	selectedLevel,
	variant,
}: {
	selectedLevel: AmputationLevel | null
	variant: LimbType
}) => <LimbDiagram selectedLevel={selectedLevel} type={variant} />
