package de.spritradar.auto.ui

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.net.Uri
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarColor
import androidx.car.app.model.CarLocation
import androidx.car.app.model.Distance
import androidx.car.app.model.DistanceSpan
import androidx.car.app.model.ItemList
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Metadata
import androidx.car.app.model.Place
import androidx.car.app.model.PlaceListMapTemplate
import androidx.car.app.model.PlaceMarker
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import androidx.core.content.ContextCompat
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
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
 * Main Android Auto POI Screen presenting nearby fuel stations on a vehicle map.
 * Uses PlaceListMapTemplate for automotive interfaces with full defensive crash protection.
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
    private val locationClient by lazy {
        LocationServices.getFusedLocationProviderClient(carContext.applicationContext)
    }

    // State
    private var currentFuelType: FuelType = FuelType.E10
    private var isLoading: Boolean = true
    private var isPermissionBypassed: Boolean = false
    private var errorMessage: String? = null
    private var stations: List<Station> = emptyList()
    private var currentLat: Double = DEFAULT_LAT
    private var currentLng: Double = DEFAULT_LNG

    init {
        // Safe lifecycle attachment: do NOT call invalidate() or network in init directly
        lifecycle.addObserver(object : DefaultLifecycleObserver {
            override fun onCreate(owner: LifecycleOwner) {
                if (hasLocationPermission() || isPermissionBypassed) {
                    loadStations()
                } else {
                    isLoading = false
                    safeInvalidate()
                }
            }
        })
    }

    private fun hasLocationPermission(): Boolean {
        val hasFine = ContextCompat.checkSelfPermission(
            carContext,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val hasCoarse = ContextCompat.checkSelfPermission(
            carContext,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        return hasFine || hasCoarse
    }

    /**
     * Safely invalidates the screen only when the lifecycle state allows it.
     */
    private fun safeInvalidate() {
        if (lifecycle.currentState.isAtLeast(Lifecycle.State.CREATED)) {
            try {
                invalidate()
            } catch (e: Exception) {
                Log.w(TAG, "Safe invalidate failed: ${e.message}")
            }
        }
    }

    /**
     * Fetches current location and loads nearby stations from the Azure serverless backend.
     */
    @SuppressLint("MissingPermission")
    private fun loadStations() {
        isLoading = true
        errorMessage = null
        safeInvalidate()

        scope.launch {
            try {
                // 1. Resolve GPS Coordinates if permission is granted
                if (hasLocationPermission()) {
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

                    stations = sortStationsByCurrentFuel(rawStations)
                    isLoading = false
                    errorMessage = null
                } else {
                    errorMessage = "Server antwortete mit Fehler (${response.code()})"
                    isLoading = false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching stations from Azure", e)
                errorMessage = "Verbindung fehlgeschlagen. Bitte Internet prüfen."
                isLoading = false
            } finally {
                safeInvalidate()
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
        safeInvalidate()
    }

    /**
     * Starts navigation via the car's default navigation app (Google Maps, Waze, etc.)
     */
    private fun startNavigation(station: Station) {
        val uri = Uri.parse("geo:${station.lat},${station.lng}?q=${station.lat},${station.lng}(${Uri.encode(station.name)})")
        try {
            val navIntent = Intent(CarContext.ACTION_NAVIGATE, uri)
            carContext.startCarApp(navIntent)
        } catch (e: Exception) {
            try {
                val viewIntent = Intent(Intent.ACTION_VIEW, uri)
                carContext.startCarApp(viewIntent)
            } catch (ex: Exception) {
                Log.e(TAG, "Could not start car navigation app", ex)
            }
        }
    }

    /**
     * Top-level template builder wrapped in try-catch to guarantee the car host never crashes.
     */
    override fun onGetTemplate(): Template {
        return try {
            buildTemplate()
        } catch (t: Throwable) {
            Log.e(TAG, "Fatal error building template in onGetTemplate", t)
            MessageTemplate.Builder("Ein unerwartetes Problem ist aufgetreten: ${t.localizedMessage ?: t.javaClass.simpleName}")
                .setTitle("TankPilot")
                .setHeaderAction(Action.APP_ICON)
                .addAction(
                    Action.Builder()
                        .setTitle("Erneut versuchen")
                        .setOnClickListener { loadStations() }
                        .build()
                )
                .build()
        }
    }

    private fun buildTemplate(): Template {
        // 1. Permission request screen if not granted and not bypassed
        if (!hasLocationPermission() && !isPermissionBypassed) {
            return MessageTemplate.Builder("TankPilot benötigt deinen Standort, um die günstigsten Tankstellen in deiner Umgebung zu finden.\nBitte erteile die Standort-Berechtigung auf deinem Smartphone.")
                .setTitle("Standort freigeben")
                .setHeaderAction(Action.APP_ICON)
                .addAction(
                    Action.Builder()
                        .setTitle("Standort anfragen")
                        .setOnClickListener {
                            try {
                                carContext.requestPermissions(
                                    listOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                ) { granted, _ ->
                                    if (granted.isNotEmpty()) {
                                        loadStations()
                                    }
                                }
                            } catch (e: Exception) {
                                Log.e(TAG, "requestPermissions failed", e)
                                isPermissionBypassed = true
                                loadStations()
                            }
                        }
                        .build()
                )
                .addAction(
                    Action.Builder()
                        .setTitle("Ohne GPS fortfahren")
                        .setOnClickListener {
                            isPermissionBypassed = true
                            loadStations()
                        }
                        .build()
                )
                .build()
        }

        // 2. Error state
        if (errorMessage != null) {
            return MessageTemplate.Builder(errorMessage!!)
                .setTitle("TankPilot • Fehler")
                .setHeaderAction(Action.APP_ICON)
                .addAction(
                    Action.Builder()
                        .setTitle("Erneut versuchen")
                        .setOnClickListener { loadStations() }
                        .build()
                )
                .addAction(
                    Action.Builder()
                        .setTitle(currentFuelType.displayName)
                        .setOnClickListener { switchFuelType() }
                        .build()
                )
                .build()
        }

        // 3. Action Strip (strictly max 2 actions for PlaceListMapTemplate compliance)
        val actionStripBuilder = ActionStrip.Builder()
            .addAction(
                Action.Builder()
                    .setTitle(currentFuelType.displayName)
                    .setOnClickListener { switchFuelType() }
                    .build()
            )

        if (stations.isNotEmpty()) {
            val cheapest = stations.first()
            val nearest = stations.minByOrNull { it.dist ?: Double.MAX_VALUE }
            if (nearest != null) {
                actionStripBuilder.addAction(
                    Action.Builder()
                        .setTitle("KI-Check")
                        .setOnClickListener {
                            screenManager.push(AiDetourScreen(carContext, cheapest, nearest, currentFuelType))
                        }
                        .build()
                )
            } else {
                actionStripBuilder.addAction(
                    Action.Builder()
                        .setTitle("Aktualisieren")
                        .setOnClickListener { loadStations() }
                        .build()
                )
            }
        } else {
            actionStripBuilder.addAction(
                Action.Builder()
                    .setTitle("Aktualisieren")
                    .setOnClickListener { loadStations() }
                    .build()
            )
        }

        val actionStrip = actionStripBuilder.build()

        // 4. Loading state
        if (isLoading) {
            val loadingBuilder = PlaceListMapTemplate.Builder()
                .setTitle("TankPilot • ${currentFuelType.displayName}")
                .setHeaderAction(Action.APP_ICON)
                .setLoading(true)
                .setActionStrip(actionStrip)

            if (hasLocationPermission() && carContext.carAppApiLevel >= 2) {
                try {
                    loadingBuilder.setCurrentLocationEnabled(true)
                } catch (e: Exception) {
                    Log.w(TAG, "setCurrentLocationEnabled failed during loading", e)
                }
            }

            return loadingBuilder.build()
        }

        // 5. Stations List
        val listBuilder = ItemList.Builder()
            .setNoItemsMessage("Keine geöffneten Tankstellen für ${currentFuelType.displayName} gefunden.")

        stations.forEachIndexed { index, station ->
            val priceFormatted = station.formatPrice(currentFuelType)
            val statusText = if (station.isOpen) "Geöffnet" else "Geschlossen"
            val isCheapest = index == 0

            val marker = PlaceMarker.Builder()
                .setColor(if (isCheapest) CarColor.GREEN else CarColor.DEFAULT)
                .build()

            val place = Place.Builder(CarLocation.create(station.lat, station.lng))
                .setMarker(marker)
                .build()

            // Calculate precise distance for Android Auto DistanceSpan (required for PlaceListMapTemplate)
            val distKm = station.dist ?: run {
                val results = FloatArray(1)
                Location.distanceBetween(
                    currentLat, currentLng,
                    station.lat, station.lng,
                    results
                )
                (results[0] / 1000.0)
            }

            val distance = if (distKm < 1.0) {
                Distance.create((distKm * 1000.0).coerceAtLeast(10.0), Distance.UNIT_METERS)
            } else {
                Distance.create(distKm, Distance.UNIT_KILOMETERS)
            }
            val distanceSpan = DistanceSpan.create(distance)

            // Android Auto replaces the span anchor " " with the localized distance badge
            val firstLine = SpannableStringBuilder()
            firstLine.append(" ", distanceSpan, Spannable.SPAN_INCLUSIVE_INCLUSIVE)
            firstLine.append("  •  $priceFormatted/L")

            val secondLine = "${station.getFullAddress()} • $statusText"

            val row = Row.Builder()
                .setTitle(station.name)
                .addText(firstLine)
                .addText(secondLine)
                .setMetadata(Metadata.Builder().setPlace(place).build())
                .setOnClickListener { startNavigation(station) }
                .build()

            listBuilder.addItem(row)
        }

        val templateBuilder = PlaceListMapTemplate.Builder()
            .setTitle("Günstigste Tankstellen (${currentFuelType.displayName})")
            .setHeaderAction(Action.APP_ICON)
            .setItemList(listBuilder.build())
            .setActionStrip(actionStrip)

        if (hasLocationPermission() && carContext.carAppApiLevel >= 2) {
            try {
                templateBuilder.setCurrentLocationEnabled(true)
            } catch (e: Exception) {
                Log.w(TAG, "setCurrentLocationEnabled failed", e)
            }
        }

        return templateBuilder.build()
    }
}
