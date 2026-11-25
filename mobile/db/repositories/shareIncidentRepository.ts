import { and, asc, eq, isNull } from "drizzle-orm"
import { db } from "@/db/client"
import { incidents } from "@/db/schema/incidents"
import { prostheses } from "@/db/schema/prostheses/prostheses"

export function getShareableIncidents() {
	return db
		.select({
			id: incidents.id,
			prosthesisId: incidents.prosthesisId,
			type: incidents.type,
			occurredAt: incidents.occurredAt,
		})
		.from(incidents)
		.innerJoin(prostheses, eq(incidents.prosthesisId, prostheses.id))
		.where(and(isNull(incidents.deletedAt), isNull(prostheses.deletedAt)))
		.orderBy(asc(incidents.occurredAt))
		.all()
}
