# AblaufDiagramm Hilfe

## Tastenkürzel

| Tastenkürzel | Aktion |
| --- | --- |
| `Ctrl + Z` | Letzte Aktion rückgängig machen |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Rückgängig gemachte Aktion wiederherstellen |
| `Ctrl + D` | Ausgewählte Knoten duplizieren, auch bei Mehrfachauswahl |
| `Delete` / `Backspace` | Ausgewählte Knoten oder Beziehung löschen, in Eingabefeldern ignoriert |
| `Ctrl + A` | Alle Personenknoten auswählen |
| `Ctrl + =` / `Ctrl + +` | Hineinzoomen |
| `Ctrl + -` | Herauszoomen |
| `Escape` | Auswahl aufheben / laufende Verbindung abbrechen |
| `Space + Drag` | Leertaste halten und ziehen, um die Leinwand zu verschieben |
| `Mouse Wheel` | Leinwand zoomen (10% ~ 1000%) |
| `Ctrl + Click` | Mehrfachauswahl / einzelne Knoten abwählen |
| `Drag on empty canvas` | Mehrere Knoten per Auswahlrahmen auswählen |

## Bedienungsanleitung

### Knoten hinzufügen

1. Klicken Sie in der kompakten linken Werkzeugleiste auf `+`, um einen neuen Personenknoten auf der Leinwand zu erstellen.
2. Wählen Sie einen Knoten aus und klicken Sie dann auf `↳` in der linken Werkzeugleiste oder auf `+` in der Kontextleiste des Knotens, um darunter ein Kind mit automatischer Eltern-Kind-Beziehung zu erstellen.
3. Wählen Sie einen Knoten aus und klicken Sie dann auf `⇄` in der Kontextleiste des Knotens, um daneben einen Ehepartner mit automatischer Ehepartner-Beziehung zu erstellen.
4. Die Kontextleiste bietet außerdem `⧉` zum Duplizieren und `×` zum Löschen des Knotens.

### Knoten und Beziehungen auswählen

1. Klicken Sie auf einen Knoten, um ihn auszuwählen; ein blauer Auswahlrahmen erscheint.
2. Klicken Sie auf eine Beziehung, um sie auszuwählen; der kontextbezogene Inspektor rechts zeigt ihre Eigenschaften.
3. Klicken Sie auf eine leere Leinwandfläche, um die aktuelle Auswahl zu löschen.
4. Halten Sie `Ctrl` gedrückt und klicken Sie auf Knoten, um mehrere auszuwählen oder einzelne abzuwählen.
5. Ziehen Sie auf einer leeren Leinwandfläche, um mehrere Knoten per Auswahlrahmen auszuwählen.

### Beziehungen erstellen

1. Bewegen Sie den Mauszeiger über den Rand eines Knotens, um vier Verbindungspunkte oben, unten, links und rechts anzuzeigen.
2. Ziehen Sie von einem Verbindungspunkt und lassen Sie auf einem Verbindungspunkt des Zielknotens los.
3. Wählen Sie vor dem Ziehen den Beziehungstyp im Menü `⇄` der linken Werkzeugleiste: **Eltern-Kind** oder **Ehepartner**.
4. Die Farbe der Beziehung wird von der benutzerdefinierten Farbe des Quellknotens übernommen; ausgewählte Beziehungen werden blau hervorgehoben.
5. Klicken Sie auf eine leere Leinwandfläche, um eine laufende Verbindung abzubrechen.

### Eigenschaften-Inspektor

Wenn ein Knoten ausgewählt ist, erscheint rechts der kontextbezogene Inspektor und erlaubt die Bearbeitung folgender Eigenschaften:

| Feld | Beschreibung |
| --- | --- |
| Avatar | Eingebettetes Bild links; unterstützt URL-Eingabe (http/https/data URI) oder lokalen Bildupload |
| Titel | Erste Zeile des Knotens, fett dargestellt |
| Untertitel 1 | Zweite Zeile |
| Untertitel 2 | Dritte Zeile |
| Identität | Identitätstext |
| Zeit | Zeittext |
| Zusatzinfo | Optionaler Zusatztext |
| Abzeichen | Optionaler runder Textmarker oben rechts |
| Knotenfarbe | Benutzerdefinierte Hintergrundfarbe |
| Position | X / Y des Knotens in Weltkoordinaten der Leinwand |

Wenn eine Beziehung ausgewählt ist, können Sie ihren Typ ändern (Eltern-Kind / Ehepartner) oder sie löschen.

### Knotengrößen

- Knoten ohne Avatar haben fest `180 × 100`.
- Knoten mit Avatar haben fest `270 × 120`.
- Hinzufügen, Importieren oder Bearbeiten von Avataren normalisiert Knoten immer auf eine dieser beiden Größen.

### Speichern und Export

