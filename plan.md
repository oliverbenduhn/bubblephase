# Entwicklungsplan: Phaser Bubble Shooter mit Mobile-Optimierung

Dieses Dokument beschreibt die Schritte zur Entwicklung eines Bubble Shooters mit Phaser, wobei der Fokus auf reinen Grafikelementen, schrittweisem Testen mit Jest und optimaler Unterstützung für mobile Geräte liegt.

## Phase 1: Grundgerüst und Setup

1.  **Phaser-Integration und erste Szene:**
    *   [x] Phaser-Instanz in die bestehende React-Anwendung (`src/main.jsx` oder eine dedizierte Komponente/Datei) integrieren.
    *   [x] Eine erste leere Phaser-Szene erstellen.
    *   [x] Sicherstellen, dass die Phaser-Leinwand korrekt im Browser angezeigt wird.
    *   **Test:** Manuelle Überprüfung im Browser.

2.  **Jest-Testumgebung einrichten:**
    *   [x] Jest und notwendige Abhängigkeiten installieren (z.B. `jest`, `@babel/preset-env`, `@babel/preset-react`, `babel-jest`, `@testing-library/jest-dom` falls React-Komponenten getestet werden sollen, die Phaser wrappen).
    *   [x] `jest.config.js` (oder Konfiguration in `package.json`) erstellen.
    *   [x] Babel-Konfiguration (`babel.config.js` oder `.babelrc`) anpassen, um mit Jest zu funktionieren.
    *   [x] Ein erstes einfaches Test-Skript in `package.json` hinzufügen (z.B. `npm test`).
    *   [x] Einen ersten trivialen Test schreiben (z.B. `expect(true).toBe(true);`), um die Einrichtung zu validieren.
    *   **Test:** `npm test` erfolgreich ausführen.

3.  **Mobile Konfiguration:**
    *   [x] Responsive Canvas-Größe einrichten, die sich an verschiedene Bildschirmgrößen anpasst.
    *   [x] Viewport-Meta-Tags für mobile Geräte konfigurieren (`<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`).
    *   [x] Touch-Input als primäre Eingabemethode einrichten (statt Maus).
    *   [x] Orientierungserkennung implementieren (Portrait vs. Landscape).
    *   **Test:** Grundlegende Anzeige auf verschiedenen Bildschirmgrößen und Orientierungen.

## Phase 2: Kernspiellogik und -elemente

4.  **Bubble-Darstellung:**
    *   [x] Eine `Bubble` Klasse oder Funktion erstellen, die eine einzelne Bubble repräsentiert (Eigenschaften: Farbe, Position, Radius).
    *   [x] Bubbles mit Phasers Grafikprimitiven (z.B. `Phaser.GameObjects.Arc`) in der Szene zeichnen.
    *   [x] Eine kleine Anzahl statischer Bubbles zur Anzeige bringen.
    *   **Test (Jest):**
        *   [x] Test für die `Bubble`-Klasse: Korrekte Initialisierung der Eigenschaften.
        *   [x] (Optional, falls komplexer) Test für die korrekte Erstellung von Grafikobjekten (kann schwierig sein, reine Phaser-Grafikobjekte direkt mit Jest zu testen, evtl. Logik mocken).

5.  **Spielfeld-Gitter:**
    *   [x] Logik für das hexagonale oder rechteckige Gitter des Spielfelds entwickeln (Berechnung von Positionen).
    *   [x] Eine Datenstruktur zur Speicherung der Bubbles im Gitter implementieren.
    *   [x] Bubbles initial im Gitter anordnen.
    *   **Test (Jest):**
        *   [x] Test für Gitterberechnungen (z.B. Umrechnung von Gitterkoordinaten zu Pixelkoordinaten und umgekehrt).
        *   [x] Test für das korrekte Platzieren und Abrufen von Bubbles im Gitter.

6.  **Abschussmechanik:**
    *   [x] "Kanone" oder Abschusspunkt visuell darstellen (z.B. ein einfacher Kreis oder eine Linie).
    *   [x] Anzeige der nächsten abzuschießenden Bubble.
    *   [x] Eingabemethoden für das Zielen implementieren:
        *   [x] Touch-spezifische Steuerung für das Zielen auf mobilen Geräten.
        *   [x] Maus-Eingabe für Desktop-Geräte.
    *   [x] Visuelle Feedback-Elemente für Touch-Eingaben hinzufügen (z.B. sichtbare Ziellinie).
    *   [x] Logik zum Abschießen einer Bubble (Bewegung entlang des Winkels).
    *   [x] Kollision der abgeschossenen Bubble mit den oberen und seitlichen Wänden des Spielfelds.
    *   **Test (Jest):**
        *   [x] Test für die Berechnung des Abschusswinkels (für Touch und Maus).
        *   [x] Test für die Bewegungslogik der Bubble (ohne Kollision mit anderen Bubbles zunächst).

## Phase 3: Interaktion und Spielregeln

7.  **Kollisionserkennung und Anhaften:**
    *   [x] Kollisionserkennung zwischen der abgeschossenen Bubble und den Bubbles im Spielfeld implementieren.
    *   [x] Logik zum "Anhaften" der abgeschossenen Bubble im nächstbesten freien Gitterplatz.
    *   [x] Sicherstellen, dass die neue Bubble korrekt in die Gitterdatenstruktur eingefügt wird.
    *   **Test (Jest):**
        *   [x] Test für die Kollisionserkennung zwischen zwei Bubbles.
        *   [x] Test für die Logik, die den korrekten Anhaft-Gitterplatz findet.

