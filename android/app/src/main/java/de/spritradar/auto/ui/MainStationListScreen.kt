package de.spritradar.auto.ui

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.net.Uri
import android.os.Looper
import android.text.Spannable
import android.text.SpannableString
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.CarToast
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
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import de.spritradar.auto.data.api.ApiClient
import de.spritradar.auto.data.model.AiDetourAdvisor
import de.spritradar.auto.data.model.FuelType
import de.spritradar.auto.data.model.Station
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull

/**
 * Main Android Auto POI Screen presenting nearby fuel stations on a vehicle map.
 * Includes live vehicle location tracking while driving and explicit manual refresh.
 */
class MainStationListScreen(carContext: CarContext) : Screen(carContext) {

    companion object {
        private const val TAG = "MainStationListScreen"
        private const val PREFS_NAME = "tankpilot_prefs"
        private const val PREF_KEY_FUEL = "car_fuel_type"

        // Fallback location: Berlin Mitte
        private const val DEFAULT_LAT = 52.5200
        private const val DEFAULT_LNG = 13.4050
        private const val SEARCH_RADIUS_KM = 10
        private const val MAX_STATIONS_DISPLAYED = 12

        // Re-query stations automatically when vehicle travels >= 2.0 km
        private const val AUTO_REFRESH_DISTANCE_METERS = 2000f
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locationClient by lazy {
        LocationServices.getFusedLocationProviderClient(carContext.applicationContext)
    }

    private val prefs by lazy {
        carContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    // State: load persisted fuel type or default to E10
    private var currentFuelType: FuelType = run {
        val saved = carContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(PREF_KEY_FUEL, FuelType.E10.name)
        try {
            FuelType.valueOf(saved ?: FuelType.E10.name)
        } catch (e: Exception) {
            FuelType.E10
        }
    }

    private var isLoading: Boolean = true
    private var isPermissionBypassed: Boolean = false
    private var errorMessage: String? = null
    private var allRawStations: List<Station> = emptyList()
    private var stations: List<Station> = emptyList()
    private var currentLat: Double = DEFAULT_LAT
    private var currentLng: Double = DEFAULT_LNG
    private var lastLoadedLat: Double = DEFAULT_LAT
    private var lastLoadedLng: Double = DEFAULT_LNG

    private var isLocationTrackingActive: Boolean = false

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val loc = result.lastLocation ?: return
            handleVehicleMovement(loc)
        }
    }

