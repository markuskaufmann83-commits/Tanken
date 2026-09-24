package de.spritradar.auto.ui.util

import android.content.Context
import android.widget.ImageView
import coil.ImageLoader
import coil.decode.SvgDecoder
import coil.load
import de.spritradar.auto.BuildConfig
import de.spritradar.auto.R

/**
 * Resolves the official vector brand logo for any gas station based on brand string or station name.
 * Supports both embedded local vector drawables as fallbacks and live dynamic SVG loading from Azure.
 */
object BrandLogoHelper {

    private var svgImageLoader: ImageLoader? = null

    private fun getImageLoader(context: Context): ImageLoader {
        return svgImageLoader ?: synchronized(this) {
            svgImageLoader ?: ImageLoader.Builder(context.applicationContext)
                .components {
                    add(SvgDecoder.Factory())
                }
                .crossfade(true)
                .build().also { svgImageLoader = it }
        }
    }

    fun getBrandSlug(brand: String?, name: String?): String {
        val combined = "${brand ?: ""} ${name ?: ""}".uppercase()
        return when {
            combined.contains("ARAL") -> "aral"
            combined.contains("SHELL") -> "shell"
            combined.contains("JET") -> "jet"
            combined.contains("ESSO") -> "esso"
            combined.contains("TOTAL") -> "total"
            combined.contains("HEM") -> "hem"
            combined.contains("AVIA") -> "avia"
            combined.contains("STAR") -> "star"
            combined.contains("ENI") || combined.contains("AGIP") -> "eni"
            combined.contains("OMV") -> "omv"
            combined.contains("WESTFALEN") -> "westfalen"
            combined.contains("BFT") -> "bft"
            combined.contains("Q1") -> "q1"
            else -> "generic"
        }
    }

    fun getBrandLogoResId(brand: String?, name: String?): Int {
        return when (getBrandSlug(brand, name)) {
            "aral" -> R.drawable.logo_brand_aral
            "shell" -> R.drawable.logo_brand_shell
            "jet" -> R.drawable.logo_brand_jet
            "esso" -> R.drawable.logo_brand_esso
            "total" -> R.drawable.logo_brand_total
            "hem" -> R.drawable.logo_brand_hem
            "avia" -> R.drawable.logo_brand_avia
            "star" -> R.drawable.logo_brand_star
            "eni" -> R.drawable.logo_brand_eni
            "omv" -> R.drawable.logo_brand_omv
            "westfalen" -> R.drawable.logo_brand_westfalen
            "bft" -> R.drawable.logo_brand_bft
            "q1" -> R.drawable.logo_brand_q1
            else -> R.drawable.logo_brand_generic
        }
    }

    /**
     * Loads the brand logo into the given ImageView:
     * - Checks Azure online static assets (e.g. https://.../brands/aral.svg)
     * - Caches the SVG locally on device
     * - Instantly falls back to local embedded VectorDrawable if offline or loading
     */
    fun loadBrandLogo(imageView: ImageView, brand: String?, name: String?) {
        val slug = getBrandSlug(brand, name)
        val fallbackRes = getBrandLogoResId(brand, name)
        val baseUrl = BuildConfig.AZURE_API_BASE_URL.trimEnd('/')
        val remoteUrl = "$baseUrl/brands/$slug.svg"

        imageView.load(remoteUrl, getImageLoader(imageView.context)) {
            placeholder(fallbackRes)
            error(fallbackRes)
            crossfade(true)
        }
    }
}
