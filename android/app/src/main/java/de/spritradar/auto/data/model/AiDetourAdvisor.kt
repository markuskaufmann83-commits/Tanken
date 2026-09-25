package de.spritradar.auto.data.model

import java.util.Locale
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.roundToInt

enum class VerdictType {
    SUCCESS,
    NEUTRAL,
    DANGER
}

data class AiDetourResult(
    val verdictType: VerdictType,
    val isSameStation: Boolean,
    val badge: String,
    val title: String,
    val description: String,
    val cheapestStation: Station,
    val nearestStation: Station,
    val fuelType: FuelType,
    val tankLiters: Double,
    val consumptionPer100Km: Double,
    val extraRoundTripKm: Double,
    val extraTimeMinutes: Int,
    val grossSavings: Double,
    val detourCost: Double,
    val netSavings: Double,
    val priceDiffPerLiter: Double
) {
    fun formatNetSavings(): String {
        val sign = if (netSavings >= 0) "+" else ""
        return String.format(Locale.GERMANY, "%s%.2f €", sign, netSavings)
    }

    fun formatGrossSavings(): String {
        return String.format(Locale.GERMANY, "+%.2f €", grossSavings)
    }

    fun formatDetourCost(): String {
        return String.format(Locale.GERMANY, "-%.2f €", detourCost)
    }

    fun formatExtraKm(): String {
        return String.format(Locale.GERMANY, "+%.1f km", extraRoundTripKm)
    }
}

/**
 * AI Detour Advisor Domain Logic: Calculates net financial savings / losses
 * when taking an extra driving distance to reach a cheaper gas station.
 */
object AiDetourAdvisor {

    // Realistic road circuity factor in urban/suburban road networks:
    // Driving distance on roads is on average ~35% longer than straight-line air distance
    private const val ROAD_CIRCUITY_FACTOR = 1.35

    fun calculate(
        cheapestStation: Station,
        nearestStation: Station,
        fuelType: FuelType,
        tankLiters: Double = 50.0,
        consumptionPer100Km: Double = if (fuelType == FuelType.DIESEL) 5.8 else 6.8
    ): AiDetourResult {
        val isSame = cheapestStation.id == nearestStation.id

        val pCheap = cheapestStation.getPrice(fuelType) ?: 0.0
        val pNear = nearestStation.getPrice(fuelType) ?: 0.0
        val priceDiffPerLiter = pNear - pCheap // positive means cheapest is cheaper

        val dCheap = cheapestStation.dist ?: 0.0
        val dNear = nearestStation.dist ?: 0.0
        // Convert straight-line API distance delta into realistic street road distance
        val extraOneWayKm = max(0.0, dCheap - dNear) * ROAD_CIRCUITY_FACTOR
        val extraRoundTripKm = extraOneWayKm * 2.0

        val grossSavings = tankLiters * priceDiffPerLiter
        val fuelUsedDetour = (extraRoundTripKm * consumptionPer100Km) / 100.0
        val detourCost = fuelUsedDetour * pCheap
        val netSavings = grossSavings - detourCost
        val extraTimeMinutes = (extraRoundTripKm * 1.6).roundToInt()

        val (verdictType, badge, title, desc) = when {
            isSame -> {
                Quadruple(
                    VerdictType.SUCCESS,
                    "Optimaler Treffer",
                    "Kein Umweg nötig!",
                    "Die günstigste Tankstelle ist gleichzeitig die nächste in deiner Umgebung. Du sparst maximal ohne zusätzliche Kilometer!"
                )
            }
            netSavings >= 1.0 -> {
                Quadruple(
                    VerdictType.SUCCESS,
                    "KI-Empfehlung: Umweg lohnt sich",
                    String.format(Locale.GERMANY, "Du sparst ca. %.2f € netto", netSavings),
                    String.format(
                        Locale.GERMANY,
                        "Der Preisvorteil an der Zapfsäule (+%.2f €) übersteigt die zusätzlichen Spritkosten für den Umweg (-%.2f €) deutlich.",
                        grossSavings,
                        detourCost
                    )
                )
            }
            netSavings >= -0.2 -> {
                Quadruple(
                    VerdictType.NEUTRAL,
                    "KI-Empfehlung: Kaum Unterschied",
                    String.format(Locale.GERMANY, "Minimaler Vorteil: ±%.2f €", abs(netSavings)),
                    String.format(
                        Locale.GERMANY,
                        "Die Spritersparnis wird durch die Mehrkilometer fast genau aufgebraucht. Bei %d Min Fahrzeit lohnt sich der Umweg kaum.",
                        extraTimeMinutes
                    )
                )
            }
            else -> {
                Quadruple(
                    VerdictType.DANGER,
                    "KI-Empfehlung: Lohnt sich NICHT!",
                    String.format(Locale.GERMANY, "Du zahlst ca. %.2f € drauf", abs(netSavings)),
                    String.format(
                        Locale.GERMANY,
                        "Der Umweg von %.1f km kostet mehr Sprit (-%.2f €) als die Ersparnis an der Zapfsäule (+%.2f €).",
                        extraRoundTripKm,
                        detourCost,
                        grossSavings
                    )
                )
            }
        }

        return AiDetourResult(
            verdictType = verdictType,
            isSameStation = isSame,
            badge = badge,
            title = title,
            description = desc,
            cheapestStation = cheapestStation,
            nearestStation = nearestStation,
            fuelType = fuelType,
            tankLiters = tankLiters,
            consumptionPer100Km = consumptionPer100Km,
            extraRoundTripKm = extraRoundTripKm,
            extraTimeMinutes = extraTimeMinutes,
            grossSavings = grossSavings,
            detourCost = detourCost,
            netSavings = netSavings,
            priceDiffPerLiter = priceDiffPerLiter
        )
    }

    private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
}
