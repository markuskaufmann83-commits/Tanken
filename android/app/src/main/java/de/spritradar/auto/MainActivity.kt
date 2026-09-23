package de.spritradar.auto

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import de.spritradar.auto.data.api.ApiClient
import de.spritradar.auto.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Smartphone companion activity for permission configuration and backend connectivity testing.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false

        updatePermissionUi(fineGranted || coarseGranted)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupPermissions()
        setupApiTester()
    }

    override fun onResume() {
        super.onResume()
        checkCurrentPermissions()
    }

    private fun setupPermissions() {
        binding.btnGrantPermission.setOnClickListener {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
        checkCurrentPermissions()
    }

    private fun checkCurrentPermissions() {
        val fineGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val coarseGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        updatePermissionUi(fineGranted || coarseGranted)
    }

    private fun updatePermissionUi(isGranted: Boolean) {
        if (isGranted) {
            binding.tvPermissionStatus.text = "✓ Standortberechtigung erteilt. Die App kann deinen aktuellen Standort auf dem Fahrzeugdisplay verwenden."
            binding.tvPermissionStatus.setTextColor(ContextCompat.getColor(this, R.color.emerald))
            binding.btnGrantPermission.visibility = View.GONE
        } else {
            binding.tvPermissionStatus.text = "Standortberechtigung fehlt. Bitte erteile die Berechtigung, damit Android Auto Tankstellen in deiner Nähe findet."
            binding.tvPermissionStatus.setTextColor(ContextCompat.getColor(this, R.color.on_surface_muted))
            binding.btnGrantPermission.visibility = View.VISIBLE
        }
    }

    private fun setupApiTester() {
        binding.btnTestApi.setOnClickListener {
            testAzureConnection()
        }
    }

    private fun testAzureConnection() {
        binding.pbApiLoading.visibility = View.VISIBLE
        binding.btnTestApi.isEnabled = false
        binding.tvApiStatus.text = getString(R.string.api_testing)
        binding.tvApiStatus.setTextColor(ContextCompat.getColor(this, R.color.on_surface_muted))

        val startTime = System.currentTimeMillis()

        lifecycleScope.launch {
            try {
                // Test with Berlin Mitte coordinates
                val response = withContext(Dispatchers.IO) {
                    ApiClient.stationApiService.getStations(
                        lat = 52.5200,
                        lng = 13.4050,
                        rad = 5,
                        sort = "dist",
                        type = "all"
                    )
                }

                val duration = System.currentTimeMillis() - startTime

                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    val count = body.stations?.size ?: 0
                    val status = body.status ?: "ok"

                    binding.tvApiStatus.text = "✓ Verbindung erfolgreich (${duration} ms)\nStatus: $status • $count Tankstellen empfangen.\nAzure Backend ist voll einsatzbereit für Android Auto!"
                    binding.tvApiStatus.setTextColor(ContextCompat.getColor(this@MainActivity, R.color.emerald))
                } else {
                    binding.tvApiStatus.text = "Fehler bei der Anfrage: HTTP ${response.code()} (${response.message()})"
                    binding.tvApiStatus.setTextColor(ContextCompat.getColor(this@MainActivity, R.color.rose))
                }
            } catch (e: Exception) {
                binding.tvApiStatus.text = "Verbindungsfehler: ${e.localizedMessage ?: "Unbekannter Fehler"}\nBitte Internetverbindung prüfen."
                binding.tvApiStatus.setTextColor(ContextCompat.getColor(this@MainActivity, R.color.rose))
            } finally {
                binding.pbApiLoading.visibility = View.GONE
                binding.btnTestApi.isEnabled = true
            }
        }
    }
}
