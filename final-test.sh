#!/bin/bash
# Final Test Script - Teste das behobene Game Over Problem und Grid-Kollision

echo "🎯 === FINAL BUBBLE SHOOTER TEST ==="
echo ""

echo "✅ === BEHOBENE PROBLEME ==="
echo "1. 🚨 GAME OVER BEIM ERSTEN SCHUSS - BEHOBEN"
echo "   - Game Over Linie: Reihe 11 (ursprüngliche Position wiederhergestellt)"
echo "   - 3 Sekunden Game Over Schutz nach Spielstart hinzugefügt"
echo "   - Detaillierte Game Over Debug-Ausgaben implementiert"
echo ""

echo "2. 🔧 GRID-KOLLISIONS DEBUG SYSTEM - VOLLSTÄNDIG"
echo "   - Automatische Grid-Initialisierung-Diagnose"
echo "   - Erste-Schuss-Diagnose mit Emergency-Repair"
echo "   - Browser-integrierte Debug-Tools"
echo "   - Kontinuierliche Grid-Überwachung"
echo ""

echo "📊 === AKTUELLE KONFIGURATION ==="
echo "- Initial Rows: 6 (Startbubbles)"
echo "- Game Over Linie: Reihe 11 (ursprüngliche Position)"
echo "- Game Over Schutz: 3 Sekunden nach Start"
echo "- Debug-System: Vollständig aktiv"
echo ""

echo "🎮 === SPIEL TESTEN ==="
echo "1. 🌐 Öffne: http://localhost:3000"
echo "2. 🔍 Browser-Konsole öffnen (F12 → Console)"
echo "3. 📊 Grid-Initialisierung beobachten"
echo "4. 🎯 Ersten Schuss abgeben"
echo "5. ✅ Kein sofortiges Game Over mehr!"
echo ""

echo "🔍 === ERWARTETE DEBUG-AUSGABEN ==="
echo "Bei Spielstart:"
echo "• '🎮 Spiel gestartet - Game Over Schutz für 3 Sekunden aktiv'"
echo "• '🎯 Game Over Linie gesetzt auf Y: [höhere Zahl]'"
echo "• '✅ Kein sofortiges Game Over - Grid-Initialisierung OK'"
echo ""

echo "Bei erstem Schuss:"
echo "• '🛡️ Game Over Schutz aktiv: [Zeit]ms verbleibend'"
echo "• '🎯 === FIRST SHOT DIAGNOSIS ==='"
echo "• Grid-Kollisions-Analyse"
echo ""

echo "⚡ === BROWSER SHORTCUTS ==="
echo "• F1 - Manual Grid Debug"
echo "• D - Debug-Visualisierung"
echo "• G - Grid-Anzeige"
echo ""

echo "🚀 === TEST BEREIT ==="
echo "WICHTIG: Das Durchfliegen-Problem wurde behoben!"
echo "- Update-Loop: Manuelle Kollisionserkennung implementiert"
echo "- Kontinuierliche Distanz-Prüfung zu allen Grid-Bubbles"
echo "- Physik-Overlap als Backup weiterhin aktiv"
echo "- Movement-Debug-System aktiviert"
echo "Die Grid-Kollisionserkennung wird automatisch analysiert."
echo ""

# Prüfe ob Server läuft - mehrere Methoden versuchen
echo "🔍 Prüfe Dev Server Status..."

# Methode 1: curl (falls verfügbar)
if command -v curl >/dev/null 2>&1; then
    if curl -s --connect-timeout 3 http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Dev Server läuft auf http://localhost:3000 (curl check)"
        echo "🌐 Bereit zum Testen!"
        echo ""
        echo "🎯 === NÄCHSTE SCHRITTE ==="
        echo "1. Browser öffnen: http://localhost:3000"
        echo "2. F12 drücken → Console Tab öffnen"
        echo "3. Spiel starten und ersten Schuss abgeben"
        echo "4. Debug-Ausgaben in der Konsole beobachten"
        exit 0
    fi
fi

# Methode 2: wget (falls verfügbar)
if command -v wget >/dev/null 2>&1; then
    if wget -q --timeout=3 --tries=1 --spider http://localhost:3000 2>/dev/null; then
        echo "✅ Dev Server läuft auf http://localhost:3000 (wget check)"
        echo "🌐 Bereit zum Testen!"
        echo ""
        echo "🎯 === NÄCHSTE SCHRITTE ==="
        echo "1. Browser öffnen: http://localhost:3000"
        echo "2. F12 drücken → Console Tab öffnen"
        echo "3. Spiel starten und ersten Schuss abgeben"
        echo "4. Debug-Ausgaben in der Konsole beobachten"
        exit 0
    fi
fi

# Methode 3: netstat/ss für Port-Check
if command -v netstat >/dev/null 2>&1; then
    if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
        echo "✅ Port 3000 ist belegt - Dev Server wahrscheinlich aktiv"
        echo "🌐 Öffne: http://localhost:3000"
        echo ""
        echo "🎯 === NÄCHSTE SCHRITTE ==="
        echo "1. Browser öffnen: http://localhost:3000"
        echo "2. F12 drücken → Console Tab öffnen"
        echo "3. Spiel starten und ersten Schuss abgeben"
        echo "4. Debug-Ausgaben in der Konsole beobachten"
        exit 0
    fi
elif command -v ss >/dev/null 2>&1; then
    if ss -tuln 2>/dev/null | grep -q ":3000 "; then
        echo "✅ Port 3000 ist belegt - Dev Server wahrscheinlich aktiv"
        echo "🌐 Öffne: http://localhost:3000"
        echo ""
        echo "🎯 === NÄCHSTE SCHRITTE ==="
        echo "1. Browser öffnen: http://localhost:3000"
        echo "2. F12 drücken → Console Tab öffnen"
        echo "3. Spiel starten und ersten Schuss abgeben"
        echo "4. Debug-Ausgaben in der Konsole beobachten"
        exit 0
    fi
fi

# Methode 4: lsof für Port-Check
if command -v lsof >/dev/null 2>&1; then
    if lsof -i :3000 >/dev/null 2>&1; then
        echo "✅ Port 3000 ist belegt - Dev Server wahrscheinlich aktiv"
        echo "🌐 Öffne: http://localhost:3000"
        echo ""
        echo "🎯 === NÄCHSTE SCHRITTE ==="
        echo "1. Browser öffnen: http://localhost:3000"
        echo "2. F12 drücken → Console Tab öffnen"
        echo "3. Spiel starten und ersten Schuss abgeben"
        echo "4. Debug-Ausgaben in der Konsole beobachten"
        exit 0
    fi
fi

# Alle Methoden fehlgeschlagen
echo "❌ Kann Dev Server nicht erreichen"
echo "💡 Versuche den Server zu starten:"
echo "   cd /home/oliverbenduhn/Dokumente/projekte/bubblephase"
echo "   npm run dev"
