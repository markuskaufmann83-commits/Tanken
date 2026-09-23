package de.spritradar.auto.ui

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarColor
import androidx.car.app.model.CarLocation
import androidx.car.app.model.ItemList
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Metadata
import androidx.car.app.model.Place
import androidx.car.app.model.PlaceListMapTemplate
import androidx.car.app.model.PlaceMarker
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import de.spritradar.auto.data.api.ApiClient
import de.spritradar.auto.data.model.FuelType
import de.spritradar.auto.data.model.Station
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

/**
 * Main Android Auto POI Screen presenting the cheapest fuel stations on a vehicle map.
 * Uses the official PlaceListMapTemplate for automotive interfaces.
 */
class MainStationListScreen(carContext: CarContext) : Screen(carContext) {

    companion object {
        private const val TAG = "MainStationListScreen"
        // Fallback location: Berlin Mitte
        private const val DEFAULT_LAT = 52.5200
        private const val DEFAULT_LNG = 13.4050
        private const val SEARCH_RADIUS_KM = 10
        private const val MAX_STATIONS_DISPLAYED = 12
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locationClient by lazy { LocationServices.getFusedLocationProviderClient(carContext) }

    // State
    private var currentFuelType: FuelType = FuelType.E10
    private var isLoading: Boolean = true
    private var errorMessage: String? = null
    private var stations: List<Station> = emptyList()
    private var currentLat: Double = DEFAULT_LAT
    private var currentLng: Double = DEFAULT_LNG

    init {
        loadStations()
    }

    /**
     * Fetches current location and loads nearby stations from the Azure serverless backend.
     */
    @SuppressLint("MissingPermission")
    private fun loadStations() {
        isLoading = true
        errorMessage = null
        invalidate()

        scope.launch {
            try {
                // 1. Resolve GPS Coordinates
                val hasFineLoc = ContextCompat.checkSelfPermission(
                    carContext,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                val hasCoarseLoc = ContextCompat.checkSelfPermission(
                    carContext,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (hasFineLoc || hasCoarseLoc) {
                    try {
                        val location = locationClient.lastLocation.await()
                        if (location != null) {
                            currentLat = location.latitude
                            currentLng = location.longitude
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Could not obtain last known location, using default", e)
                    }
                }

                // 2. Fetch from Azure backend via Retrofit
                val response = withContext(Dispatchers.IO) {
                    ApiClient.stationApiService.getStations(
                        lat = currentLat,
                        lng = currentLng,
                        rad = SEARCH_RADIUS_KM,
                        sort = "dist",
                        type = "all"
                    )
                }

                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    val rawStations = body.stations ?: emptyList()

                    // Filter only open stations with valid price for current fuel type, sorted by price
                    stations = sortStationsByCurrentFuel(rawStations)
                    isLoading = false
                    errorMessage = null
                } else {
                    errorMessage = "Server antwortete mit Fehlercode ${response.code()}"
                    isLoading = false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching stations from Azure", e)
                errorMessage = "Verbindung zum SpritRadar-Server fehlgeschlagen. Bitte Internetverbindung prüfen."
                isLoading = false
            } finally {
                invalidate()
            }
        }
    }

    /**
     * Sorts stations by cheapest price for the selected fuel type.
     */
    private fun sortStationsByCurrentFuel(list: List<Station>): List<Station> {
        return list
            .filter { it.isOpen && it.getPrice(currentFuelType) != null }
            .sortedBy { it.getPrice(currentFuelType) }
            .take(MAX_STATIONS_DISPLAYED)
    }

    /**
     * Switches the active fuel type and resorts stations.
     */
    private fun switchFuelType() {
        currentFuelType = currentFuelType.next()
        stations = sortStationsByCurrentFuel(stations)
        invalidate()
    }

    /**
     * Starts navigation via the car's default navigation app (Google Maps, Waze, etc.)
     */
    private fun startNavigation(station: Station) {
        val uri = Uri.parse("geo:${station.lat},${station.lng}?q=${station.lat},${station.lng}(${Uri.encode(station.name)})")
        val intent = Intent(Intent.ACTION_VIEW, uri)
        try {
            carContext.startCarApp(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Could not start car navigation app", e)
        }
    }

    /**
     * Builds and returns the Android Auto template.
     */
    override fun onGetTemplate(): Template {
        // Error state
        if (errorMessage != null) {
            return MessageTemplate.Builder(errorMessage!!)
                .setTitle("SpritRadar")
                .addAction(
                    Action.Builder()
                        .setTitle("Erneut versuchen")
                        .setOnClickListener { loadStations() }
                        .build()
                )
                .build()
        }

        // Action Strip with Refresh and Fuel Type Toggle
        val actionStrip = ActionStrip.Builder()
            .addAction(
                Action.Builder()
                    .setTitle(currentFuelType.displayName)
                    .setOnClickListener { switchFuelType() }
                    .build()
            )
            .addAction(
                Action.Builder()
                    .setTitle("Aktualisieren")
                    .setOnClickListener { loadStations() }
                    .build()
            )
            .build()

        // Loading state
        if (isLoading) {
            return PlaceListMapTemplate.Builder()
                .setTitle("SpritRadar • ${currentFuelType.displayName}")
                .setLoading(true)
                .setActionStrip(actionStrip)
                .setCurrentLocationEnabled(true)
                .build()
        }

        // Stations List
        val listBuilder = ItemList.Builder()
            .setNoItemsMessage("Keine geöffneten Tankstellen für ${currentFuelType.displayName} gefunden.")

        stations.forEachIndexed { index, station ->
            val priceFormatted = station.formatPrice(currentFuelType)
            val distFormatted = station.formatDistance()
            val statusText = if (station.isOpen) "Geöffnet" else "Geschlossen"

            val isCheapest = index == 0

            // Marker on the vehicle map
            val marker = PlaceMarker.Builder()
                .setColor(if (isCheapest) CarColor.GREEN else CarColor.DEFAULT)
                .build()

            val place = Place.Builder(CarLocation.create(station.lat, station.lng))
                .setMarker(marker)
                .build()

            val row = Row.Builder()
                .setTitle(station.name)
                .addText("$priceFormatted/L  •  $distFormatted")
                .addText(statusText)
                .setMetadata(Metadata.Builder().setPlace(place).build())
                .setOnClickListener { startNavigation(station) }
                .build()

            listBuilder.addItem(row)
        }

        return PlaceListMapTemplate.Builder()
            .setTitle("Günstigste Tankstellen (${currentFuelType.displayName})")
            .setItemList(listBuilder.build())
            .setActionStrip(actionStrip)
            .setCurrentLocationEnabled(true)
            .build()
    }
}