    init {
        // Lifecycle-aware: starts tracking while driving, stops when stopped/destroyed
        lifecycle.addObserver(object : DefaultLifecycleObserver {
            override fun onCreate(owner: LifecycleOwner) {
                if (hasLocationPermission() || isPermissionBypassed) {
                    loadStations(showLoadingIndicator = true)
                } else {
                    isLoading = false
                    safeInvalidate()
                }
            }

            override fun onStart(owner: LifecycleOwner) {
                startLocationTracking()
            }

            override fun onStop(owner: LifecycleOwner) {
                stopLocationTracking()
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
     * Starts continuous GPS location updates to track movement while driving.
     */
    @SuppressLint("MissingPermission")
    private fun startLocationTracking() {
        if (!hasLocationPermission() || isLocationTrackingActive) return
        try {
            val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 15_000L) // every 15s
                .setMinUpdateDistanceMeters(500f) // at least 500m movement
                .setMinUpdateIntervalMillis(10_000L)
                .build()

            locationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
            isLocationTrackingActive = true
            Log.d(TAG, "Vehicle GPS live tracking started")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to start live GPS tracking", e)
        }
    }

    /**
     * Stops continuous GPS location updates when screen is not visible to conserve battery.
     */
    private fun stopLocationTracking() {
        if (isLocationTrackingActive) {
            try {
                locationClient.removeLocationUpdates(locationCallback)
                isLocationTrackingActive = false
                Log.d(TAG, "Vehicle GPS live tracking stopped")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to stop live GPS tracking", e)
            }
        }
    }

    /**
     * Checks if the vehicle has moved far enough to automatically reload stations.
     */
    private fun handleVehicleMovement(location: Location) {
        val results = FloatArray(1)
        Location.distanceBetween(lastLoadedLat, lastLoadedLng, location.latitude, location.longitude, results)
        val metersMoved = results[0]

        currentLat = location.latitude
        currentLng = location.longitude

        // Automatically reload stations if car has traveled at least 2 km
        if (metersMoved >= AUTO_REFRESH_DISTANCE_METERS && !isLoading) {
            Log.d(TAG, "Vehicle moved ${metersMoved.toInt()}m -> auto-refreshing stations for new position")
            loadStations(showLoadingIndicator = false)
        }
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
    private fun loadStations(showLoadingIndicator: Boolean = true) {
        if (showLoadingIndicator) {
            isLoading = true
            errorMessage = null
            safeInvalidate()
        }

        scope.launch {
            try {
                // 1. Resolve fresh GPS Coordinates if permission is granted
                if (hasLocationPermission()) {
                    try {
                        val tokenSource = CancellationTokenSource()
                        val freshLocation = withTimeoutOrNull(4000L) {
                            locationClient.getCurrentLocation(
                                Priority.PRIORITY_HIGH_ACCURACY,
                                tokenSource.token
                            ).await()
                        } ?: locationClient.lastLocation.await()

                        if (freshLocation != null) {
                            currentLat = freshLocation.latitude
                            currentLng = freshLocation.longitude
                            lastLoadedLat = freshLocation.latitude
                            lastLoadedLng = freshLocation.longitude
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Could not obtain fresh location, using last known or default", e)
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
                    allRawStations = body.stations ?: emptyList()

                    stations = sortStationsByCurrentFuel(allRawStations)
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
     * Switches the active fuel type, persists preference, and resorts stations.
     */
    private fun switchFuelType() {
        currentFuelType = currentFuelType.next()
        prefs.edit().putString(PREF_KEY_FUEL, currentFuelType.name).apply()
        stations = sortStationsByCurrentFuel(allRawStations)
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
                        .setOnClickListener { loadStations(showLoadingIndicator = true) }
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
                                        startLocationTracking()
                                        loadStations(showLoadingIndicator = true)
                                    }
                                }
                            } catch (e: Exception) {
                                Log.e(TAG, "requestPermissions failed", e)
                                isPermissionBypassed = true
                                loadStations(showLoadingIndicator = true)
                            }
                        }
                        .build()
                )
                .addAction(
                    Action.Builder()
                        .setTitle("Ohne GPS fortfahren")
                        .setOnClickListener {
                            isPermissionBypassed = true
                            loadStations(showLoadingIndicator = true)
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
                        .setOnClickListener { loadStations(showLoadingIndicator = true) }
                        .build()
                )
                .addAction(
                    Action.Builder()
                        .setTitle("Sprit: ${currentFuelType.displayName}")
                        .setOnClickListener { switchFuelType() }
                        .build()
                )
                .build()
        }

        // 3. Action Strip (strictly max 2 actions for PlaceListMapTemplate compliance):
        // Button 1: Spritart umschalten (z. B. "Sprit: Diesel")
        // Button 2: Manueller Standort- und Daten-Refresh
        val actionStrip = ActionStrip.Builder()
            .addAction(
                Action.Builder()
                    .setTitle("Sprit: ${currentFuelType.displayName}")
                    .setOnClickListener { switchFuelType() }
                    .build()
            )
            .addAction(
                Action.Builder()
                    .setTitle("Aktualisieren")
                    .setOnClickListener {
                        try {
                            CarToast.makeText(carContext, "Standort wird aktualisiert...", CarToast.LENGTH_SHORT).show()
                        } catch (e: Exception) {
                            Log.w(TAG, "Toast display failed", e)
                        }
                        loadStations(showLoadingIndicator = true)
                    }
                    .build()
            )
            .build()

        // 4. Loading state
        if (isLoading) {
            val loadingBuilder = PlaceListMapTemplate.Builder()
                .setTitle("${currentFuelType.displayName} • Günstigste")
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

        // Prominente KI-Check Karte an Position 1, wenn ein lohnender Umweg existiert
        if (stations.size >= 2) {
            val cheapest = stations.first()
            val nearest = stations.minByOrNull { it.dist ?: Double.MAX_VALUE }
            if (nearest != null && cheapest.id != nearest.id) {
                val result = AiDetourAdvisor.calculate(cheapest, nearest, currentFuelType)
                val aiRow = Row.Builder()
                    .setTitle("✨ KI-Check: ${result.badge}")
                    .addText("Tippen für Ersparnis & Straßen-Kostenbilanz")
                    .setBrowsable(true)
                    .setOnClickListener {
                        screenManager.push(AiDetourScreen(carContext, cheapest, nearest, currentFuelType))
                    }
                    .build()
                listBuilder.addItem(aiRow)
            }
        }

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

            // Line 1: Dedicated distance span required by Android Auto PlaceListMapTemplate
            val distanceSpanText = SpannableString(" ")
            distanceSpanText.setSpan(distanceSpan, 0, 1, Spannable.SPAN_INCLUSIVE_INCLUSIVE)

            // Line 2: Explicit price per liter and address
            val addressPart = listOfNotNull(station.street, station.place).filter { it.isNotBlank() }.joinToString(", ")
            val secondLine = "$priceFormatted/L  •  $addressPart  •  $statusText"

            // Row Title: Prominent price + station brand/name (e.g. "1,62⁹ € • RLT Bielefeld")
            val rowTitle = "$priceFormatted  •  ${station.getDisplayBrand()}"

            val row = Row.Builder()
                .setTitle(rowTitle)
                .addText(distanceSpanText)
                .addText(secondLine)
                .setMetadata(Metadata.Builder().setPlace(place).build())
                .setOnClickListener { startNavigation(station) }
                .build()

            listBuilder.addItem(row)
        }

        // Title is kept concise so it never truncates on vehicle screens (e.g. "Diesel • Günstigste")
        val templateBuilder = PlaceListMapTemplate.Builder()
            .setTitle("${currentFuelType.displayName} • Günstigste")
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
