# Scripts

## fix-coverage-sorter.cjs

Dieses Script behebt automatisch Null-Checking-Probleme in der generierten `coverage/lcov-report/sorter.js` Datei.

### Problem

Die von Istanbul/nyc generierte `sorter.js` Datei hat inkonsistente Fehlerbehandlung bei DOM-Abfragen:

- `getTable()` prüft korrekt auf null
- `getTableHeader()`, `getTableBody()`, `getNthColumn()` tun dies nicht
- `loadColumns()` und `loadData()` rufen diese Funktionen auf, ohne Null-Checks

### Lösung

Das Script fügt robuste Null-Checks zu allen DOM-abhängigen Funktionen hinzu:

```javascript
// Vorher
function getTableHeader() {
    return getTable().querySelector('thead tr'); // Kann crashen wenn getTable() null ist
}

// Nachher  
function getTableHeader() {
    const table = getTable();
    return table ? table.querySelector('thead tr') : null;
}
```

### Verwendung

Das Script wird automatisch nach der Coverage-Generierung ausgeführt:

```bash
npm run test:coverage
```

Oder manuell:

```bash
node scripts/fix-coverage-sorter.cjs
```

### Automatische Integration

Das Script ist in das `test:coverage` npm Script integriert und läuft automatisch nach Jest, auch wenn Tests fehlschlagen (durch Verwendung von `;` statt `&&`).
