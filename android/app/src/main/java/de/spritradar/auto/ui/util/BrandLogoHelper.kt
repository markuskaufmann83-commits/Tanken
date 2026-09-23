package de.spritradar.auto.ui.util

import de.spritradar.auto.R

/**
 * Resolves the official vector brand logo for any gas station based on brand string or station name.
 */
object BrandLogoHelper {

    fun getBrandLogoResId(brand: String?, name: String?): Int {
        val combined = "${brand ?: ""} ${name ?: ""}".uppercase()

        return when {
            combined.contains("ARAL") -> R.drawable.logo_brand_aral
            combined.contains("SHELL") -> R.drawable.logo_brand_shell
            combined.contains("JET") -> R.drawable.logo_brand_jet
            combined.contains("ESSO") -> R.drawable.logo_brand_esso
            combined.contains("TOTAL") -> R.drawable.logo_brand_total
            combined.contains("HEM") -> R.drawable.logo_brand_hem
            combined.contains("AVIA") -> R.drawable.logo_brand_avia
            combined.contains("STAR") -> R.drawable.logo_brand_star
            else -> R.drawable.logo_brand_generic
        }
    }
}
