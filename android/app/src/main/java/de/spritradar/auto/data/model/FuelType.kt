package de.spritradar.auto.data.model

/**
 * Supported fuel types matching the Tankerkönig API and SpritRadar web application.
 */
enum class FuelType(val apiKey: String, val displayName: String, val shortName: String) {
    E10("e10", "Super E10", "E10"),
    DIESEL("diesel", "Diesel", "B7"),
    E5("e5", "Super E5", "E5");

    /**
     * Cycles to the next fuel type for quick toggling on the vehicle display
     */
    fun next(): FuelType = when (this) {
        E10 -> DIESEL
        DIESEL -> E5
        E5 -> E10
    }
}
