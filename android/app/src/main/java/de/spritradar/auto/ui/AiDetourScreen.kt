package de.spritradar.auto.ui

import android.content.Intent
import android.net.Uri
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.CarColor
import androidx.car.app.model.Pane
import androidx.car.app.model.PaneTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import de.spritradar.auto.data.model.AiDetourAdvisor
import de.spritradar.auto.data.model.FuelType
import de.spritradar.auto.data.model.Station

/**
 * Android Auto Screen providing the AI Detour Advisor on the vehicle head unit
 * via the officially approved PaneTemplate.
 */
class AiDetourScreen(
    carContext: CarContext,
    private val cheapestStation: Station,
    private val nearestStation: Station,
    private val fuelType: FuelType
) : Screen(carContext) {

    override fun onGetTemplate(): Template {
        val result = AiDetourAdvisor.calculate(
            cheapestStation = cheapestStation,
            nearestStation = nearestStation,
            fuelType = fuelType,
            tankLiters = 50.0,
            consumptionPer100Km = if (fuelType == FuelType.DIESEL) 5.8 else 6.8
        )

        val paneBuilder = Pane.Builder()

        // Row 1: AI Verdict & Explanation
        val verdictRow = Row.Builder()
            .setTitle(result.title)
            .addText(result.badge)
            .addText(result.description)
            .build()
        paneBuilder.addRow(verdictRow)

        // Row 2: Stations Comparison (Cheapest vs. Nearest)
        val cheapPrice = cheapestStation.formatPrice(fuelType)
        val nearPrice = nearestStation.formatPrice(fuelType)
        val compRow = Row.Builder()
            .setTitle("Vergleich: Günstigste vs. Nächste")
            .addText("★ Günstigste: ${cheapestStation.getDisplayBrand()} ($cheapPrice/L • ${cheapestStation.formatDistance()})")
            .addText("📍 Nächste: ${nearestStation.getDisplayBrand()} ($nearPrice/L • ${nearestStation.formatDistance()})")
            .build()
        paneBuilder.addRow(compRow)

        // Row 3: Travel & Cost Breakdown (if not the same station)
        if (!result.isSameStation) {
            val breakdownRow = Row.Builder()
                .setTitle("Kostenbilanz bei 50 L Tank")
                .addText("Mehrstrecke: ${result.formatExtraKm()} (ca. ${result.extraTimeMinutes} Min Fahrzeit)")
                .addText("Ersparnis Zapfsäule: ${result.formatGrossSavings()} • Spritkosten: ${result.formatDetourCost()}")
                .build()
            paneBuilder.addRow(breakdownRow)
        }

        // Action 1: Navigate to Cheapest
        paneBuilder.addAction(
            Action.Builder()
                .setTitle("Zur Günstigsten (${cheapestStation.getDisplayBrand()})")
                .setBackgroundColor(CarColor.GREEN)
                .setOnClickListener { startNavigation(cheapestStation) }
                .build()
        )

        // Action 2: Navigate to Nearest (if different)
        if (!result.isSameStation) {
            paneBuilder.addAction(
                Action.Builder()
                    .setTitle("Zur Nächsten (${nearestStation.getDisplayBrand()})")
                    .setOnClickListener { startNavigation(nearestStation) }
                    .build()
            )
        }

        return PaneTemplate.Builder(paneBuilder.build())
            .setTitle("KI-Umweg-Berater")
            .setHeaderAction(Action.BACK)
            .build()
    }

    private fun startNavigation(station: Station) {
        val uri = Uri.parse("geo:${station.lat},${station.lng}?q=${station.lat},${station.lng}(${Uri.encode(station.name)})")
        val intent = Intent(CarContext.ACTION_NAVIGATE, uri)
        try {
            carContext.startCarApp(intent)
        } catch (e: Exception) {
            val viewIntent = Intent(Intent.ACTION_VIEW, uri)
            carContext.startCarApp(viewIntent)
        }
    }
}
