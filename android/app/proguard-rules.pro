# Retrofit and Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class de.spritradar.auto.data.model.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Android Auto (CarAppService)
-keep public class de.spritradar.auto.service.FuelCarAppService
-keep public class * extends androidx.car.app.CarAppService
-keep public class * extends androidx.car.app.Screen
-keep public class * extends androidx.car.app.Session