8.  **Bubble-Gruppen-Erkennung und -Entfernung:**
    *   [ ] Algorithmus zum Finden von Gruppen zusammenhängender Bubbles gleicher Farbe (mindestens 3).
    *   [ ] Entfernen der gefundenen Gruppen aus dem Spielfeld und der Datenstruktur.
    *   **Test (Jest):**
        *   [ ] Test für den Algorithmus zur Gruppenerkennung (verschiedene Szenarien).
        *   [ ] Test für das korrekte Entfernen der Bubbles.

9.  **Entfernung "freischwebender" Bubbles:**
    *   [ ] Algorithmus implementieren, der Bubbles identifiziert, die nach dem Entfernen einer Gruppe nicht mehr mit der "Decke" des Spielfelds verbunden sind.
    *   [ ] Diese freischwebenden Bubbles entfernen.
    *   **Test (Jest):**
        *   [ ] Test für die Erkennung freischwebender Bubbles.

## Phase 4: Mobile UX/UI

10. **Mobile UI-Anpassungen:**
    *   [ ] Größenangepasste UI-Elemente für unterschiedliche Bildschirmgrößen.
    *   [ ] Touch-freundliche Steuerelemente (größere Buttons, mind. 44x44px).
    *   [ ] Gamepad-ähnliche On-Screen-Steuerung für Touch-Geräte.
    *   [ ] Feedback-Mechanismen für Touch-Interaktionen (Haptik, visuelle Effekte).
    *   **Test:** Usability-Tests auf verschiedenen mobilen Geräten.

11. **Performance-Optimierung für mobile Geräte:**
    *   [ ] Asset-Größen und -Auflösungen für mobile Geräte optimieren.
    *   [ ] Optimierung der Renderingpipeline (weniger Partikel, optimierte Grafiken).
    *   [ ] Implementierung von Asset-Preloading zur Reduzierung von Ladezeiten.
    *   [ ] Begrenzung der gleichzeitigen Animationen/Effekte.
    *   **Test:** Performance-Messungen auf verschiedenen Gerätetypen.

## Phase 5: Spielablauf und UI

12. **Spielzustände:**
    *   [ ] Implementierung von Spielzuständen (z.B. Start, Spiel läuft, Game Over).
    *   [ ] Logik für "Game Over" (z.B. wenn Bubbles den unteren Rand erreichen).
    *   [ ] Möglichkeit zum Neustart des Spiels.
    *   [ ] Anpassung der Spielzustands-UI an verschiedene Bildschirmgrößen.
    *   **Test (Jest):**
        *   [ ] Test für die Übergänge zwischen Spielzuständen.
        *   [ ] Test für die Game-Over-Bedingung.

13. **Punkte und UI-Elemente:**
    *   [ ] Einfache Punkteanzeige mit Phaser-Textobjekten.
    *   [ ] Aktualisierung der Punkte beim Entfernen von Bubbles.
    *   [ ] (Optional) Anzeige für "Nächste Bubble".
    *   [ ] Größenanpassung der UI-Elemente basierend auf Bildschirmgröße.
    *   [ ] Alternative Layouts für unterschiedliche Orientierungen (Portrait/Landscape).
    *   [ ] Touch-optimierte Menüs und Steuerelemente.
    *   **Test:**
        *   [ ] Test für die korrekte Punkteberechnung.
        *   [ ] UI-Tests auf verschiedenen Bildschirmgrößen und -auflösungen.

## Phase 6: Erweiterungen und Feinschliff

14. **Schwierigkeitsgrad:**
    *   [ ] Hinzufügen neuer Bubble-Reihen von oben nach einer bestimmten Anzahl von Schüssen oder Zeit.
    *   **Test (Jest):**
        *   [ ] Test für die Logik des Vorrückens der Bubbles.

15. **Spezial-Bubbles:**
    *   [ ] (Optional) Implementierung von Spezial-Bubbles (z.B. Bomben-Bubble, Regenbogen-Bubble).

16. **Mobile-spezifische Features:**
    *   [ ] Offline-Spielmodus implementieren.
    *   [ ] Progressive Web App (PWA) Funktionalität hinzufügen.
    *   [ ] Lokale Speicherung von Spielständen.
    *   [ ] Push-Benachrichtigungen für Engagement (optional).
    *   **Test:** Offline-Verfügbarkeit und PWA-Installation testen.

17. **Geräteübergreifende Anpassungen:**
    *   [ ] Batterieverbrauch optimieren (reduzierte Aktualisierungsrate bei Inaktivität).
    *   [ ] Anpassung an Unterbrechungen (Telefonate, Benachrichtigungen).
    *   [ ] Unterstützung für verschiedene Eingabegeräte (Touch, Maus, Tastatur).
    *   **Test:** Verhalten bei Unterbrechungen auf mobilen Geräten.

18. **Code-Refactoring und Optimierung:**
    *   [ ] Codebasis überprüfen und refaktorisieren.
    *   [ ] Performance-Optimierungen, falls notwendig.
    *   [ ] Testabdeckung erhöhen.

## Werkzeuge und Technologien

*   **Spiel-Engine:** Phaser 3
*   **Build-Tool:** Vite
*   **UI-Framework (Basis):** React (primär für das Setup, Phaser übernimmt die Spiel-Canvas)
*   **Styling (falls für HTML-Container benötigt):** Tailwind CSS
*   **Test-Framework:** Jest
*   **Sprache:** JavaScript (ES6+)
*   **Mobile Testing:** BrowserStack oder ähnliche Dienste für gerätespezifische Tests
*   **Performance Monitoring:** Lighthouse für Web-Performance-Analysen
*   **PWA Tools:** Workbox für Service Worker und Offline-Funktionalität

Dieser Plan dient als Richtlinie und kann bei Bedarf angepasst werden.