package de.spritradar.auto.ui

import android.content.Intent
import androidx.car.app.Screen
import androidx.car.app.Session

/**
 * Manages the screen backstack and lifecycle of the Android Auto session.
 */
class FuelSession : Session() {

    /**
     * Instantiates the primary root screen when the user launches the app on the head unit.
     */
    override fun onCreateScreen(intent: Intent): Screen {
        return MainStationListScreen(carContext)
    }
}