| Funktion | Beschreibung |
| --- | --- |
| Automatisches Speichern | Speichert beim Bearbeiten automatisch im lokalen Speicher des Browsers (localStorage) |
| JSON exportieren | Exportiert das aktuelle Projekt als `.json` mit Knoten, Beziehungen, Ansichtsstatus und Leinwandgrenzen |
| JSON importieren | Stellt ein vollständiges Projekt aus einer `.json`-Datei wieder her |
| PNG exportieren | Exportiert die gesamte Leinwand als PNG-Bild |
| SVG exportieren | Exportiert die gesamte Leinwand als SVG-Vektorgrafik |
| WebP exportieren | Exportiert die gesamte Leinwand im WebP-Format |

Der Bildexport läuft über ein Offscreen-Exportobjekt. `html-to-image` erfasst oder verändert nicht vorübergehend die echte interaktive Leinwand, daher sollte der Export keine sichtbaren Sprünge verursachen.

### Minikarte

- Die Minikarte unten rechts zeigt eine globale Vorschau der Leinwand.
- Das blaue Rechteck zeigt den aktuell sichtbaren Bereich.
- Ziehen Sie das blaue Rechteck, um schnell zu einer beliebigen Position zu navigieren.
- Klicken Sie auf `-` / `+`, um die Minikarte ein- oder auszuklappen.

### Zoom-Panel

- Klicken Sie auf die Prozentzahl in der Werkzeugleiste, um das Zoom-Panel zu öffnen.
- Passen Sie den Zoom mit `-` / `+`, Schieberegler oder direkter Prozentangabe an (10% ~ 1000%).

### Leinwandgröße ändern

- Klicken Sie oben auf **Leinwand**, um das Größenpanel direkt zu öffnen.
- Erweitern oder verkleinern Sie die Leinwandgrenzen nach oben, unten, links oder rechts.
- Legen Sie die Schrittgröße für jede Anpassung fest.

### Ausrichtung

- Knoten können beim Ziehen an Rasterpunkten einrasten.
- Sie können sich auch an Kanten oder Mittelpunkten benachbarter Knoten ausrichten; orange Hilfslinien werden angezeigt.
- Diese Funktion kann in den Einstellungen aktiviert oder deaktiviert werden.

### Entwicklermodus

- Der Entwicklermodus wird im Einstellungsdialog gesteuert und ist standardmäßig aktiviert.
- Wenn er aktiv ist, zeigt das Menü **Ansicht** **Klon-Leinwand anzeigen** und **CPP Status**.
- Wenn er aktiv ist, zeigt der Kontextinspektor Block-IDs, Beziehungs-IDs, Quell-/Ziel-IDs und verbundene Beziehungs-IDs.
- **CPP Status** zeigt Knoten-, Beziehungs- und Diagnoseausgaben des C++ GraphCore.
- **Klon-Leinwand anzeigen** zeigt eine Miniaturvorschau der versteckten Klon-Leinwand.

### Editor-Layout

- Die obere Werkzeugleiste gruppiert Befehle in **Datei**, **Bearbeiten**, **Ansicht**, **Leinwand**, Einstellungen und Hilfe.
- Die kompakte linke Werkzeugleiste bietet Schnellaktionen zum Hinzufügen von Knoten, Kindern, Beziehungstypen und Diagrammstatistiken.
- Die Kontextleiste des Knotens erscheint bei einem einzeln ausgewählten Knoten und bietet Kind hinzufügen, Ehepartner hinzufügen, Duplizieren und Löschen.
- Der rechte Inspektor erscheint nur nach Auswahl eines Knotens oder einer Beziehung; seine Breite kann geändert werden und wird automatisch gespeichert.

### Projekttitel

- Doppelklicken Sie auf den Titel in der Mitte der Werkzeugleiste, um das Projekt umzubenennen.
- Drücken Sie Enter zum Bestätigen, Escape zum Abbrechen.
- Der Titel erscheint in exportierten Dateinamen.

## Knotentypen

| Typ | Beschreibung |
| --- | --- |
| **Personenknoten** | Sichtbarer rechteckiger Knoten mit Titel, Untertiteln, Identität, Zeit usw.; unterstützt Avatar, Abzeichen und benutzerdefinierte Farbe |

## Tipps

- Alle Beziehungen nutzen orthogonale rechtwinklige Pfade und übernehmen die Farbe des Quellknotens.
- Klicken Sie auf eine leere Leinwandfläche, um die Auswahl schnell zu löschen.
- Halten Sie `Ctrl`, um einzelne Knoten mehrfach auszuwählen; ziehen Sie auf leerer Fläche für eine Rahmenauswahl.
- Zoombereich: 10% ~ 1000%, über Mausrad, Touchpad oder `Ctrl+=` / `Ctrl+-`.
- Die oberen Menüs bieten Import/Export, Rückgängig/Wiederholen, Löschen, Duplizieren, Ansicht anpassen, Raster, Designwechsel und Entwicklerwerkzeuge.
- Alle Einstellungen werden sofort wirksam und automatisch gespeichert.
