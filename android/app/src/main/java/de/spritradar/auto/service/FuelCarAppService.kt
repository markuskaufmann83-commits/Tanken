package de.spritradar.auto.service

import androidx.car.app.CarAppService
import androidx.car.app.Session
import androidx.car.app.validation.HostValidator
import de.spritradar.auto.ui.FuelSession

/**
 * Entry point service for Android Auto.
 * Registered in AndroidManifest.xml for category androidx.car.app.category.POI
 */
class FuelCarAppService : CarAppService() {

    /**
     * Configures the host validator.
     * ALLOW_ALL_HOSTS_VALIDATOR allows running on real cars, Android Auto Wireless,
     * USB projection, and the Desktop Head Unit (DHU) during development.
     */
    override fun createHostValidator(): HostValidator {
        return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR
    }

    /**
     * Creates a new session for the connected car display.
     */
    override fun onCreateSession(): Session {
        return FuelSession()
    }
}
