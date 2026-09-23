# SpritRadar Auto – Android Auto POI / Fueling App

Native Android-App in **Kotlin** mit vollständiger Unterstützung für **Android Auto** basierend auf der offiziellen **Android for Cars App Library (`androidx.car.app:app:1.4.0`)** in der Kategorie **POI (Point of Interest / Fueling)**.

Die App konsumiert die bestehende serverlose Azure-API (`https://icy-stone-09b17d803.6.azurestaticapps.net/api/stations`) und zeigt die günstigsten Tankstellen in Echtzeit auf dem Fahrzeugdisplay an.

---

## 🚗 Architektur & Komponenten

1. **Android Auto Service (`FuelCarAppService : CarAppService`)**
   - Registriert im `AndroidManifest.xml` für die Kategorie `androidx.car.app.category.POI`.
   - Startet eine `FuelSession` für das Fahrzeugdisplay.
   - `HostValidator.ALLOW_ALL_HOSTS_VALIDATOR` für Tests mit der Desktop Head Unit (DHU) und echten Fahrzeugen.

2. **Fahrzeug-Bildschirm (`MainStationListScreen : Screen`)**
   - Nutzt das offizielle `PlaceListMapTemplate`:
     - Zeigt die Tankstellen sortiert nach dem günstigsten Preis des gewählten Kraftstoffs.
     - Hochgestellte dritte Dezimalstelle für den Cent-Bruchteil (z. B. `1,68⁹ €/L`).
     - Map-Marker (`PlaceMarker`) mit Geokoordinaten auf der Fahrzeugkarte.
     - **Navigation:** Ein Klick auf eine Station öffnet die turn-by-turn Navigation im Fahrzeug über den Standard `geo:` Intent (`ACTION_VIEW`).
     - **ActionStrip:** Schnelle Kraftstoff-Umschaltung (**Super E10**, **Diesel**, **Super E5**) und Aktualisieren-Button direkt am Display.

3. **Smartphone-Begleit-App (`MainActivity`)**
   - Verwaltet die Standortberechtigungen (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`).
   - Bietet einen integrierten **Live-Verbindungstest zur Azure-API** mit Latenzmessung und Statusprüfung.
   - Informiert den Fahrer, sobald das Smartphone mit dem Auto verbunden wird.

4. **API-Client & Datenmodell (`StationApiService` & `ApiClient`)**
   - Retrofit 2 + Gson Converter + OkHttp Logging Interceptor.
   - Konfigurierbare Basis-URL über `BuildConfig.AZURE_API_BASE_URL`.

---

## 🛠️ Schnellstart mit Android Studio

1. **Projekt öffnen:**
   - Öffne Android Studio.
   - Wähle **Open** und navigiere zum Ordner `c:\Projekte\Tanken\android`.
   - Android Studio lädt das Projekt und synchronisiert die Gradle-Abhängigkeiten automatisch.

2. **Smartphone / Emulator starten:**
   - Verbinde ein Android-Smartphone (Android 8.0 / API 26 oder neuer) per USB (USB-Debugging aktivieren).
   - Klicke auf **Run 'app'** (`Shift + F10`).
   - Erteile auf dem Smartphone die Standortberechtigung und teste die Backend-Verbindung.

3. **Testen mit der Android Auto Desktop Head Unit (DHU):**
   - Installiere auf deinem PC das **Desktop Head Unit (DHU)** Tool aus dem Android SDK Manager (*SDK Tools > Android Auto Desktop Head Unit Emulator*).
   - Aktiviere auf dem Android-Smartphone in der **Android Auto App** die Entwicklereinstellungen:
     - Tippe 10x auf *Version* bis der Entwicklermodus aktiv ist.
     - Wähle im 3-Punkte-Menü *Head-Unit-Server starten*.
   - Leite den Port per ADB weiter:
     ```bash
     adb forward tcp:5277 tcp:5277
     ```
   - Starte die DHU auf deinem PC:
     ```bash
     desktop-head-unit.exe
     ```
   - Die SpritRadar-App erscheint sofort in der App-Liste von Android Auto auf dem simulierten Fahrzeugdisplay!
