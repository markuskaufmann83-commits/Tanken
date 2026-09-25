package de.spritradar.auto

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Color
import android.location.Location
import android.net.Uri
import android.os.Bundle
import android.os.Looper
import android.util.Log
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.material.button.MaterialButton
import de.spritradar.auto.data.api.ApiClient
import de.spritradar.auto.data.model.FuelType
import de.spritradar.auto.data.model.Station
import de.spritradar.auto.databinding.ActivityMainBinding
import de.spritradar.auto.ui.AiDetourBottomSheet
import de.spritradar.auto.ui.adapter.StationAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull

/**
 * Native Smartphone Activity displaying live gas stations, real-time prices,
 * fuel tabs, and one-tap navigation, while companion Android Auto service
 * projects directly onto the vehicle head unit when connected.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
        private const val DEFAULT_LAT = 52.5200 // Berlin Mitte fallback
        private const val DEFAULT_LNG = 13.4050
        private const val SEARCH_RADIUS_KM = 10
    }

    private lateinit var binding: ActivityMainBinding
    private lateinit var stationAdapter: StationAdapter
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    // Current State
    private var selectedFuelType: FuelType = FuelType.E10
    private var currentLat: Double = DEFAULT_LAT
    private var currentLng: Double = DEFAULT_LNG
    private var isUsingGpsLocation: Boolean = false
    private var cachedStations: List<Station> = emptyList()

    private var isLocationTrackingActive: Boolean = false

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val loc = result.lastLocation ?: return
            val distMoved = FloatArray(1)
            Location.distanceBetween(currentLat, currentLng, loc.latitude, loc.longitude, distMoved)
            val metersMoved = distMoved[0]

            // If we didn't have GPS coordinates yet or moved more than 400m, refresh stations
            if (!isUsingGpsLocation || metersMoved > 400f) {
                Log.d(TAG, "Live GPS update received: ${loc.latitude}, ${loc.longitude} (moved ${metersMoved.toInt()}m)")
                currentLat = loc.latitude
                currentLng = loc.longitude
                isUsingGpsLocation = true
                loadStations()
            }
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false

        if (fineGranted || coarseGranted) {
            binding.cardPermission.visibility = View.GONE
            startLocationUpdates()
            loadStations()
        } else {
            binding.cardPermission.visibility = View.VISIBLE
            loadStations()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            windowInsets
        }
        ViewCompat.requestApplyInsets(binding.root)

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        setupRecyclerView()
        setupFuelTabs()
        setupListeners()
        checkPermissionsAndLoad()
    }

    override fun onResume() {
        super.onResume()
        startLocationUpdates()
    }

    override fun onPause() {
        super.onPause()
        stopLocationUpdates()
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        val hasFine = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if ((hasFine || hasCoarse) && !isLocationTrackingActive) {
            try {
                val req = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10_000L)
                    .setMinUpdateDistanceMeters(300f)
                    .setMinUpdateIntervalMillis(5_000L)
                    .build()
                fusedLocationClient.requestLocationUpdates(req, locationCallback, Looper.getMainLooper())
                isLocationTrackingActive = true
                Log.d(TAG, "Live GPS tracking started in MainActivity")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to start live GPS tracking", e)
            }
        }
    }

    private fun stopLocationUpdates() {
        if (isLocationTrackingActive) {
            try {
                fusedLocationClient.removeLocationUpdates(locationCallback)
                isLocationTrackingActive = false
                Log.d(TAG, "Live GPS tracking stopped in MainActivity")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to stop live GPS tracking", e)
            }
        }
    }

    private fun setupRecyclerView() {
        stationAdapter = StationAdapter(
            stations = emptyList(),
            currentFuelType = selectedFuelType,
            onNavigateClick = { station -> navigateToStation(station) }
        )
        binding.rvStations.layoutManager = LinearLayoutManager(this)
        binding.rvStations.adapter = stationAdapter
    }

    private fun setupFuelTabs() {
        val saved = getSharedPreferences("tankpilot_prefs", MODE_PRIVATE)
            .getString("car_fuel_type", null)
        if (saved != null) {
            try {
                selectedFuelType = FuelType.valueOf(saved)
            } catch (e: Exception) {
                // Ignore
            }
        }

        binding.btnFuelE10.setOnClickListener { selectFuelType(FuelType.E10) }
        binding.btnFuelDiesel.setOnClickListener { selectFuelType(FuelType.DIESEL) }
        binding.btnFuelE5.setOnClickListener { selectFuelType(FuelType.E5) }
        updateFuelTabStyles()
    }

    private fun setupListeners() {
        binding.swipeRefresh.setOnRefreshListener {
            loadStations()
        }

        binding.btnRefresh.setOnClickListener {
            loadStations()
        }

        binding.btnGrantPermission.setOnClickListener {
            requestLocationPermissions()
        }

        binding.layoutAndroidAutoBanner.setOnClickListener {
            showAndroidAutoSetupDialog()
        }
    }

    private fun checkPermissionsAndLoad() {
        val hasFine = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val hasCoarse = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (hasFine || hasCoarse) {
            binding.cardPermission.visibility = View.GONE
            startLocationUpdates()
            loadStations()
        } else {
            binding.cardPermission.visibility = View.VISIBLE
            requestLocationPermissions()
        }
    }

    private fun requestLocationPermissions() {
        permissionLauncher.launch(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
        )
    }

    private fun selectFuelType(fuelType: FuelType) {
        if (selectedFuelType == fuelType) return
        selectedFuelType = fuelType
        getSharedPreferences("tankpilot_prefs", MODE_PRIVATE)
            .edit()
            .putString("car_fuel_type", fuelType.name)
            .apply()
        updateFuelTabStyles()
        renderStations()
    }

    private fun updateFuelTabStyles() {
        val activeBg = ContextCompat.getColor(this, R.color.primary)
        val activeText = ContextCompat.getColor(this, R.color.background)
        val inactiveText = ContextCompat.getColor(this, R.color.on_surface_muted)
        val strokeColor = ContextCompat.getColor(this, R.color.surface_border)
        val strokeWidth = (1 * resources.displayMetrics.density).toInt()

        val buttons = listOf(
            binding.btnFuelE10 to FuelType.E10,
            binding.btnFuelDiesel to FuelType.DIESEL,
            binding.btnFuelE5 to FuelType.E5
        )

        for ((btn, fuel) in buttons) {
            if (fuel == selectedFuelType) {
                btn.backgroundTintList = ColorStateList.valueOf(activeBg)
                btn.setTextColor(activeText)
                btn.strokeColor = ColorStateList.valueOf(Color.TRANSPARENT)
                btn.strokeWidth = 0
            } else {
                btn.backgroundTintList = ColorStateList.valueOf(Color.TRANSPARENT)
                btn.setTextColor(inactiveText)
                btn.strokeColor = ColorStateList.valueOf(strokeColor)
                btn.strokeWidth = strokeWidth
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun loadStations() {
        binding.tvError.visibility = View.GONE
        if (!binding.swipeRefresh.isRefreshing) {
            binding.pbLoading.visibility = View.VISIBLE
        }

        lifecycleScope.launch {
            // 1. Fetch fresh GPS location from hardware sensors
            val hasFine = ContextCompat.checkSelfPermission(
                this@MainActivity,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            val hasCoarse = ContextCompat.checkSelfPermission(
                this@MainActivity,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            if (hasFine || hasCoarse) {
                try {
                    val tokenSource = CancellationTokenSource()
                    val freshLocation = withTimeoutOrNull(4000L) {
                        fusedLocationClient.getCurrentLocation(
                            Priority.PRIORITY_HIGH_ACCURACY,
                            tokenSource.token
                        ).await()
                    } ?: fusedLocationClient.lastLocation.await()

                    if (freshLocation != null) {
                        currentLat = freshLocation.latitude
                        currentLng = freshLocation.longitude
                        isUsingGpsLocation = true
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to get fresh GPS location", e)
                }
            }

            // 2. Fetch stations from Azure API
            try {
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
                    cachedStations = body.stations ?: emptyList()
                    renderStations()
                } else {
                    binding.tvError.text = "Fehler bei der Serverabfrage (HTTP ${response.code()})"
                    binding.tvError.visibility = View.VISIBLE
                }
            } catch (e: Exception) {
                binding.tvError.text = "Verbindungsfehler: ${e.localizedMessage ?: "Keine Internetverbindung"}"
                binding.tvError.visibility = View.VISIBLE
            } finally {
                binding.pbLoading.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun renderStations() {
        if (cachedStations.isEmpty()) {
            binding.cardBestPrice.visibility = View.GONE
            binding.tvStationCount.text = "Keine Tankstellen gefunden"
            stationAdapter.updateData(emptyList(), selectedFuelType)
            return
        }

        // Sort stations: open stations with valid price first, sorted ascending by price
        val sortedList = cachedStations.sortedWith(
            compareBy<Station> { !it.isOpen }
                .thenBy { it.getPrice(selectedFuelType) ?: Double.MAX_VALUE }
                .thenBy { it.dist ?: Double.MAX_VALUE }
        )

        // Find cheapest open station for Hero Card
        val bestPriceStation = sortedList.firstOrNull {
            it.isOpen && it.getPrice(selectedFuelType) != null
        }

        // Find nearest open station
        val nearestStation = cachedStations.filter { it.isOpen && it.dist != null }
            .minByOrNull { it.dist ?: Double.MAX_VALUE }

        // Update subtitle with detected town / live status
        val detectedPlace = nearestStation?.place?.takeIf { it.isNotBlank() } ?: "Umgebung"
        if (isUsingGpsLocation) {
            binding.tvLocationSub.text = "$detectedPlace • Live-GPS aktiv • Umkreis ${SEARCH_RADIUS_KM} km"
        } else {
            binding.tvLocationSub.text = "Standard-Standort (Berlin) • Umkreis ${SEARCH_RADIUS_KM} km"
        }

        if (bestPriceStation != null) {
            binding.cardBestPrice.visibility = View.VISIBLE
            de.spritradar.auto.ui.util.BrandLogoHelper.loadBrandLogo(
                binding.ivHeroBrandLogo,
                bestPriceStation.brand,
                bestPriceStation.name
            )
            binding.tvHeroPrice.text = bestPriceStation.formatPrice(selectedFuelType)
            binding.tvHeroName.text = bestPriceStation.name
            binding.tvHeroAddress.text = "${bestPriceStation.getFullAddress()} • ${bestPriceStation.formatDistance()}"
            binding.btnHeroNavigate.setOnClickListener { navigateToStation(bestPriceStation) }

            if (nearestStation != null) {
                binding.btnHeroAiCheck.visibility = View.VISIBLE
                binding.btnHeroAiCheck.setOnClickListener {
                    openAiDetourSheet(bestPriceStation, nearestStation)
                }
            } else {
                binding.btnHeroAiCheck.visibility = View.GONE
            }
        } else {
            binding.cardBestPrice.visibility = View.GONE
        }

        binding.tvStationCount.text = "${sortedList.size} Tankstellen in deiner Umgebung"
        stationAdapter.updateData(sortedList, selectedFuelType)
    }

    private fun openAiDetourSheet(cheapest: Station, nearest: Station) {
        val sheet = AiDetourBottomSheet.newInstance(
            cheapest = cheapest,
            nearest = nearest,
            fuelType = selectedFuelType,
            onNavigate = { station -> navigateToStation(station) }
        )
        sheet.show(supportFragmentManager, "AiDetourBottomSheet")
    }

    private fun showAndroidAutoSetupDialog() {
        com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
            .setTitle("Android Auto Einrichtung")
            .setMessage(
                "Damit direkt per APK installierte Apps auf dem Fahrzeugdisplay angezeigt werden, verlangt Google die Freigabe 'Unbekannte Quellen' in den Android Auto Einstellungen:\n\n" +
                "1. Öffne die Einstellungen deines Telefons und suche nach 'Android Auto'.\n\n" +
                "2. Scrolle ganz nach unten und tippe 10-mal schnell auf 'Version', um die Entwicklereinstellungen freizuschalten.\n\n" +
                "3. Tippe oben rechts auf das 3-Punkte-Menü (⋮) -> 'Entwicklereinstellungen' und aktiviere 'Unbekannte Quellen'.\n\n" +
                "4. Prüfe unter 'Launcher anpassen', dass TankPilot aktiviert ist.\n\n" +
                "Danach erscheint TankPilot sofort im App-Menü deines Autos!"
            )
            .setPositiveButton("Zu den Einstellungen") { _, _ ->
                try {
                    val intent = Intent("com.google.android.gms.car.CAR_PREFS")
                    startActivity(intent)
                } catch (e: Exception) {
                    try {
                        startActivity(Intent(android.provider.Settings.ACTION_SETTINGS))
                    } catch (ex: Exception) {
                        // Ignore
                    }
                }
            }
            .setNegativeButton("Verstanden", null)
            .show()
    }

    private fun navigateToStation(station: Station) {
        val geoUri = Uri.parse("geo:${station.lat},${station.lng}?q=${station.lat},${station.lng}(${Uri.encode(station.name)})")
        val mapIntent = Intent(Intent.ACTION_VIEW, geoUri)

        try {
            startActivity(mapIntent)
        } catch (e: Exception) {
            val webUri = Uri.parse("https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}")
            startActivity(Intent(Intent.ACTION_VIEW, webUri))
        }
    }
}
