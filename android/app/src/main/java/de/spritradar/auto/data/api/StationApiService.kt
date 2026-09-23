package de.spritradar.auto.data.api

import de.spritradar.auto.data.model.StationsResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * Retrofit interface defining endpoints on the Azure serverless backend.
 */
interface StationApiService {

    /**
     * Fetches gas stations within a given radius around lat/lng.
     *
     * @param lat Latitude in Germany (e.g. 52.5200)
     * @param lng Longitude in Germany (e.g. 13.4050)
     * @param rad Radius in km (1 - 25)
     * @param sort "dist" or "price"
     * @param type "all", "diesel", "e5", or "e10"
     */
    @GET("api/stations")
    suspend fun getStations(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("rad") rad: Int = 10,
        @Query("sort") sort: String = "dist",
        @Query("type") type: String = "all"
    ): Response<StationsResponse>
}
