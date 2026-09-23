package de.spritradar.auto.data.model

import com.google.gson.annotations.SerializedName
import java.util.Locale

/**
 * Station model matching the JSON payload of the Azure /api/stations serverless endpoint.
 */
data class Station(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("brand")
    val brand: String? = null,

    @SerializedName("street")
    val street: String? = null,

    @SerializedName("houseNumber")
    val houseNumber: String? = null,

    @SerializedName("place")
    val place: String? = null,

    @SerializedName("lat")
    val lat: Double,

    @SerializedName("lng")
    val lng: Double,

    @SerializedName("dist")
    val dist: Double? = null,

    @SerializedName("diesel")
    val diesel: Double? = null,

    @SerializedName("e5")
    val e5: Double? = null,

    @SerializedName("e10")
    val e10: Double? = null,

    @SerializedName("isOpen")
    val isOpen: Boolean = true
) {
    /**
     * Resolves the price for the requested fuel type
     */
    fun getPrice(fuelType: FuelType): Double? {
        val price = when (fuelType) {
            FuelType.DIESEL -> diesel
            FuelType.E10 -> e10
            FuelType.E5 -> e5
        }
        return if (price != null && price > 0.0) price else null
    }

    /**
     * Formats price with German superscript third decimal digit (e.g. "1,68⁹ €/L")
     */
    fun formatPrice(fuelType: FuelType): String {
        val p = getPrice(fuelType) ?: return "— €"
        val priceStr = String.format(Locale.US, "%.3f", p)
        val parts = priceStr.split(".")
        if (parts.size == 2 && parts[1].length >= 3) {
            val intPart = parts[0]
            val decFirstTwo = parts[1].substring(0, 2)
            val decThird = parts[1][2]
            val supChar = when (decThird) {
                '0' -> '⁰'
                '1' -> '¹'
                '2' -> '²'
                '3' -> '³'
                '4' -> '⁴'
                '5' -> '⁵'
                '6' -> '⁶'
                '7' -> '⁷'
                '8' -> '⁸'
                '9' -> '⁹'
                else -> decThird
            }
            return "$intPart,$decFirstTwo$supChar €"
        }
        return String.format(Locale.GERMANY, "%.2f €", p)
    }

    /**
     * Formats distance in km or m
     */
    fun formatDistance(): String {
        val d = dist ?: return "—"
        return if (d < 1.0) {
            "${(d * 1000).toInt()} m"
        } else {
            String.format(Locale.GERMANY, "%.1f km", d)
        }
    }

    /**
     * Formats the clean station label (brand or station name)
     */
    fun getDisplayBrand(): String {
        return brand?.takeIf { it.isNotBlank() } ?: name
    }

    /**
     * Formats human-readable address line
     */
    fun getFullAddress(): String {
        val streetPart = listOfNotNull(street, houseNumber).filter { it.isNotBlank() }.joinToString(" ")
        val placePart = place ?: ""
        return if (streetPart.isNotBlank() && placePart.isNotBlank()) {
            "$streetPart, $placePart"
        } else {
            streetPart.ifBlank { placePart }
        }
    }
}

/**
 * API Response container returned by /api/stations
 */
data class StationsResponse(
    @SerializedName("ok")
    val ok: Boolean = false,

    @SerializedName("status")
    val status: String? = null,

    @SerializedName("message")
    val message: String? = null,

    @SerializedName("stations")
    val stations: List<Station>? = null
)
