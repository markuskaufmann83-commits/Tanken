plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "de.spritradar.auto"
    compileSdk = 34

    defaultConfig {
        applicationId = "de.spritradar.aut"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Production Azure Static Web App Base URL
        buildConfigField("String", "AZURE_API_BASE_URL", "\"https://icy-stone-09b17d803.6.azurestaticapps.net/\"")
    }

    signingConfigs {
        create("release") {
            val keystoreFile = file("tankpilot-upload.jks")
            if (keystoreFile.exists()) {
                storeFile = keystoreFile
                storePassword = System.getenv("KEYSTORE_PASSWORD") ?: "tankpilot2026"
                keyAlias = System.getenv("KEY_ALIAS") ?: "tankpilot"
                keyPassword = System.getenv("KEY_PASSWORD") ?: "tankpilot2026"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            val releaseSigning = signingConfigs.getByName("release")
            if (releaseSigning.storeFile != null && releaseSigning.storeFile!!.exists()) {
                signingConfig = releaseSigning
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    // Android for Cars App Library (Official POI / Fueling support)
    implementation("androidx.car.app:app:1.4.0")
    implementation("androidx.car.app:app-projected:1.4.0")

    // Android Core & UI
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")

    // Google Play Services Location (FusedLocationProviderClient)
    implementation("com.google.android.gms:play-services-location:21.3.0")

    // Coroutines & Play Services integration
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")

    // Networking: Retrofit 2, Gson, OkHttp
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Coil Image Loading with SVG Support (Live Azure logo loading)
    implementation("io.coil-kt:coil:2.6.0")
    implementation("io.coil-kt:coil-svg:2.6.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
